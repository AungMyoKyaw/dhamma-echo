use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::{Connection, OpenFlags, OptionalExtension, Result, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::i18n::Locale;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemePreference {
    Light,
    Dark,
    #[default]
    System,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BrowseLimit {
    L25 = 25,
    L50 = 50,
    L100 = 100,
}

impl BrowseLimit {
    pub fn as_i64(self) -> i64 {
        self as i64
    }

    pub fn from_i64(value: i64) -> Self {
        match value {
            25 => Self::L25,
            100 => Self::L100,
            _ => Self::L50,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsState {
    pub playback_rate: f32,
    pub browse_limit: i64,
    pub theme: ThemePreference,
    pub locale: Locale,
}

impl Default for SettingsState {
    fn default() -> Self {
        Self {
            playback_rate: 1.0,
            browse_limit: 50,
            theme: ThemePreference::System,
            locale: Locale::EnUs,
        }
    }
}

impl SettingsState {
    pub fn sanitize(&mut self) {
        const VALID_RATES: [f32; 6] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
        if !VALID_RATES
            .iter()
            .any(|candidate| (*candidate - self.playback_rate).abs() < 0.01)
        {
            self.playback_rate = 1.0;
        }
        self.browse_limit = BrowseLimit::from_i64(self.browse_limit).as_i64();
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UiState {
    pub sidebar_collapsed: bool,
    pub current_talk_id: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HistoryEntry {
    pub talk_id: i64,
    pub played_at: i64,
}

#[derive(Debug, Clone)]
pub struct MigrationSources {
    pub tauri_app_data_dir: Option<PathBuf>,
    pub tauri_webkit_dir: Option<PathBuf>,
    pub legacy_native_playback_db: Option<PathBuf>,
}

impl MigrationSources {
    pub fn platform_defaults(native_dir: &Path) -> Self {
        Self {
            tauri_app_data_dir: crate::platform::tauri_app_data_dir(),
            tauri_webkit_dir: crate::platform::tauri_webkit_dir(),
            legacy_native_playback_db: Some(native_dir.join("playback.sqlite")),
        }
    }
}

pub struct UserStateStore {
    conn: Connection,
}

impl UserStateStore {
    pub fn open(path: &Path, sources: &MigrationSources) -> Result<Self> {
        if let Some(parent) = path.parent()
            && !parent.as_os_str().is_empty()
        {
            let _ = fs::create_dir_all(parent);
        }
        let conn = Connection::open(path)?;
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             CREATE TABLE IF NOT EXISTS favorites (
                 talk_id INTEGER PRIMARY KEY,
                 added_at INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS history (
                 talk_id INTEGER PRIMARY KEY,
                 played_at INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS resume (
                 talk_id INTEGER PRIMARY KEY,
                 position REAL NOT NULL,
                 duration REAL NOT NULL DEFAULT 0,
                 updated_at INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS downloads (
                 talk_id INTEGER PRIMARY KEY,
                 path TEXT NOT NULL,
                 created_at INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS queue (
                 position INTEGER PRIMARY KEY,
                 talk_id INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS kv (
                 key TEXT PRIMARY KEY,
                 value TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS migrations (
                 source TEXT PRIMARY KEY,
                 imported_at INTEGER NOT NULL
             );",
        )?;
        let mut store = Self { conn };
        store.migrate_from_sources(sources)?;
        store.prune_missing_downloads()?;
        Ok(store)
    }

    fn is_migrated(&self, source: &str) -> Result<bool> {
        let found: Option<i64> = self
            .conn
            .query_row(
                "SELECT 1 FROM migrations WHERE source = ?1",
                [source],
                |row| row.get(0),
            )
            .optional()?;
        Ok(found.is_some())
    }

    fn mark_migrated(&self, source: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO migrations (source, imported_at) VALUES (?1, ?2)",
            params![source, now_millis()],
        )?;
        Ok(())
    }

    fn migrate_from_sources(&mut self, sources: &MigrationSources) -> Result<()> {
        let mut tauri_kv: HashMap<String, String> = HashMap::new();
        let mut tauri_user_db_ok = false;
        let mut webkit_ls_ok = false;

        if let Some(app_data_dir) = &sources.tauri_app_data_dir {
            let user_db = app_data_dir.join("user.db");
            if !self.is_migrated("tauri_user_db")?
                && user_db.exists()
                && let Ok(entries) = read_tauri_user_db(&user_db)
            {
                tauri_kv.extend(entries);
                tauri_user_db_ok = true;
            }
        }

        if let Some(webkit_dir) = &sources.tauri_webkit_dir
            && !self.is_migrated("tauri_webkit_localstorage")?
            && webkit_dir.exists()
        {
            let files = find_localstorage_files(webkit_dir);
            let mut all_ok = true;
            for ls_path in &files {
                match read_webkit_localstorage(ls_path) {
                    Ok(entries) => {
                        for (k, v) in entries {
                            tauri_kv.entry(k).or_insert(v);
                        }
                    }
                    Err(_) => {
                        all_ok = false;
                    }
                }
            }
            if !files.is_empty() && all_ok {
                webkit_ls_ok = true;
            }
        }

        if !tauri_kv.is_empty() {
            self.import_tauri_kv(&tauri_kv)?;
        }
        if tauri_user_db_ok {
            self.mark_migrated("tauri_user_db")?;
        }
        if webkit_ls_ok {
            self.mark_migrated("tauri_webkit_localstorage")?;
        }

        if let Some(legacy_db) = &sources.legacy_native_playback_db
            && !self.is_migrated("native_preview_playback")?
            && legacy_db.exists()
            && let Ok(maybe_resume) = read_legacy_native_resume(legacy_db)
        {
            if let Some((talk_id, position, duration)) = maybe_resume
                && talk_id > 0
            {
                self.save_resume(talk_id, position, duration)?;
                let mut ui = self.load_ui()?;
                if ui.current_talk_id.is_none() {
                    ui.current_talk_id = Some(talk_id);
                    self.save_ui(&ui)?;
                }
                self.record_history(talk_id, now_millis())?;
            }
            self.mark_migrated("native_preview_playback")?;
        }

        if let Some(app_data_dir) = &sources.tauri_app_data_dir
            && !self.is_migrated("tauri_download_scan")?
            && app_data_dir.exists()
            && let Ok(entries) = fs::read_dir(app_data_dir)
        {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }
                if let Some(id) = parse_favorite_mp3_id(&path) {
                    let existing: Option<String> = self
                        .conn
                        .query_row(
                            "SELECT path FROM downloads WHERE talk_id = ?1",
                            [id],
                            |row| row.get(0),
                        )
                        .optional()?;
                    if existing.is_none() {
                        self.record_download(id, &path)?;
                    }
                }
            }
            self.mark_migrated("tauri_download_scan")?;
        }

        Ok(())
    }

    fn import_tauri_kv(&mut self, kv: &HashMap<String, String>) -> Result<()> {
        if let Some(raw_lib) = kv.get("dhamma-echo:library")
            && let Ok(Value::Object(map)) = serde_json::from_str::<Value>(raw_lib)
        {
            if let Some(Value::Array(favorites)) = map.get("favorites") {
                let existing: HashSet<i64> = self.load_favorites()?.into_iter().collect();
                let mut base = now_millis();
                for item in favorites {
                    if let Some(id) = item.as_i64()
                        && id > 0
                        && !existing.contains(&id)
                    {
                        self.conn.execute(
                            "INSERT OR IGNORE INTO favorites (talk_id, added_at) VALUES (?1, ?2)",
                            params![id, base],
                        )?;
                        base += 1;
                    }
                }
            }

            if let Some(Value::Array(history)) = map.get("history") {
                for item in history {
                    if let (Some(id), Some(played_at)) = (
                        item.get("id").and_then(Value::as_i64),
                        item.get("playedAt").and_then(Value::as_i64),
                    ) && id > 0
                    {
                        self.conn.execute(
                            "INSERT INTO history (talk_id, played_at) VALUES (?1, ?2)
                             ON CONFLICT(talk_id) DO UPDATE SET played_at = MAX(history.played_at, excluded.played_at)",
                            params![id, played_at],
                        )?;
                    }
                }
                self.trim_history()?;
            }

            if let Some(Value::Object(resume)) = map.get("resume") {
                let now = now_millis();
                for (key, value) in resume {
                    if let (Ok(id), Some(pos)) = (key.parse::<i64>(), value.as_f64())
                        && id > 0
                        && pos.is_finite()
                        && pos >= 0.0
                    {
                        self.conn.execute(
                            "INSERT OR IGNORE INTO resume (talk_id, position, duration, updated_at)
                             VALUES (?1, ?2, 0.0, ?3)",
                            params![id, pos, now],
                        )?;
                    }
                }
            }

            if let Some(Value::Object(downloads)) = map.get("downloads") {
                for (key, value) in downloads {
                    if let (Ok(id), Some(path_str)) = (key.parse::<i64>(), value.as_str())
                        && id > 0
                        && !path_str.is_empty()
                    {
                        let p = PathBuf::from(path_str);
                        if p.is_file() {
                            self.record_download(id, &p)?;
                        }
                    }
                }
            }
        }

        if let Some(raw_settings) = kv.get("dhamma-echo:settings")
            && let Ok(Value::Object(map)) = serde_json::from_str::<Value>(raw_settings)
        {
            let has_settings: Option<String> = self
                .conn
                .query_row("SELECT value FROM kv WHERE key = 'settings'", [], |r| {
                    r.get(0)
                })
                .optional()?;
            if has_settings.is_none() {
                let mut settings = SettingsState::default();
                if let Some(rate) = map.get("playbackRate").and_then(Value::as_f64) {
                    settings.playback_rate = rate as f32;
                }
                if let Some(limit) = map.get("browseLimit").and_then(Value::as_i64) {
                    settings.browse_limit = limit;
                }
                if let Some(theme) = map.get("theme").and_then(Value::as_str) {
                    settings.theme = match theme {
                        "light" => ThemePreference::Light,
                        "dark" => ThemePreference::Dark,
                        _ => ThemePreference::System,
                    };
                }
                if let Some(locale) = map.get("locale").and_then(Value::as_str) {
                    settings.locale = Locale::from_code(locale);
                }
                settings.sanitize();
                self.save_settings(&settings)?;
            }
        }

        let mut ui = self.load_ui()?;
        let mut ui_changed = false;
        let has_ui: Option<String> = self
            .conn
            .query_row("SELECT value FROM kv WHERE key = 'ui'", [], |r| r.get(0))
            .optional()?;
        if has_ui.is_none()
            && let Some(raw_ui) = kv.get("dhamma-echo:ui")
            && let Ok(Value::Object(map)) = serde_json::from_str::<Value>(raw_ui)
            && let Some(collapsed) = map.get("sidebarCollapsed").and_then(Value::as_bool)
        {
            ui.sidebar_collapsed = collapsed;
            ui_changed = true;
        }

        if let Some(raw_queue) = kv.get("dhamma-echo:queue")
            && let Ok(Value::Object(map)) = serde_json::from_str::<Value>(raw_queue)
        {
            if ui.current_talk_id.is_none()
                && let Some(current_id) = map.get("currentId").and_then(Value::as_i64)
                && current_id > 0
            {
                ui.current_talk_id = Some(current_id);
                ui_changed = true;
            }
            if self.load_queue_ids()?.is_empty()
                && let Some(Value::Array(items)) = map.get("items")
            {
                let mut ids = Vec::new();
                for item in items {
                    let id = item
                        .as_i64()
                        .or_else(|| item.get("id").and_then(Value::as_i64));
                    if let Some(id) = id
                        && id > 0
                        && !ids.contains(&id)
                    {
                        ids.push(id);
                    }
                }
                self.save_queue_ids(&ids)?;
            }
        }
        if ui_changed {
            self.save_ui(&ui)?;
        }
        Ok(())
    }

    pub fn load_settings(&self) -> Result<SettingsState> {
        let raw: Option<String> = self
            .conn
            .query_row("SELECT value FROM kv WHERE key = 'settings'", [], |r| {
                r.get(0)
            })
            .optional()?;
        let mut settings = raw
            .and_then(|json| serde_json::from_str::<SettingsState>(&json).ok())
            .unwrap_or_default();
        settings.sanitize();
        Ok(settings)
    }

    pub fn save_settings(&self, settings: &SettingsState) -> Result<()> {
        let mut clean = settings.clone();
        clean.sanitize();
        let json = serde_json::to_string(&clean).unwrap_or_else(|_| "{}".to_string());
        self.conn.execute(
            "INSERT OR REPLACE INTO kv (key, value) VALUES ('settings', ?1)",
            [json],
        )?;
        Ok(())
    }

    pub fn load_ui(&self) -> Result<UiState> {
        let raw: Option<String> = self
            .conn
            .query_row("SELECT value FROM kv WHERE key = 'ui'", [], |r| r.get(0))
            .optional()?;
        Ok(raw
            .and_then(|json| serde_json::from_str::<UiState>(&json).ok())
            .unwrap_or_default())
    }

    pub fn save_ui(&self, ui: &UiState) -> Result<()> {
        let json = serde_json::to_string(ui).unwrap_or_else(|_| "{}".to_string());
        self.conn.execute(
            "INSERT OR REPLACE INTO kv (key, value) VALUES ('ui', ?1)",
            [json],
        )?;
        Ok(())
    }

    pub fn load_favorites(&self) -> Result<Vec<i64>> {
        let mut stmt = self
            .conn
            .prepare("SELECT talk_id FROM favorites ORDER BY added_at ASC, talk_id ASC")?;
        stmt.query_map([], |row| row.get(0))?.collect()
    }

    pub fn toggle_favorite(&self, talk_id: i64) -> Result<bool> {
        let exists: Option<i64> = self
            .conn
            .query_row(
                "SELECT 1 FROM favorites WHERE talk_id = ?1",
                [talk_id],
                |row| row.get(0),
            )
            .optional()?;
        if exists.is_some() {
            self.conn
                .execute("DELETE FROM favorites WHERE talk_id = ?1", [talk_id])?;
            Ok(false)
        } else {
            self.conn.execute(
                "INSERT INTO favorites (talk_id, added_at) VALUES (?1, ?2)",
                params![talk_id, now_millis()],
            )?;
            Ok(true)
        }
    }

    pub fn load_history(&self) -> Result<Vec<HistoryEntry>> {
        let mut stmt = self
            .conn
            .prepare("SELECT talk_id, played_at FROM history ORDER BY played_at DESC LIMIT 100")?;
        stmt.query_map([], |row| {
            Ok(HistoryEntry {
                talk_id: row.get(0)?,
                played_at: row.get(1)?,
            })
        })?
        .collect()
    }

    pub fn record_history(&self, talk_id: i64, played_at: i64) -> Result<()> {
        self.conn.execute(
            "INSERT INTO history (talk_id, played_at) VALUES (?1, ?2)
             ON CONFLICT(talk_id) DO UPDATE SET played_at = excluded.played_at",
            params![talk_id, played_at],
        )?;
        self.trim_history()
    }

    fn trim_history(&self) -> Result<()> {
        self.conn.execute(
            "DELETE FROM history WHERE talk_id NOT IN (
                SELECT talk_id FROM history ORDER BY played_at DESC LIMIT 100
             )",
            [],
        )?;
        Ok(())
    }

    pub fn load_resume_map(&self) -> Result<HashMap<i64, (f64, f64)>> {
        let mut stmt = self
            .conn
            .prepare("SELECT talk_id, position, duration FROM resume")?;
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, f64>(1)?.max(0.0),
                row.get::<_, f64>(2)?.max(0.0),
            ))
        })?;
        let mut map = HashMap::new();
        for row in rows {
            let (id, pos, dur) = row?;
            map.insert(id, (pos, dur));
        }
        Ok(map)
    }

    pub fn save_resume(&self, talk_id: i64, position: f64, duration: f64) -> Result<()> {
        let pos = if position.is_finite() {
            position.max(0.0)
        } else {
            0.0
        };
        let dur = if duration.is_finite() {
            duration.max(0.0)
        } else {
            0.0
        };
        self.conn.execute(
            "INSERT INTO resume (talk_id, position, duration, updated_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(talk_id) DO UPDATE SET
                position = excluded.position,
                duration = CASE WHEN excluded.duration > 0 THEN excluded.duration ELSE resume.duration END,
                updated_at = excluded.updated_at",
            params![talk_id, pos, dur, now_millis()],
        )?;
        self.conn.execute(
            "DELETE FROM resume WHERE talk_id NOT IN (
                SELECT talk_id FROM resume ORDER BY updated_at DESC LIMIT 500
             )",
            [],
        )?;
        Ok(())
    }

    pub fn load_downloads(&self) -> Result<HashMap<i64, PathBuf>> {
        let mut stmt = self
            .conn
            .prepare("SELECT talk_id, path FROM downloads ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
        })?;
        let mut map = HashMap::new();
        for row in rows {
            let (id, path) = row?;
            let pb = PathBuf::from(path);
            if pb.is_file() {
                map.insert(id, pb);
            }
        }
        Ok(map)
    }

    pub fn record_download(&self, talk_id: i64, path: &Path) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO downloads (talk_id, path, created_at) VALUES (?1, ?2, ?3)",
            params![talk_id, path.to_string_lossy().as_ref(), now_millis()],
        )?;
        Ok(())
    }

    pub fn remove_download(&self, talk_id: i64) -> Result<()> {
        self.conn
            .execute("DELETE FROM downloads WHERE talk_id = ?1", [talk_id])?;
        Ok(())
    }

    fn prune_missing_downloads(&self) -> Result<()> {
        let mut stmt = self.conn.prepare("SELECT talk_id, path FROM downloads")?;
        let missing: Vec<i64> = stmt
            .query_map([], |row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
            })?
            .filter_map(|row| {
                let (id, path) = row.ok()?;
                (!Path::new(&path).is_file()).then_some(id)
            })
            .collect();
        for id in missing {
            self.remove_download(id)?;
        }
        Ok(())
    }

    pub fn load_queue_ids(&self) -> Result<Vec<i64>> {
        let mut stmt = self
            .conn
            .prepare("SELECT talk_id FROM queue ORDER BY position ASC")?;
        stmt.query_map([], |row| row.get(0))?.collect()
    }

    pub fn save_queue_ids(&mut self, ids: &[i64]) -> Result<()> {
        let tx = self.conn.transaction()?;
        tx.execute("DELETE FROM queue", [])?;
        {
            let mut stmt = tx.prepare("INSERT INTO queue (position, talk_id) VALUES (?1, ?2)")?;
            for (idx, id) in ids.iter().enumerate() {
                stmt.execute(params![idx as i64, *id])?;
            }
        }
        tx.commit()
    }
}

pub fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn parse_favorite_mp3_id(path: &Path) -> Option<i64> {
    let name = path.file_name()?.to_str()?;
    let stem = name.strip_prefix("favorite-")?.strip_suffix(".mp3")?;
    let id = stem.parse::<i64>().ok()?;
    (id > 0).then_some(id)
}

struct SnapshotGuard {
    dir: PathBuf,
}

impl Drop for SnapshotGuard {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.dir);
    }
}

/// Copies a SQLite database (and its `-wal` journal if present) into a private
/// temporary directory before opening it read-only, so WAL-mode source
/// directories (such as Tauri's `user.db-shm`) are never touched or modified.
fn open_sqlite_snapshot_ro(path: &Path) -> Result<(Connection, SnapshotGuard)> {
    static COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    let seq = COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let temp_dir = std::env::temp_dir().join(format!(
        "dhamma-echo-migrate-{}-{}-{}",
        std::process::id(),
        now_millis(),
        seq
    ));
    fs::create_dir_all(&temp_dir)
        .map_err(|err| rusqlite::Error::ToSqlConversionFailure(Box::new(err)))?;
    let guard = SnapshotGuard {
        dir: temp_dir.clone(),
    };
    let db_copy = temp_dir.join("snapshot.db");
    fs::copy(path, &db_copy)
        .map_err(|err| rusqlite::Error::ToSqlConversionFailure(Box::new(err)))?;
    let mut wal_src = path.as_os_str().to_os_string();
    wal_src.push("-wal");
    let wal_src = PathBuf::from(wal_src);
    if wal_src.is_file() {
        let _ = fs::copy(&wal_src, temp_dir.join("snapshot.db-wal"));
    }
    let conn = Connection::open_with_flags(
        &db_copy,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )?;
    let _ = conn.pragma_update(None, "query_only", true);
    Ok((conn, guard))
}

fn read_tauri_user_db(path: &Path) -> Result<HashMap<String, String>> {
    let (conn, _guard) = open_sqlite_snapshot_ro(path)?;
    let mut stmt = conn.prepare("SELECT key, value FROM user_state")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut out = HashMap::new();
    for row in rows {
        let (k, v) = row?;
        out.insert(k, v);
    }
    Ok(out)
}

fn find_localstorage_files(root: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                stack.push(p);
            } else if p
                .file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| n == "localstorage.sqlite3")
            {
                out.push(p);
            }
        }
    }
    out
}

fn read_webkit_localstorage(path: &Path) -> Result<HashMap<String, String>> {
    let (conn, _guard) = open_sqlite_snapshot_ro(path)?;
    let mut stmt = conn.prepare("SELECT key, value FROM ItemTable")?;
    let rows = stmt.query_map([], |row| {
        let key: String = row.get(0)?;
        let val = match row.get_ref(1)? {
            rusqlite::types::ValueRef::Text(bytes) => String::from_utf8_lossy(bytes).into_owned(),
            rusqlite::types::ValueRef::Blob(bytes) => decode_utf16_le(bytes),
            _ => String::new(),
        };
        Ok((key, val))
    })?;
    let mut out = HashMap::new();
    for row in rows {
        let (k, v) = row?;
        if !v.is_empty() {
            out.insert(k, v);
        }
    }
    Ok(out)
}

fn decode_utf16_le(bytes: &[u8]) -> String {
    let units: Vec<u16> = bytes
        .as_chunks::<2>()
        .0
        .iter()
        .map(|chunk| u16::from_le_bytes(*chunk))
        .collect();
    String::from_utf16_lossy(&units)
}

fn read_legacy_native_resume(path: &Path) -> Result<Option<(i64, f64, f64)>> {
    let (conn, _guard) = open_sqlite_snapshot_ro(path)?;
    conn.query_row(
        "SELECT talk_id, position, duration FROM resume WHERE singleton = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )
    .optional()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "de-state-test-{tag}-{}-{}",
            std::process::id(),
            now_millis()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).expect("create temp dir");
        dir
    }

    #[test]
    fn migrates_from_tauri_user_db_webkit_legacy_and_downloads_once() {
        let root = temp_dir("migrate");
        let tauri_dir = root.join("tauri");
        let webkit_dir = root.join("webkit/WebsiteData/Default/origin/LocalStorage");
        let native_dir = root.join("native");
        fs::create_dir_all(&tauri_dir).unwrap();
        fs::create_dir_all(&webkit_dir).unwrap();
        fs::create_dir_all(&native_dir).unwrap();

        // 1. Tauri user.db
        let user_db = tauri_dir.join("user.db");
        let uconn = Connection::open(&user_db).unwrap();
        uconn
            .execute_batch(
                "CREATE TABLE user_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                 INSERT INTO user_state VALUES ('dhamma-echo:library', '{\"version\":2,\"favorites\":[10,20],\"history\":[{\"id\":10,\"playedAt\":5000}],\"resume\":{\"10\":42.5}}');
                 INSERT INTO user_state VALUES ('dhamma-echo:settings', '{\"version\":2,\"playbackRate\":1.5,\"browseLimit\":100,\"theme\":\"dark\",\"locale\":\"my-MM\"}');
                 INSERT INTO user_state VALUES ('dhamma-echo:ui', '{\"sidebarCollapsed\":true}');
                 INSERT INTO user_state VALUES ('dhamma-echo:queue', '{\"version\":1,\"currentId\":10,\"items\":[30,40]}');",
            )
            .unwrap();
        drop(uconn);

        // 2. WebKit fallback (should only fill missing keys; also test UTF-16LE blob)
        let ls_db = webkit_dir.join("localstorage.sqlite3");
        let lconn = Connection::open(&ls_db).unwrap();
        lconn
            .execute_batch(
                "CREATE TABLE ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);",
            )
            .unwrap();
        let utf16: Vec<u8> = "{\"version\":2,\"favorites\":[999],\"history\":[],\"resume\":{}}"
            .encode_utf16()
            .flat_map(u16::to_le_bytes)
            .collect();
        lconn
            .execute(
                "INSERT INTO ItemTable VALUES ('dhamma-echo:library', ?1)",
                [utf16],
            )
            .unwrap();
        drop(lconn);

        // 3. Legacy native preview playback.sqlite
        let legacy_db = native_dir.join("playback.sqlite");
        let pconn = Connection::open(&legacy_db).unwrap();
        pconn
            .execute_batch(
                "CREATE TABLE resume (singleton INTEGER PRIMARY KEY, talk_id INTEGER NOT NULL, position REAL NOT NULL, duration REAL NOT NULL);
                 INSERT INTO resume VALUES (1, 55, 12.0, 90.0);",
            )
            .unwrap();
        drop(pconn);

        // 4. On-disk favorite mp3
        let dl_file = tauri_dir.join("favorite-15951.mp3");
        fs::write(&dl_file, b"audio").unwrap();

        let state_db = native_dir.join("state.sqlite");
        let sources = MigrationSources {
            tauri_app_data_dir: Some(tauri_dir.clone()),
            tauri_webkit_dir: Some(root.join("webkit")),
            legacy_native_playback_db: Some(legacy_db),
        };
        let mut store = UserStateStore::open(&state_db, &sources).unwrap();
        assert_eq!(store.load_favorites().unwrap(), vec![10, 20]);
        let settings = store.load_settings().unwrap();
        assert_eq!(settings.playback_rate, 1.5);
        assert_eq!(settings.browse_limit, 100);
        assert_eq!(settings.theme, ThemePreference::Dark);
        assert_eq!(settings.locale, Locale::MyMm);
        let ui = store.load_ui().unwrap();
        assert!(ui.sidebar_collapsed);
        assert_eq!(ui.current_talk_id, Some(10));
        assert_eq!(store.load_queue_ids().unwrap(), vec![30, 40]);
        let resume = store.load_resume_map().unwrap();
        assert_eq!(resume.get(&10).map(|r| r.0), Some(42.5));
        assert_eq!(resume.get(&55), Some(&(12.0, 90.0)));
        assert_eq!(store.load_downloads().unwrap().get(&15951), Some(&dl_file));

        // Mutate state and re-open: idempotency ensures migration doesn't clobber edits.
        store.toggle_favorite(10).unwrap();
        store.save_queue_ids(&[99]).unwrap();
        drop(store);

        let reopened = UserStateStore::open(&state_db, &sources).unwrap();
        assert_eq!(reopened.load_favorites().unwrap(), vec![20]);
        assert_eq!(reopened.load_queue_ids().unwrap(), vec![99]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn handles_corrupt_json_and_crud_roundtrips() {
        let root = temp_dir("corrupt");
        let tauri_dir = root.join("tauri");
        fs::create_dir_all(&tauri_dir).unwrap();
        let uconn = Connection::open(tauri_dir.join("user.db")).unwrap();
        uconn
            .execute_batch(
                "CREATE TABLE user_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                 INSERT INTO user_state VALUES ('dhamma-echo:library', '{broken');
                 INSERT INTO user_state VALUES ('dhamma-echo:settings', 'not-json');",
            )
            .unwrap();
        drop(uconn);

        let state_db = root.join("state.sqlite");
        let sources = MigrationSources {
            tauri_app_data_dir: Some(tauri_dir),
            tauri_webkit_dir: None,
            legacy_native_playback_db: None,
        };
        let store = UserStateStore::open(&state_db, &sources).unwrap();
        assert!(store.load_favorites().unwrap().is_empty());
        assert_eq!(store.load_settings().unwrap().browse_limit, 50);

        assert!(store.toggle_favorite(7).unwrap());
        assert!(!store.toggle_favorite(7).unwrap());
        store.record_history(12, 100).unwrap();
        store.record_history(13, 200).unwrap();
        let history = store.load_history().unwrap();
        assert_eq!(history.len(), 2);
        assert_eq!(history[0].talk_id, 13);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn wal_migration_leaves_source_files_untouched() {
        let root = temp_dir("wal-untouched");
        let tauri_dir = root.join("tauri");
        fs::create_dir_all(&tauri_dir).unwrap();
        let user_db = tauri_dir.join("user.db");
        let uconn = Connection::open(&user_db).unwrap();
        uconn
            .execute_batch(
                "PRAGMA journal_mode = WAL;
                 CREATE TABLE user_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                 INSERT INTO user_state VALUES ('dhamma-echo:library', '{\"version\":2,\"favorites\":[77],\"history\":[],\"resume\":{}}');",
            )
            .unwrap();
        // Keep uconn open so -wal and -shm remain active, mimicking a WAL DB on disk.
        let shm_path = tauri_dir.join("user.db-shm");
        let wal_path = tauri_dir.join("user.db-wal");
        assert!(wal_path.exists());
        let shm_mtime_before = fs::metadata(&shm_path).and_then(|m| m.modified()).ok();
        let wal_mtime_before = fs::metadata(&wal_path).and_then(|m| m.modified()).ok();

        std::thread::sleep(std::time::Duration::from_millis(20));

        let state_db = root.join("state.sqlite");
        let sources = MigrationSources {
            tauri_app_data_dir: Some(tauri_dir.clone()),
            tauri_webkit_dir: None,
            legacy_native_playback_db: None,
        };
        let store = UserStateStore::open(&state_db, &sources).unwrap();
        assert_eq!(store.load_favorites().unwrap(), vec![77]);

        let shm_mtime_after = fs::metadata(&shm_path).and_then(|m| m.modified()).ok();
        let wal_mtime_after = fs::metadata(&wal_path).and_then(|m| m.modified()).ok();
        assert_eq!(shm_mtime_before, shm_mtime_after);
        assert_eq!(wal_mtime_before, wal_mtime_after);

        drop(uconn);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn transient_migration_error_is_retried_on_next_open() {
        let root = temp_dir("retry-migrate");
        let tauri_dir = root.join("tauri");
        fs::create_dir_all(&tauri_dir).unwrap();
        let user_db = tauri_dir.join("user.db");
        fs::write(&user_db, b"not a valid sqlite database").unwrap();

        let state_db = root.join("state.sqlite");
        let sources = MigrationSources {
            tauri_app_data_dir: Some(tauri_dir.clone()),
            tauri_webkit_dir: None,
            legacy_native_playback_db: None,
        };
        let store = UserStateStore::open(&state_db, &sources).unwrap();
        assert!(store.load_favorites().unwrap().is_empty());
        assert!(!store.is_migrated("tauri_user_db").unwrap());
        drop(store);

        // Replace with valid DB; next open should migrate cleanly.
        fs::remove_file(&user_db).unwrap();
        let uconn = Connection::open(&user_db).unwrap();
        uconn
            .execute_batch(
                "CREATE TABLE user_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                 INSERT INTO user_state VALUES ('dhamma-echo:library', '{\"version\":2,\"favorites\":[88],\"history\":[],\"resume\":{}}');",
            )
            .unwrap();
        drop(uconn);

        let store = UserStateStore::open(&state_db, &sources).unwrap();
        assert_eq!(store.load_favorites().unwrap(), vec![88]);
        assert!(store.is_migrated("tauri_user_db").unwrap());

        let _ = fs::remove_dir_all(&root);
    }
}
