use std::{path::Path, sync::Mutex, time::Duration};

use rusqlite::{Connection, OpenFlags, Row, params, params_from_iter, types::Value};

use crate::{
    error::AppError,
    models::{
        AudioCategory, AudioSearchPage, AudioSearchRequest, AudioTrack, CatalogueSummary,
        CollectionDetail, CollectionSearchPage, CollectionSearchRequest, CollectionSummary,
        TeacherDetail, TeacherSummary,
    },
    normalize::normalize_text,
};

pub struct Database {
    connection: Mutex<Connection>,
}

impl Database {
    pub fn open_read_only(path: &Path) -> Result<Self, AppError> {
        let flags = OpenFlags::SQLITE_OPEN_READ_ONLY
            | OpenFlags::SQLITE_OPEN_URI
            | OpenFlags::SQLITE_OPEN_NO_MUTEX;
        let connection = Connection::open_with_flags(path, flags)
            .map_err(|error| AppError::DatabaseOpen(error.to_string()))?;
        connection
            .busy_timeout(Duration::from_millis(750))
            .map_err(|error| AppError::DatabaseOpen(error.to_string()))?;
        connection
            .pragma_update(None, "query_only", true)
            .map_err(|error| AppError::DatabaseOpen(error.to_string()))?;
        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    #[cfg(test)]
    fn from_connection(connection: Connection) -> Self {
        Self {
            connection: Mutex::new(connection),
        }
    }

    fn with_connection<T>(
        &self,
        operation: impl FnOnce(&Connection) -> Result<T, AppError>,
    ) -> Result<T, AppError> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| AppError::DatabaseQuery("Catalogue lock was poisoned.".into()))?;
        operation(&connection)
    }

    pub fn summary(&self) -> Result<CatalogueSummary, AppError> {
        self.with_connection(|connection| {
            connection
                .query_row(
                    "SELECT
                        SUM(CASE WHEN type = 'audio' THEN 1 ELSE 0 END),
                        (SELECT COUNT(*) FROM teachers),
                        SUM(CASE WHEN type = 'audio' AND language = 'myanmar' THEN 1 ELSE 0 END),
                        SUM(CASE WHEN type = 'audio' AND language = 'english' THEN 1 ELSE 0 END)
                     FROM media",
                    [],
                    |row| {
                        Ok(CatalogueSummary {
                            total_audio: row.get(0)?,
                            total_teachers: row.get(1)?,
                            myanmar_audio: row.get(2)?,
                            english_audio: row.get(3)?,
                        })
                    },
                )
                .map_err(AppError::from)
        })
    }

    pub fn featured_teachers(&self, limit: i64) -> Result<Vec<TeacherSummary>, AppError> {
        let limit = validate_limit(limit)?;
        self.with_connection(|connection| {
            let mut statement = connection.prepare(
                "SELECT t.id, t.name, COUNT(m.id) AS audio_count
                 FROM teachers t
                 JOIN media m ON m.teacher_id = t.id AND m.type = 'audio'
                 GROUP BY t.id, t.name
                 ORDER BY audio_count DESC, LOWER(t.name), t.id
                 LIMIT ?1",
            )?;
            statement
                .query_map([limit], map_teacher_summary)?
                .collect::<rusqlite::Result<Vec<_>>>()
                .map_err(AppError::from)
        })
    }

    pub fn audio_categories(&self) -> Result<Vec<AudioCategory>, AppError> {
        self.with_connection(|connection| {
            let mut statement = connection.prepare(
                "SELECT c.id, c.name, c.language, COUNT(m.id)
                 FROM categories c
                 JOIN media m ON m.category_id = c.id AND m.type = 'audio'
                 WHERE c.type IN ('audio', 'abhidhamma')
                 GROUP BY c.id, c.name, c.language
                 HAVING COUNT(m.id) > 0
                 ORDER BY c.id",
            )?;
            statement
                .query_map([], |row| {
                    Ok(AudioCategory {
                        id: row.get(0)?,
                        name: normalized_or(row.get(1)?, "Uncategorized audio"),
                        language: normalize_text(&row.get::<_, String>(2)?).to_lowercase(),
                        audio_count: row.get(3)?,
                    })
                })?
                .collect::<rusqlite::Result<Vec<_>>>()
                .map_err(AppError::from)
        })
    }

    pub fn search_collections(
        &self,
        request: &CollectionSearchRequest,
    ) -> Result<CollectionSearchPage, AppError> {
        let limit = validate_limit(request.limit)?;
        let offset = request.offset.max(0);
        if let Some(teacher_id) = request.teacher_id {
            validate_id(teacher_id)?;
        }
        let pattern = format!("%{}%", normalize_text(&request.query).to_lowercase());
        self.with_connection(|connection| {
            let total = connection.query_row(
                "SELECT COUNT(*) FROM (
                    SELECT c.id
                    FROM collections c
                    JOIN media_collections mc ON mc.collection_id = c.id
                    JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
                    WHERE LOWER(c.name) LIKE ?1
                      AND (?2 IS NULL OR c.teacher_id = ?2)
                    GROUP BY c.id
                 )",
                params![pattern, request.teacher_id],
                |row| row.get(0),
            )?;
            let mut statement = connection.prepare(
                "SELECT c.id, c.name, c.teacher_id, t.name, COUNT(DISTINCT m.id)
                 FROM collections c
                 JOIN media_collections mc ON mc.collection_id = c.id
                 JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
                 LEFT JOIN teachers t ON t.id = c.teacher_id
                 WHERE LOWER(c.name) LIKE ?1
                   AND (?2 IS NULL OR c.teacher_id = ?2)
                 GROUP BY c.id, c.name, c.teacher_id, t.name
                 ORDER BY LOWER(c.name), LOWER(COALESCE(t.name, '')), c.id
                 LIMIT ?3 OFFSET ?4",
            )?;
            let items = statement
                .query_map(params![pattern, request.teacher_id, limit, offset], |row| {
                    map_collection_summary(row)
                })?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            Ok(CollectionSearchPage {
                items,
                total,
                limit,
                offset,
            })
        })
    }

    pub fn collection(&self, id: i64) -> Result<CollectionDetail, AppError> {
        validate_id(id)?;
        self.with_connection(|connection| {
            let (name, description, teacher_id, teacher_name) = connection
                .query_row(
                    "SELECT c.name, c.description, c.teacher_id, t.name
                     FROM collections c
                     LEFT JOIN teachers t ON t.id = c.teacher_id
                     WHERE c.id = ?1",
                    [id],
                    |row| {
                        Ok((
                            normalized_or(row.get(0)?, "Untitled collection"),
                            optional_normalized(row.get(1)?),
                            row.get(2)?,
                            normalized_or(row.get(3)?, "Unknown teacher"),
                        ))
                    },
                )
                .map_err(|error| match error {
                    rusqlite::Error::QueryReturnedNoRows => AppError::NotFound,
                    other => AppError::from(other),
                })?;
            let mut statement = connection.prepare(
                "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                        m.date_recorded, m.location, m.teacher_id, t.name
                 FROM media_collections mc
                 JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
                 LEFT JOIN teachers t ON t.id = m.teacher_id
                 WHERE mc.collection_id = ?1
                 ORDER BY mc.track_number IS NULL, mc.track_number, m.id",
            )?;
            let tracks = statement
                .query_map([id], map_audio_track)?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            Ok(CollectionDetail {
                id,
                name,
                description,
                teacher_id,
                teacher_name,
                audio_count: tracks.len() as i64,
                tracks,
            })
        })
    }

    pub fn search_teachers(
        &self,
        query: &str,
        limit: i64,
    ) -> Result<Vec<TeacherSummary>, AppError> {
        let limit = validate_limit(limit)?;
        let pattern = format!("%{}%", normalize_text(query).to_lowercase());
        self.with_connection(|connection| {
            let mut statement = connection.prepare(
                "SELECT t.id, t.name, COUNT(m.id) AS audio_count
                 FROM teachers t
                 LEFT JOIN media m ON m.teacher_id = t.id AND m.type = 'audio'
                 WHERE LOWER(t.name) LIKE ?1 OR LOWER(COALESCE(t.name_myanmar, '')) LIKE ?1
                 GROUP BY t.id, t.name
                 ORDER BY audio_count DESC, LOWER(t.name), t.id
                 LIMIT ?2",
            )?;
            statement
                .query_map(params![pattern, limit], map_teacher_summary)?
                .collect::<rusqlite::Result<Vec<_>>>()
                .map_err(AppError::from)
        })
    }

    pub fn teacher(&self, id: i64) -> Result<TeacherDetail, AppError> {
        validate_id(id)?;
        self.with_connection(|connection| {
            let mut detail = connection
                .query_row(
                    "SELECT t.id, t.name, t.name_myanmar, t.title, t.description,
                            COUNT(m.id) AS audio_count
                     FROM teachers t
                     LEFT JOIN media m ON m.teacher_id = t.id AND m.type = 'audio'
                     WHERE t.id = ?1
                     GROUP BY t.id",
                    [id],
                    |row| {
                        Ok(TeacherDetail {
                            id: row.get(0)?,
                            name: normalize_text(&row.get::<_, String>(1)?),
                            name_myanmar: optional_normalized(row.get(2)?),
                            title: optional_normalized(row.get(3)?),
                            description: optional_normalized(row.get(4)?),
                            audio_count: row.get(5)?,
                            collections: Vec::new(),
                        })
                    },
                )
                .map_err(|error| match error {
                    rusqlite::Error::QueryReturnedNoRows => AppError::NotFound,
                    other => AppError::from(other),
                })?;
            let mut statement = connection.prepare(
                "SELECT c.id, c.name, c.teacher_id, t.name, COUNT(DISTINCT m.id)
                 FROM collections c
                 JOIN media_collections mc ON mc.collection_id = c.id
                 JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
                 LEFT JOIN teachers t ON t.id = c.teacher_id
                 WHERE c.teacher_id = ?1
                 GROUP BY c.id, c.name, c.teacher_id, t.name
                 ORDER BY LOWER(c.name), c.id",
            )?;
            detail.collections = statement
                .query_map([id], map_collection_summary)?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            Ok(detail)
        })
    }

    pub fn audio_track(&self, id: i64) -> Result<AudioTrack, AppError> {
        validate_id(id)?;
        self.with_connection(|connection| {
            connection
                .query_row(
                    "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                            m.date_recorded, m.location, m.teacher_id, t.name
                     FROM media m
                     LEFT JOIN teachers t ON t.id = m.teacher_id
                     WHERE m.id = ?1 AND m.type = 'audio'",
                    [id],
                    map_audio_track,
                )
                .map_err(|error| match error {
                    rusqlite::Error::QueryReturnedNoRows => AppError::NotFound,
                    other => AppError::from(other),
                })
        })
    }

    pub fn search_audio(&self, request: &AudioSearchRequest) -> Result<AudioSearchPage, AppError> {
        let limit = validate_limit(request.limit)?;
        let offset = request.offset.max(0);
        validate_filter(
            "language",
            request.language.as_deref(),
            &["myanmar", "english"],
        )?;
        validate_filter("format", request.format.as_deref(), &["mp3", "wma"])?;
        if let Some(teacher_id) = request.teacher_id {
            validate_id(teacher_id)?;
        }
        if let Some(category_id) = request.category_id {
            validate_id(category_id)?;
        }
        if let Some(collection_id) = request.collection_id {
            validate_id(collection_id)?;
        }

        let mut clauses = vec!["m.type = 'audio'".to_string()];
        let mut values = Vec::<Value>::new();
        let query = normalize_text(&request.query).to_lowercase();
        if !query.is_empty() {
            let pattern = format!("%{query}%");
            clauses.push("(LOWER(m.title) LIKE ? OR LOWER(COALESCE(t.name, '')) LIKE ?)".into());
            values.push(Value::Text(pattern.clone()));
            values.push(Value::Text(pattern));
        }
        if let Some(language) = &request.language {
            clauses.push("m.language = ?".into());
            values.push(Value::Text(language.clone()));
        }
        if let Some(format) = &request.format {
            clauses.push("m.format = ?".into());
            values.push(Value::Text(format.clone()));
        }
        if let Some(teacher_id) = request.teacher_id {
            clauses.push("m.teacher_id = ?".into());
            values.push(Value::Integer(teacher_id));
        }
        if let Some(category_id) = request.category_id {
            clauses.push("m.category_id = ?".into());
            values.push(Value::Integer(category_id));
        }
        if let Some(collection_id) = request.collection_id {
            clauses.push(
                "EXISTS (SELECT 1 FROM media_collections filter_mc WHERE filter_mc.media_id = m.id AND filter_mc.collection_id = ?)".into(),
            );
            values.push(Value::Integer(collection_id));
        }
        let where_clause = clauses.join(" AND ");

        self.with_connection(|connection| {
            let count_sql = format!(
                "SELECT COUNT(*) FROM media m LEFT JOIN teachers t ON t.id = m.teacher_id WHERE {where_clause}"
            );
            let total: i64 = connection.query_row(
                &count_sql,
                params_from_iter(values.iter()),
                |row| row.get(0),
            )?;

            let page_sql = format!(
                "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                        m.date_recorded, m.location, m.teacher_id, t.name
                 FROM media m
                 LEFT JOIN teachers t ON t.id = m.teacher_id
                 WHERE {where_clause}
                 ORDER BY LOWER(COALESCE(t.name, '')), m.id
                 LIMIT ? OFFSET ?"
            );
            let mut page_values = values;
            page_values.push(Value::Integer(limit));
            page_values.push(Value::Integer(offset));
            let mut statement = connection.prepare(&page_sql)?;
            let items = statement
                .query_map(params_from_iter(page_values.iter()), map_audio_track)?
                .collect::<rusqlite::Result<Vec<_>>>()
                .map_err(AppError::from)?;
            Ok(AudioSearchPage {
                items,
                total,
                limit,
                offset,
            })
        })
    }
}

fn validate_id(id: i64) -> Result<(), AppError> {
    if id > 0 {
        Ok(())
    } else {
        Err(AppError::InvalidInput(
            "id must be a positive integer".into(),
        ))
    }
}

fn validate_limit(limit: i64) -> Result<i64, AppError> {
    if (1..=100).contains(&limit) {
        Ok(limit)
    } else {
        Err(AppError::InvalidInput(
            "limit must be between 1 and 100".into(),
        ))
    }
}

fn validate_filter(name: &str, value: Option<&str>, allowed: &[&str]) -> Result<(), AppError> {
    if value.is_none_or(|candidate| allowed.contains(&candidate)) {
        Ok(())
    } else {
        Err(AppError::InvalidInput(format!("unsupported {name} filter")))
    }
}

fn optional_normalized(value: Option<String>) -> Option<String> {
    value
        .map(|text| normalize_text(&text))
        .filter(|text| !text.is_empty())
}

fn normalized_or(value: Option<String>, fallback: &str) -> String {
    optional_normalized(value).unwrap_or_else(|| fallback.to_string())
}

fn map_teacher_summary(row: &Row<'_>) -> rusqlite::Result<TeacherSummary> {
    Ok(TeacherSummary {
        id: row.get(0)?,
        name: normalize_text(&row.get::<_, String>(1)?),
        audio_count: row.get(2)?,
    })
}

fn map_collection_summary(row: &Row<'_>) -> rusqlite::Result<CollectionSummary> {
    Ok(CollectionSummary {
        id: row.get(0)?,
        name: normalized_or(row.get(1)?, "Untitled collection"),
        teacher_id: row.get(2)?,
        teacher_name: normalized_or(row.get(3)?, "Unknown teacher"),
        audio_count: row.get(4)?,
    })
}

fn is_webview_playable(format: &str, url: &str) -> bool {
    if !format.eq_ignore_ascii_case("mp3") {
        return false;
    }
    let url = url.trim().to_ascii_lowercase();
    [
        "https://www.dhammadownload.com/",
        "https://dhammadownload.com/",
        "http://www.dhammadownload.com/",
        "http://dhammadownload.com/",
    ]
    .iter()
    .any(|prefix| url.starts_with(prefix))
}

fn map_audio_track(row: &Row<'_>) -> rusqlite::Result<AudioTrack> {
    let url: String = row.get(4)?;
    let format = normalize_text(&row.get::<_, String>(2)?).to_lowercase();
    let playable = is_webview_playable(&format, &url);
    Ok(AudioTrack {
        id: row.get(0)?,
        title: normalized_or(row.get(1)?, "Untitled talk"),
        format,
        language: normalize_text(&row.get::<_, String>(3)?).to_lowercase(),
        playable,
        url,
        date_recorded: optional_normalized(row.get(5)?),
        location: optional_normalized(row.get(6)?),
        teacher_id: row.get(7)?,
        teacher_name: normalized_or(row.get(8)?, "Unknown teacher"),
    })
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::{Database, is_webview_playable};
    use crate::{
        error::AppError,
        models::{AudioSearchRequest, CollectionSearchRequest},
    };

    fn fixture() -> Database {
        let connection = Connection::open_in_memory().expect("open fixture");
        connection
            .execute_batch(
                "CREATE TABLE teachers (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    name_myanmar TEXT,
                    title TEXT,
                    description TEXT
                 );
                 CREATE TABLE media (
                    id INTEGER PRIMARY KEY,
                    title TEXT,
                    type TEXT NOT NULL,
                    format TEXT,
                    language TEXT NOT NULL,
                    url TEXT NOT NULL,
                    date_recorded TEXT,
                    location TEXT,
                    teacher_id INTEGER,
                    category_id INTEGER
                 );
                 CREATE TABLE categories (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    language TEXT NOT NULL
                 );
                 CREATE TABLE collections (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    teacher_id INTEGER,
                    type TEXT,
                    source_page TEXT
                 );
                 CREATE TABLE media_collections (
                    media_id INTEGER NOT NULL,
                    collection_id INTEGER NOT NULL,
                    track_number INTEGER,
                    PRIMARY KEY (media_id, collection_id)
                 );
                 INSERT INTO teachers VALUES (1, '  Teacher  One ', NULL, NULL, NULL);
                 INSERT INTO teachers VALUES (2, 'Teacher Two', NULL, NULL, NULL);
                 INSERT INTO categories VALUES (1, 'Audio in Myanmar', 'audio', 'myanmar');
                 INSERT INTO categories VALUES (4, 'Abhidhamma in Myanmar', 'abhidhamma', 'myanmar');
                 INSERT INTO categories VALUES (5, 'Abhidhamma in English', 'abhidhamma', 'english');
                 INSERT INTO categories VALUES (7, 'Audio in English', 'audio', 'english');
                 INSERT INTO categories VALUES (8, 'Video in Myanmar', 'video', 'myanmar');
                 INSERT INTO media VALUES (1, ' Talk One ', 'audio', 'mp3', 'english', 'https://dhammadownload.com/one.mp3', NULL, NULL, 1, 7);
                 INSERT INTO media VALUES (2, 'Talk Two', 'audio', 'wma', 'myanmar', 'http://dhammadownload.com/two.wma', NULL, NULL, 2, 1);
                 INSERT INTO media VALUES (3, 'Video', 'video', 'mp4', 'myanmar', 'https://dhammadownload.com/video.mp4', NULL, NULL, 2, 8);
                 INSERT INTO media VALUES (4, '   ', 'audio', 'mp3', 'myanmar', 'https://dhammadownload.com/four.mp3', NULL, NULL, NULL, 4);
                 INSERT INTO media VALUES (5, 'Abhidhamma English', 'audio', 'mp3', 'english', 'https://dhammadownload.com/five.mp3', NULL, NULL, 1, 5);
                 INSERT INTO collections VALUES (10, 'Course One', 'A course', 1, 'audio', 'https://example.test/course');
                 INSERT INTO media_collections VALUES (1, 10, 2);
                 INSERT INTO media_collections VALUES (2, 10, 1);
                 INSERT INTO media_collections VALUES (4, 10, NULL);",
            )
            .expect("seed fixture");
        Database::from_connection(connection)
    }

    fn source_order_fixture() -> Database {
        let connection = Connection::open_in_memory().expect("open numbered fixture");
        connection
            .execute_batch(
                "CREATE TABLE teachers (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    name_myanmar TEXT,
                    title TEXT,
                    description TEXT
                 );
                 CREATE TABLE media (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    format TEXT,
                    language TEXT NOT NULL,
                    url TEXT NOT NULL,
                    date_recorded TEXT,
                    location TEXT,
                    teacher_id INTEGER
                 );
                 INSERT INTO teachers VALUES (1, 'Teacher', NULL, NULL, NULL);
                 INSERT INTO media VALUES (1, '1: Series A', 'audio', 'mp3', 'english', 'https://dhammadownload.com/1.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (2, '2: Series A', 'audio', 'mp3', 'english', 'https://dhammadownload.com/2.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (3, '10: Series A', 'audio', 'mp3', 'english', 'https://dhammadownload.com/3.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (4, '1: Series B', 'audio', 'mp3', 'english', 'https://dhammadownload.com/4.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (5, '2: Series B', 'audio', 'mp3', 'english', 'https://dhammadownload.com/5.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (6, '10: Series B', 'audio', 'mp3', 'english', 'https://dhammadownload.com/6.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (7, '၁၀-၀၄-၂၀၂၄ တရား', 'audio', 'mp3', 'myanmar', 'https://dhammadownload.com/7.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (8, '၀၉-၀၄-၂၀၂၄ တရား', 'audio', 'mp3', 'myanmar', 'https://dhammadownload.com/8.mp3', NULL, NULL, 1);",
            )
            .expect("seed numbered fixture");
        Database::from_connection(connection)
    }

    #[test]
    fn returns_summary_and_featured_teachers() {
        let database = fixture();
        assert_eq!(database.summary().expect("summary").total_audio, 4);
        let teachers = database.featured_teachers(10).expect("teachers");
        assert_eq!(teachers.len(), 2);
        assert_eq!(teachers[0].name, "Teacher One");
    }

    #[test]
    fn search_audio_preserves_repeated_series_across_pages() {
        let database = source_order_fixture();
        let first = database
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: Some(1),
                category_id: None,
                collection_id: None,
                limit: 4,
                offset: 0,
            })
            .expect("first page");
        let second = database
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: Some(1),
                category_id: None,
                collection_id: None,
                limit: 4,
                offset: 4,
            })
            .expect("second page");

        let ordered_ids = first
            .items
            .into_iter()
            .chain(second.items)
            .map(|track| track.id)
            .collect::<Vec<_>>();
        assert_eq!(ordered_ids, vec![1, 2, 3, 4, 5, 6, 7, 8]);
    }

    #[test]
    fn classifies_only_approved_mp3_hosts_as_playable() {
        assert!(is_webview_playable(
            "mp3",
            "http://dhammadownload.com/talk.mp3"
        ));
        assert!(is_webview_playable(
            "MP3",
            "https://www.dhammadownload.com/talk.mp3"
        ));
        assert!(!is_webview_playable(
            "wma",
            "https://dhammadownload.com/talk.wma"
        ));
        assert!(!is_webview_playable(
            "mp3",
            "https://dhammadownload.com.evil.example/talk.mp3"
        ));
        assert!(!is_webview_playable(
            "mp3",
            "https://dhammadownload.com:8443/talk.mp3"
        ));
    }

    #[test]
    fn searches_and_marks_wma_audio_unplayable() {
        let database = fixture();
        let page = database
            .search_audio(&AudioSearchRequest {
                query: "two".into(),
                language: Some("myanmar".into()),
                format: Some("wma".into()),
                teacher_id: Some(2),
                category_id: None,
                collection_id: None,
                limit: 50,
                offset: 0,
            })
            .expect("audio page");
        assert_eq!(page.total, 1);
        assert!(!page.items[0].playable);
    }

    #[test]
    fn lists_only_meaningful_audio_categories() {
        let categories = fixture().audio_categories().expect("categories");
        assert_eq!(
            categories.iter().map(|item| item.id).collect::<Vec<_>>(),
            vec![1, 4, 5, 7]
        );
    }

    #[test]
    fn collection_tracks_use_track_number_then_media_id() {
        let detail = fixture().collection(10).expect("collection");
        assert_eq!(
            detail
                .tracks
                .iter()
                .map(|track| track.id)
                .collect::<Vec<_>>(),
            vec![2, 1, 4]
        );
    }

    #[test]
    fn playable_rows_survive_incomplete_metadata() {
        let track = fixture().audio_track(4).expect("incomplete playable track");
        assert_eq!(track.title, "Untitled talk");
        assert_eq!(track.teacher_name, "Unknown teacher");
        assert!(track.playable);
    }

    #[test]
    fn searches_collections_and_filters_audio_by_category_and_collection() {
        let database = fixture();
        let collections = database
            .search_collections(&CollectionSearchRequest {
                query: "course".into(),
                teacher_id: Some(1),
                limit: 20,
                offset: 0,
            })
            .expect("collection page");
        assert_eq!(collections.total, 1);
        assert_eq!(collections.items[0].audio_count, 3);

        let page = database
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: None,
                category_id: Some(7),
                collection_id: Some(10),
                limit: 50,
                offset: 0,
            })
            .expect("filtered audio");
        assert_eq!(page.total, 1);
        assert_eq!(page.items[0].id, 1);
    }

    #[test]
    fn bundled_database_exposes_current_catalogue() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/dhamma.db");
        let database = Database::open_read_only(&path).expect("open bundled db");
        assert_eq!(
            database.summary().expect("summary"),
            crate::models::CatalogueSummary {
                total_audio: 30563,
                total_teachers: 257,
                myanmar_audio: 30098,
                english_audio: 465,
            }
        );
        let page = database
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: None,
                category_id: None,
                collection_id: None,
                limit: 50,
                offset: 0,
            })
            .expect("blank search");
        assert_eq!(page.total, 30563);
        assert_eq!(page.items.len(), 50);
    }

    #[test]
    fn validates_filters_limits_and_ids() {
        let database = fixture();
        assert!(matches!(
            database.featured_teachers(0),
            Err(AppError::InvalidInput(_))
        ));
        assert!(matches!(
            database.teacher(0),
            Err(AppError::InvalidInput(_))
        ));
        assert!(matches!(database.audio_track(999), Err(AppError::NotFound)));
        assert!(matches!(
            database.search_audio(&AudioSearchRequest {
                query: String::new(),
                language: Some("pali".into()),
                format: None,
                teacher_id: None,
                category_id: None,
                collection_id: None,
                limit: 50,
                offset: 0,
            }),
            Err(AppError::InvalidInput(_))
        ));
    }
}
