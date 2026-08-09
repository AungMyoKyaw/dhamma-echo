use std::{cmp::Ordering, path::Path, sync::Mutex, time::Duration};

use rusqlite::{Connection, OpenFlags, Row, params, params_from_iter, types::Value};

use crate::{
    error::AppError,
    models::{
        AudioSearchPage, AudioSearchRequest, AudioTrack, CatalogueSummary, TeacherDetail,
        TeacherSummary,
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
            connection
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
                        })
                    },
                )
                .map_err(|error| match error {
                    rusqlite::Error::QueryReturnedNoRows => AppError::NotFound,
                    other => AppError::from(other),
                })
        })
    }

    pub fn audio_track(&self, id: i64) -> Result<AudioTrack, AppError> {
        validate_id(id)?;
        self.with_connection(|connection| {
            connection
                .query_row(
                    "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                            m.date_recorded, m.location, m.teacher_id, COALESCE(t.name, '')
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
                        m.date_recorded, m.location, m.teacher_id, COALESCE(t.name, '')
                 FROM media m
                 LEFT JOIN teachers t ON t.id = m.teacher_id
                 WHERE {where_clause}
                 ORDER BY LOWER(COALESCE(t.name, '')), LOWER(m.title), m.id
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

fn decimal_digit(character: char) -> Option<u8> {
    match character {
        '0'..='9' => Some(character as u8 - b'0'),
        '၀'..='၉' => Some((character as u32 - '၀' as u32) as u8),
        _ => None,
    }
}

fn leading_number(value: &str) -> Option<Vec<u8>> {
    let digits: Vec<u8> = value
        .trim_start()
        .chars()
        .map_while(decimal_digit)
        .collect();
    (!digits.is_empty()).then_some(digits)
}

fn compare_digit_runs(left: &[u8], right: &[u8]) -> Ordering {
    let left = left
        .iter()
        .skip_while(|digit| **digit == 0)
        .copied()
        .collect::<Vec<_>>();
    let right = right
        .iter()
        .skip_while(|digit| **digit == 0)
        .copied()
        .collect::<Vec<_>>();
    left.len().cmp(&right.len()).then_with(|| left.cmp(&right))
}

fn natural_title_order(left: &str, right: &str) -> Ordering {
    let lexical = || left.to_lowercase().cmp(&right.to_lowercase());
    match (leading_number(left), leading_number(right)) {
        (Some(left_number), Some(right_number)) => {
            compare_digit_runs(&left_number, &right_number).then_with(lexical)
        }
        (Some(_), None) => Ordering::Less,
        (None, Some(_)) => Ordering::Greater,
        (None, None) => lexical(),
    }
}

fn map_teacher_summary(row: &Row<'_>) -> rusqlite::Result<TeacherSummary> {
    Ok(TeacherSummary {
        id: row.get(0)?,
        name: normalize_text(&row.get::<_, String>(1)?),
        audio_count: row.get(2)?,
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
        title: normalize_text(&row.get::<_, String>(1)?),
        format,
        language: normalize_text(&row.get::<_, String>(3)?).to_lowercase(),
        playable,
        url,
        date_recorded: optional_normalized(row.get(5)?),
        location: optional_normalized(row.get(6)?),
        teacher_id: row.get(7)?,
        teacher_name: normalize_text(&row.get::<_, String>(8)?),
    })
}

#[cfg(test)]
mod tests {
    use std::cmp::Ordering;

    use rusqlite::Connection;

    use super::{Database, is_webview_playable, natural_title_order};
    use crate::{error::AppError, models::AudioSearchRequest};

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
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    format TEXT,
                    language TEXT NOT NULL,
                    url TEXT NOT NULL,
                    date_recorded TEXT,
                    location TEXT,
                    teacher_id INTEGER
                 );
                 INSERT INTO teachers VALUES (1, '  Teacher  One ', NULL, NULL, NULL);
                 INSERT INTO teachers VALUES (2, 'Teacher Two', NULL, NULL, NULL);
                 INSERT INTO media VALUES (1, ' Talk One ', 'audio', 'mp3', 'english', 'https://dhammadownload.com/one.mp3', NULL, NULL, 1);
                 INSERT INTO media VALUES (2, 'Talk Two', 'audio', 'wma', 'myanmar', 'http://dhammadownload.com/two.wma', NULL, NULL, 2);
                 INSERT INTO media VALUES (3, 'Video', 'video', 'mp4', 'myanmar', 'https://dhammadownload.com/video.mp4', NULL, NULL, 2);",
            )
            .expect("seed fixture");
        Database::from_connection(connection)
    }

    #[test]
    fn returns_summary_and_featured_teachers() {
        let database = fixture();
        assert_eq!(database.summary().expect("summary").total_audio, 2);
        let teachers = database.featured_teachers(10).expect("teachers");
        assert_eq!(teachers.len(), 2);
        assert_eq!(teachers[0].name, "Teacher One");
    }

    #[test]
    fn naturally_compares_ascii_and_burmese_numbered_titles() {
        let cases = [
            ("1 Talk", "2 Talk", Ordering::Less),
            ("9 Talk", "10 Talk", Ordering::Less),
            ("၂ တရား", "၁၀ တရား", Ordering::Less),
            ("  2 Talk", "၁၀ တရား", Ordering::Less),
            ("2 Talk", "၂ တရား", "2 talk".cmp("၂ တရား")),
            ("02 Talk", "2 Talk", "02 talk".cmp("2 talk")),
            ("Alpha", "beta", Ordering::Less),
            ("2 Talk", "Alpha", Ordering::Less),
        ];

        for (left, right, expected) in cases {
            assert_eq!(
                natural_title_order(left, right),
                expected,
                "{left:?} vs {right:?}"
            );
            assert_eq!(natural_title_order(right, left), expected.reverse());
        }
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
                limit: 50,
                offset: 0,
            })
            .expect("audio page");
        assert_eq!(page.total, 1);
        assert!(!page.items[0].playable);
    }

    // Diagnostic: run with `cargo test blank_query_real_db -- --ignored` to verify the
    // bundled catalogue returns rows through the production search path.
    #[test]
    #[ignore]
    fn blank_query_real_db() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/dhamma.db");
        let database = Database::open_read_only(&path).expect("open bundled db");
        let page = database
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: None,
                limit: 50,
                offset: 0,
            })
            .expect("blank search");
        assert_eq!(page.total, 21402);
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
                limit: 50,
                offset: 0,
            }),
            Err(AppError::InvalidInput(_))
        ));
    }
}
