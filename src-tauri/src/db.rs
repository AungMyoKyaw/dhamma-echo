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
        // A directory query must be able to enumerate the full bundled teacher catalogue.
        // Featured teachers retain their smaller, separately validated limit.
        let limit = validate_teacher_directory_limit(limit)?;
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

fn validate_teacher_directory_limit(limit: i64) -> Result<i64, AppError> {
    if (1..=400).contains(&limit) {
        Ok(limit)
    } else {
        Err(AppError::InvalidInput(
            "teacher directory limit must be between 1 and 400".into(),
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
mod tests;
