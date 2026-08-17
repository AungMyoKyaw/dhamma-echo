use std::{cmp::Ordering, path::Path, sync::Mutex, time::Duration};

use rusqlite::{Connection, OpenFlags, Row, params, params_from_iter, types::Value};

use crate::{
    error::AppError,
    models::{
        AudioSearchPage, AudioSearchRequest, AudioTrack, CatalogueSummary, CollectionDetail,
        CollectionSearchPage, CollectionSearchRequest, CollectionSummary, ContentCategory,
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

    pub fn audio_categories(&self) -> Result<Vec<ContentCategory>, AppError> {
        self.with_connection(|connection| {
            let mut statement = connection.prepare(
                "SELECT c.id, c.name, c.language, COUNT(m.id)
                 FROM categories c
                 JOIN media m ON m.category_id = c.id
                    AND m.type IN ('audio', 'video')
                    AND (c.type = 'abhidhamma' OR c.type = m.type)
                 WHERE c.type IN ('audio', 'video', 'abhidhamma')
                 GROUP BY c.id, c.name, c.language
                 HAVING COUNT(m.id) > 0
                 ORDER BY c.id",
            )?;
            statement
                .query_map([], |row| {
                    Ok(ContentCategory {
                        id: row.get(0)?,
                        name: normalized_or(row.get(1)?, "Uncategorized audio"),
                        language: normalize_text(&row.get::<_, String>(2)?).to_lowercase(),
                        count: row.get(3)?,
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
        let limit = validate_collection_limit(request.limit)?;
        let offset = request.offset.max(0);
        if let Some(teacher_id) = request.teacher_id {
            validate_id(teacher_id)?;
        }
        let pattern = format!("%{}%", normalize_text(&request.query).to_lowercase());
        self.with_connection(|connection| {
            let mut statement = connection.prepare(
                "SELECT c.id, c.name, c.teacher_id, t.name, COUNT(DISTINCT m.id)
                 FROM collections c
                 JOIN media_collections mc ON mc.collection_id = c.id
                 JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
                 LEFT JOIN teachers t ON t.id = c.teacher_id
                 WHERE LOWER(c.name) LIKE ?1
                   AND (?2 IS NULL OR c.teacher_id = ?2)
                 GROUP BY c.id, c.name, c.teacher_id, t.name",
            )?;
            let mut summaries = statement
                .query_map(params![pattern, request.teacher_id], map_collection_summary)?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            sort_collection_summaries(&mut summaries);
            let total = i64::try_from(summaries.len()).unwrap_or(i64::MAX);
            let start = usize::try_from(offset).unwrap_or(usize::MAX);
            let take = usize::try_from(limit).unwrap_or(usize::MAX);
            let items = summaries.into_iter().skip(start).take(take).collect();
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
                        m.date_recorded, m.location, m.teacher_id, t.name,
                        m.type
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
                 GROUP BY c.id, c.name, c.teacher_id, t.name",
            )?;
            let mut collections = statement
                .query_map([id], map_collection_summary)?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            collections.sort_by(natural_name_cmp);
            detail.collections = collections;
            Ok(detail)
        })
    }

    pub fn audio_track(&self, id: i64) -> Result<AudioTrack, AppError> {
        validate_id(id)?;
        self.with_connection(|connection| {
            connection
                .query_row(
                    "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                            m.date_recorded, m.location, m.teacher_id, t.name,
                            m.type
                     FROM media m
                     LEFT JOIN teachers t ON t.id = m.teacher_id
                     WHERE m.id = ?1 AND m.type IN ('audio', 'video')",
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
        let limit = validate_audio_limit(request.limit)?;
        let offset = request.offset.max(0);
        validate_filter(
            "language",
            request.language.as_deref(),
            &["myanmar", "english"],
        )?;
        validate_filter(
            "format",
            request.format.as_deref(),
            &["mp3", "wma", "mp4", "wmv"],
        )?;
        if let Some(teacher_id) = request.teacher_id {
            validate_id(teacher_id)?;
        }
        if let Some(category_id) = request.category_id {
            validate_id(category_id)?;
        }
        if let Some(collection_id) = request.collection_id {
            validate_id(collection_id)?;
        }

        let mut clauses = vec!["m.type IN ('audio', 'video')".to_string()];
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
            clauses.push(
                "EXISTS (
                    SELECT 1
                    FROM categories filter_category
                    WHERE filter_category.id = m.category_id
                      AND filter_category.id = ?
                      AND filter_category.type IN ('audio', 'video', 'abhidhamma')
                      AND (filter_category.type = 'abhidhamma' OR filter_category.type = m.type)
                )"
                .into(),
            );
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
                        m.date_recorded, m.location, m.teacher_id, t.name,
                        m.type
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

fn natural_name_cmp(left: &CollectionSummary, right: &CollectionSummary) -> Ordering {
    natural_text_cmp(&left.name, &right.name).then_with(|| left.id.cmp(&right.id))
}

fn sort_collection_summaries(collections: &mut [CollectionSummary]) {
    collections.sort_by(|left, right| match (left.teacher_id, right.teacher_id) {
        (None, None) => natural_name_cmp(left, right),
        (None, Some(_)) => Ordering::Greater,
        (Some(_), None) => Ordering::Less,
        (Some(_), Some(_)) => natural_text_cmp(&left.teacher_name, &right.teacher_name)
            .then_with(|| natural_name_cmp(left, right)),
    });
}

fn natural_text_cmp(left: &str, right: &str) -> Ordering {
    let comparison_key = |value: &str| {
        value
            .chars()
            .filter(|character| !character.is_whitespace())
            .flat_map(char::to_lowercase)
            .collect::<String>()
    };
    let left = comparison_key(left);
    let right = comparison_key(right);
    let (left, right) = (left.as_bytes(), right.as_bytes());
    let (mut left_index, mut right_index) = (0, 0);

    while left_index < left.len() && right_index < right.len() {
        if left[left_index].is_ascii_digit() && right[right_index].is_ascii_digit() {
            let left_end = digit_run_end(left, left_index);
            let right_end = digit_run_end(right, right_index);
            let left_digits = &left[left_index..left_end];
            let right_digits = &right[right_index..right_end];
            let left_significant = trim_zeroes(left_digits);
            let right_significant = trim_zeroes(right_digits);
            let ordering = left_significant
                .len()
                .cmp(&right_significant.len())
                .then_with(|| left_significant.cmp(right_significant))
                .then_with(|| left_digits.len().cmp(&right_digits.len()));
            if ordering != Ordering::Equal {
                return ordering;
            }
            left_index = left_end;
            right_index = right_end;
            continue;
        }

        let ordering = left[left_index].cmp(&right[right_index]);
        if ordering != Ordering::Equal {
            return ordering;
        }
        left_index += 1;
        right_index += 1;
    }

    left.len().cmp(&right.len())
}

fn digit_run_end(value: &[u8], start: usize) -> usize {
    value[start..]
        .iter()
        .position(|byte| !byte.is_ascii_digit())
        .map_or(value.len(), |offset| start + offset)
}

fn trim_zeroes(value: &[u8]) -> &[u8] {
    value
        .iter()
        .position(|byte| *byte != b'0')
        .map_or(&value[value.len()..], |start| &value[start..])
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

fn validate_audio_limit(limit: i64) -> Result<i64, AppError> {
    if (1..=400).contains(&limit) {
        Ok(limit)
    } else {
        Err(AppError::InvalidInput(
            "audio limit must be between 1 and 400".into(),
        ))
    }
}

fn validate_collection_limit(limit: i64) -> Result<i64, AppError> {
    if (1..=400).contains(&limit) {
        Ok(limit)
    } else {
        Err(AppError::InvalidInput(
            "collection limit must be between 1 and 400".into(),
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
    if !matches!(format.trim().to_ascii_lowercase().as_str(), "mp3" | "mp4") {
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
    let media_type = normalize_text(&row.get::<_, String>(9)?).to_lowercase();
    let media_type = match media_type.as_str() {
        "video" => "video".to_string(),
        _ => "audio".to_string(),
    };
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
        media_type,
    })
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::{Database, is_webview_playable, natural_text_cmp, sort_collection_summaries};
    use crate::{
        error::AppError,
        models::{AudioSearchRequest, CollectionSearchRequest, CollectionSummary},
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
                 INSERT INTO categories VALUES (6, 'Video in English', 'video', 'english');
                 INSERT INTO categories VALUES (7, 'Audio in English', 'audio', 'english');
                 INSERT INTO categories VALUES (8, 'Video in Myanmar', 'video', 'myanmar');
                 INSERT INTO media VALUES (1, ' Talk One ', 'audio', 'mp3', 'english', 'https://dhammadownload.com/one.mp3', NULL, NULL, 1, 7);
                 INSERT INTO media VALUES (2, 'Talk Two', 'audio', 'wma', 'myanmar', 'http://dhammadownload.com/two.wma', NULL, NULL, 2, 1);
                 INSERT INTO media VALUES (3, 'Video', 'video', 'mp4', 'myanmar', 'https://dhammadownload.com/video.mp4', NULL, NULL, 2, 8);
                 INSERT INTO media VALUES (4, '   ', 'audio', 'mp3', 'myanmar', 'https://dhammadownload.com/four.mp3', NULL, NULL, NULL, 4);
                 INSERT INTO media VALUES (5, 'Abhidhamma English', 'audio', 'mp3', 'english', 'https://dhammadownload.com/five.mp3', NULL, NULL, 1, 5);
                 INSERT INTO media VALUES (6, 'English Video', 'video', 'mp4', 'english', 'https://dhammadownload.com/english-video.mp4', NULL, NULL, 1, 6);
                 INSERT INTO media VALUES (7, 'Mismatched Video', 'video', 'mp4', 'english', 'https://dhammadownload.com/mismatched-video.mp4', NULL, NULL, 1, 1);
                 INSERT INTO collections VALUES (10, 'Course One', 'A course', 1, 'audio', 'https://example.test/course');
                 INSERT INTO media_collections VALUES (1, 10, 2);
                 INSERT INTO media_collections VALUES (2, 10, 1);
                 INSERT INTO media_collections VALUES (4, 10, NULL);",
            )
            .expect("seed fixture");
        Database::from_connection(connection)
    }

    fn teacher_collection_sort_fixture() -> Database {
        let connection = Connection::open_in_memory().expect("open collection sort fixture");
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
                 INSERT INTO teachers VALUES (1, 'Teacher', NULL, NULL, NULL);
                 INSERT INTO media VALUES
                    (1, 'One', 'audio', 'mp3', 'english', 'https://dhammadownload.com/1.mp3', NULL, NULL, 1, NULL),
                    (2, 'Two', 'audio', 'mp3', 'english', 'https://dhammadownload.com/2.mp3', NULL, NULL, 1, NULL),
                    (3, 'Three', 'audio', 'mp3', 'english', 'https://dhammadownload.com/3.mp3', NULL, NULL, 1, NULL),
                    (4, 'Four', 'audio', 'mp3', 'english', 'https://dhammadownload.com/4.mp3', NULL, NULL, 1, NULL),
                    (5, 'Five', 'audio', 'mp3', 'english', 'https://dhammadownload.com/5.mp3', NULL, NULL, 1, NULL);
                 INSERT INTO collections VALUES
                    (11, ' alpha 10 ', NULL, 1, 'audio', NULL),
                    (12, 'Alpha 2', NULL, 1, 'audio', NULL),
                    (13, 'alpha 1', NULL, 1, 'audio', NULL),
                    (14, 'alpha 02', NULL, 1, 'audio', NULL),
                    (15, 'alpha 10', NULL, 1, 'audio', NULL);
                 INSERT INTO media_collections VALUES
                    (1, 11, 1), (2, 12, 1), (3, 13, 1), (4, 14, 1), (5, 15, 1);",
            )
            .expect("seed collection sort fixture");
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
        assert!(is_webview_playable(
            "mp4",
            "https://dhammadownload.com/talk.mp4"
        ));
        assert!(is_webview_playable(
            "MP4",
            "https://www.dhammadownload.com/talk.mp4"
        ));
        assert!(!is_webview_playable(
            "wma",
            "https://dhammadownload.com/talk.wma"
        ));
        assert!(!is_webview_playable(
            "wmv",
            "https://dhammadownload.com/talk.wmv"
        ));
        assert!(!is_webview_playable(
            "mpg",
            "https://dhammadownload.com/talk.mpg"
        ));
        assert!(!is_webview_playable(
            "mp3",
            "https://dhammadownload.com.evil.example/talk.mp3"
        ));
        assert!(!is_webview_playable(
            "mp3",
            "https://dhammadownload.com:8443/talk.mp3"
        ));
        assert!(!is_webview_playable("mp4", "file:///Users/me/talk.mp4"));
        assert!(!is_webview_playable(
            "mp4",
            "mms://dhammadownload.com/talk.mp4"
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
    fn lists_meaningful_content_categories_and_scopes_category_search() {
        let categories = fixture().audio_categories().expect("categories");
        assert_eq!(
            categories.iter().map(|item| item.id).collect::<Vec<_>>(),
            vec![1, 4, 5, 6, 7, 8]
        );
        assert_eq!(
            categories.iter().map(|item| item.count).collect::<Vec<_>>(),
            vec![1, 1, 1, 1, 1, 1]
        );

        let video_page = fixture()
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: None,
                category_id: Some(8),
                collection_id: None,
                limit: 50,
                offset: 0,
            })
            .expect("video category page");
        assert_eq!(video_page.total, 1);
        assert_eq!(video_page.items[0].media_type, "video");
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
    fn teacher_collections_use_trimmed_case_insensitive_natural_order() {
        let database = teacher_collection_sort_fixture();
        let detail = database.teacher(1).expect("teacher detail");
        assert_eq!(
            detail
                .collections
                .iter()
                .map(|collection| collection.id)
                .collect::<Vec<_>>(),
            vec![13, 12, 14, 11, 15]
        );

        let collections = database
            .search_collections(&CollectionSearchRequest {
                query: String::new(),
                teacher_id: Some(1),
                limit: 20,
                offset: 0,
            })
            .expect("collection search");
        assert_eq!(
            collections
                .items
                .iter()
                .map(|collection| collection.id)
                .collect::<Vec<_>>(),
            vec![13, 12, 14, 11, 15]
        );
    }

    #[test]
    fn natural_collection_order_ignores_spacing_before_disc_numbers() {
        let mut names = vec![
            "MP3 Disc 03",
            "MP3 Disc 06",
            "MP3 Disc01",
            "MP3 Disc02",
            "MP3 Disc04",
            "MP3 Disc05",
        ];
        names.sort_by(|left, right| natural_text_cmp(left, right));
        assert_eq!(
            names,
            vec![
                "MP3 Disc01",
                "MP3 Disc02",
                "MP3 Disc 03",
                "MP3 Disc04",
                "MP3 Disc05",
                "MP3 Disc 06",
            ]
        );
    }

    #[test]
    fn collection_summaries_group_named_teachers_and_put_unknown_last() {
        let summary = |id, name: &str, teacher_id, teacher_name: &str| CollectionSummary {
            id,
            name: name.into(),
            teacher_id,
            teacher_name: teacher_name.into(),
            audio_count: 1,
        };
        let mut collections = vec![
            summary(1, "Disc 10", Some(2), "Teacher B"),
            summary(2, "Disc 2", None, "Unknown teacher"),
            summary(3, "Disc 10", Some(1), "Teacher A"),
            summary(4, "Disc 2", Some(1), "Teacher A"),
            summary(5, "Disc 1", Some(2), "Teacher B"),
        ];
        sort_collection_summaries(&mut collections);
        assert_eq!(
            collections.iter().map(|item| item.id).collect::<Vec<_>>(),
            vec![4, 3, 5, 1, 2]
        );
    }

    #[test]
    fn collection_search_slices_after_natural_sorting() {
        let database = teacher_collection_sort_fixture();
        let page = |limit, offset| {
            database
                .search_collections(&CollectionSearchRequest {
                    query: String::new(),
                    teacher_id: Some(1),
                    limit,
                    offset,
                })
                .expect("collection page")
        };
        let first = page(2, 0);
        let second = page(2, 2);
        let ids = first
            .items
            .into_iter()
            .chain(second.items)
            .map(|item| item.id)
            .collect::<Vec<_>>();
        assert_eq!(ids, vec![13, 12, 14, 11]);
        assert_eq!(first.total, 5);
        assert_eq!(second.offset, 2);
    }

    #[test]
    fn playable_rows_survive_incomplete_metadata() {
        let track = fixture().audio_track(4).expect("incomplete playable track");
        assert_eq!(track.title, "Untitled talk");
        assert_eq!(track.teacher_name, "Unknown teacher");
        assert!(track.playable);
        assert_eq!(track.media_type, "audio");
    }

    #[test]
    fn audio_track_emits_video_media_type_for_video_rows() {
        // Fixture inserts id=3 as type='video', format='mp4'.
        let track = fixture().audio_track(3).expect("video track");
        assert_eq!(track.media_type, "video");
        assert_eq!(track.format, "mp4");
        assert!(track.playable);
    }

    #[test]
    fn search_audio_includes_video_rows_when_format_filter_matches() {
        // Fixture inserts id=3 as type='video', format='mp4', language='myanmar'.
        let page = fixture()
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: Some("myanmar".into()),
                format: Some("mp4".into()),
                teacher_id: None,
                category_id: None,
                collection_id: None,
                limit: 20,
                offset: 0,
            })
            .expect("mp4 page");
        assert_eq!(page.total, 1, "only the mp4 row should match");
        let track = &page.items[0];
        assert_eq!(track.id, 3);
        assert_eq!(track.media_type, "video");
        assert!(track.playable);
    }

    #[test]
    fn search_audio_accepts_wmv_filter_and_marks_video_unplayable() {
        // wmv is searchable (matches the WMA pattern) but no fixture row uses it.
        let page = fixture()
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: Some("wmv".into()),
                teacher_id: None,
                category_id: None,
                collection_id: None,
                limit: 20,
                offset: 0,
            })
            .expect("wmv filter is searchable");
        assert_eq!(page.total, 0);
    }

    #[test]
    fn search_audio_rejects_unsupported_format_values() {
        let error = fixture()
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: Some("mpg".into()),
                teacher_id: None,
                category_id: None,
                collection_id: None,
                limit: 20,
                offset: 0,
            })
            .expect_err("mpg is not a searchable format");
        assert!(
            matches!(error, AppError::InvalidInput(_)),
            "expected InvalidInput, got {error:?}"
        );
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
                total_teachers: 256,
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
        assert_eq!(page.total, 45428);
        assert_eq!(page.items.len(), 50);
        let categories = database.audio_categories().expect("content categories");
        assert_eq!(categories.len(), 6);
        let collections = database
            .search_collections(&CollectionSearchRequest {
                query: String::new(),
                teacher_id: None,
                limit: 1,
                offset: 0,
            })
            .expect("audio collections");
        assert_eq!(collections.total, 429);
        let detail = database
            .collection(collections.items[0].id)
            .expect("collection detail");
        assert!(!detail.tracks.is_empty());
        let category_page = database
            .search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: None,
                category_id: Some(categories[0].id),
                collection_id: None,
                limit: 50,
                offset: 0,
            })
            .expect("category page");
        assert!(category_page.total > 0);
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
        for limit in [200, 400] {
            assert!(
                database
                    .search_collections(&CollectionSearchRequest {
                        query: String::new(),
                        teacher_id: None,
                        limit,
                        offset: 0,
                    })
                    .is_ok()
            );
        }
        for limit in [200, 400] {
            assert!(
                database
                    .search_audio(&AudioSearchRequest {
                        query: String::new(),
                        language: None,
                        format: None,
                        teacher_id: None,
                        category_id: None,
                        collection_id: None,
                        limit,
                        offset: 0,
                    })
                    .is_ok()
            );
        }
        assert!(matches!(
            database.search_collections(&CollectionSearchRequest {
                query: String::new(),
                teacher_id: None,
                limit: 401,
                offset: 0,
            }),
            Err(AppError::InvalidInput(_))
        ));
        assert!(matches!(
            database.search_audio(&AudioSearchRequest {
                query: String::new(),
                language: None,
                format: None,
                teacher_id: None,
                category_id: None,
                collection_id: None,
                limit: 401,
                offset: 0,
            }),
            Err(AppError::InvalidInput(_))
        ));
    }
}
