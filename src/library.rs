use std::{cmp::Ordering, collections::HashMap, path::Path, time::Duration};

use rusqlite::{
    Connection, OpenFlags, OptionalExtension, Result, Row, params, params_from_iter, types::Value,
};
use url::Url;

use crate::normalize::{normalize_text, normalized_or, optional_normalized};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Talk {
    pub id: i64,
    pub title: String,
    pub format: String,
    pub language: String,
    pub url: String,
    pub date_recorded: Option<String>,
    pub location: Option<String>,
    pub teacher_id: Option<i64>,
    pub teacher_name: String,
    pub playable: bool,
    pub media_type: String,
}

impl Talk {
    pub fn is_video(&self) -> bool {
        self.media_type.eq_ignore_ascii_case("video")
    }

    pub fn media_url_candidates(&self) -> Vec<Url> {
        let normalized = self.format.trim().to_ascii_lowercase();
        if normalized != "mp3" && normalized != "mp4" {
            return Vec::new();
        }
        let Ok(mut parsed) = Url::parse(self.url.trim()) else {
            return Vec::new();
        };
        if !matches!(parsed.scheme(), "http" | "https")
            || !matches!(
                parsed.host_str().map(str::to_ascii_lowercase).as_deref(),
                Some("dhammadownload.com" | "www.dhammadownload.com")
            )
            || parsed.port().is_some()
            || !parsed.username().is_empty()
            || parsed.password().is_some()
        {
            return Vec::new();
        }
        if parsed.set_scheme("https").is_err() {
            return Vec::new();
        }
        parsed.set_fragment(None);

        ["www.dhammadownload.com", "dhammadownload.com"]
            .into_iter()
            .filter_map(|host| {
                let mut candidate = parsed.clone();
                candidate.set_host(Some(host)).ok()?;
                Some(candidate)
            })
            .collect()
    }

    pub fn download_candidates(&self) -> Vec<Url> {
        if !self.format.trim().eq_ignore_ascii_case("mp3") {
            return Vec::new();
        }
        self.media_url_candidates()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Teacher {
    pub id: i64,
    pub name: String,
    pub audio_count: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TeacherDetail {
    pub id: i64,
    pub name: String,
    pub name_myanmar: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub audio_count: i64,
    pub collections: Vec<Collection>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Collection {
    pub id: i64,
    pub name: String,
    pub teacher_id: Option<i64>,
    pub teacher_name: String,
    pub audio_count: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CollectionDetail {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub teacher_id: Option<i64>,
    pub teacher_name: String,
    pub audio_count: i64,
    pub tracks: Vec<Talk>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub language: String,
    pub count: i64,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Summary {
    pub total_audio: i64,
    pub total_teachers: i64,
    pub myanmar_audio: i64,
    pub english_audio: i64,
}

#[derive(Debug, Clone, Default)]
pub struct AudioSearchRequest {
    pub query: String,
    pub language: Option<String>,
    pub format: Option<String>,
    pub teacher_id: Option<i64>,
    pub category_id: Option<i64>,
    pub collection_id: Option<i64>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone)]
pub struct AudioSearchPage {
    pub items: Vec<Talk>,
    pub total: i64,
}

#[derive(Debug, Clone, Default)]
pub struct CollectionSearchRequest {
    pub query: String,
    pub teacher_id: Option<i64>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone)]
pub struct CollectionSearchPage {
    pub items: Vec<Collection>,
    pub total: i64,
}

pub struct Library {
    catalogue: Connection,
}

impl Library {
    pub fn open_read_only(catalogue_path: &Path) -> Result<Self> {
        let flags = OpenFlags::SQLITE_OPEN_READ_ONLY
            | OpenFlags::SQLITE_OPEN_URI
            | OpenFlags::SQLITE_OPEN_NO_MUTEX;
        let catalogue = Connection::open_with_flags(catalogue_path, flags)?;
        catalogue.busy_timeout(Duration::from_millis(750))?;
        catalogue.pragma_update(None, "query_only", true)?;
        Ok(Self { catalogue })
    }

    pub fn summary(&self) -> Result<Summary> {
        self.catalogue.query_row(
            "SELECT
                COALESCE(SUM(CASE WHEN type = 'audio' THEN 1 ELSE 0 END), 0),
                (SELECT COUNT(*) FROM teachers),
                COALESCE(SUM(CASE WHEN type = 'audio' AND language = 'myanmar' THEN 1 ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN type = 'audio' AND language = 'english' THEN 1 ELSE 0 END), 0)
             FROM media",
            [],
            |row| {
                Ok(Summary {
                    total_audio: row.get(0)?,
                    total_teachers: row.get(1)?,
                    myanmar_audio: row.get(2)?,
                    english_audio: row.get(3)?,
                })
            },
        )
    }

    pub fn categories(&self) -> Result<Vec<Category>> {
        let mut statement = self.catalogue.prepare_cached(
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
                Ok(Category {
                    id: row.get(0)?,
                    name: normalized_or(row.get(1)?, "Uncategorized audio"),
                    language: normalize_text(&row.get::<_, String>(2)?).to_lowercase(),
                    count: row.get(3)?,
                })
            })?
            .collect()
    }

    pub fn teachers(&self, query: &str, limit: i64) -> Result<Vec<Teacher>> {
        let limit = limit.clamp(1, 500);
        let pattern = format!("%{}%", normalize_text(query).to_lowercase());
        let mut statement = self.catalogue.prepare_cached(
            "SELECT t.id, t.name, COUNT(m.id) AS audio_count
             FROM teachers t
             LEFT JOIN media m ON m.teacher_id = t.id AND m.type = 'audio'
             WHERE ?1 = '%%'
                OR LOWER(t.name) LIKE ?1
                OR LOWER(COALESCE(t.name_myanmar, '')) LIKE ?1
             GROUP BY t.id, t.name
             ORDER BY audio_count DESC, LOWER(t.name), t.id
             LIMIT ?2",
        )?;
        statement
            .query_map(params![pattern, limit], map_teacher)?
            .collect()
    }

    pub fn get_teacher(&self, id: i64) -> Result<Option<TeacherDetail>> {
        if id <= 0 {
            return Ok(None);
        }
        let detail = self
            .catalogue
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
            .optional()?;
        let Some(mut detail) = detail else {
            return Ok(None);
        };
        let mut statement = self.catalogue.prepare_cached(
            "SELECT c.id, c.name, c.teacher_id, t.name, COUNT(DISTINCT m.id)
             FROM collections c
             JOIN media_collections mc ON mc.collection_id = c.id
             JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
             LEFT JOIN teachers t ON t.id = c.teacher_id
             WHERE c.teacher_id = ?1
             GROUP BY c.id, c.name, c.teacher_id, t.name",
        )?;
        let mut collections = statement
            .query_map([id], map_collection)?
            .collect::<Result<Vec<_>>>()?;
        collections.sort_by(natural_name_cmp);
        detail.collections = collections;
        Ok(Some(detail))
    }

    pub fn search_collections(
        &self,
        request: &CollectionSearchRequest,
    ) -> Result<CollectionSearchPage> {
        let limit = request.limit.clamp(1, 400);
        let offset = request.offset.max(0);
        if let Some(teacher_id) = request.teacher_id
            && teacher_id <= 0
        {
            return Ok(CollectionSearchPage {
                items: Vec::new(),
                total: 0,
            });
        }
        let pattern = format!("%{}%", normalize_text(&request.query).to_lowercase());
        let mut statement = self.catalogue.prepare_cached(
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
            .query_map(params![pattern, request.teacher_id], map_collection)?
            .collect::<Result<Vec<_>>>()?;
        sort_collection_summaries(&mut summaries);
        let total = i64::try_from(summaries.len()).unwrap_or(i64::MAX);
        let start = usize::try_from(offset).unwrap_or(usize::MAX);
        let take = usize::try_from(limit).unwrap_or(usize::MAX);
        let items = summaries.into_iter().skip(start).take(take).collect();
        Ok(CollectionSearchPage { items, total })
    }

    pub fn get_collection(&self, id: i64) -> Result<Option<CollectionDetail>> {
        if id <= 0 {
            return Ok(None);
        }
        let header = self
            .catalogue
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
                        row.get::<_, Option<i64>>(2)?,
                        normalized_or(row.get(3)?, "Unknown teacher"),
                    ))
                },
            )
            .optional()?;
        let Some((name, description, teacher_id, teacher_name)) = header else {
            return Ok(None);
        };
        let mut statement = self.catalogue.prepare_cached(
            "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                    m.date_recorded, m.location, m.teacher_id, t.name, m.type
             FROM media_collections mc
             JOIN media m ON m.id = mc.media_id AND m.type = 'audio'
             LEFT JOIN teachers t ON t.id = m.teacher_id
             WHERE mc.collection_id = ?1
             ORDER BY mc.track_number IS NULL, mc.track_number, m.id",
        )?;
        let tracks = statement
            .query_map([id], map_talk)?
            .collect::<Result<Vec<_>>>()?;
        Ok(Some(CollectionDetail {
            id,
            name,
            description,
            teacher_id,
            teacher_name,
            audio_count: tracks.len() as i64,
            tracks,
        }))
    }

    pub fn search_audio(&self, request: &AudioSearchRequest) -> Result<AudioSearchPage> {
        let limit = request.limit.clamp(1, 400);
        let offset = request.offset.max(0);
        let mut clauses = vec!["m.type IN ('audio', 'video')".to_string()];
        let mut values = Vec::<Value>::new();
        let query = normalize_text(&request.query).to_lowercase();
        if !query.is_empty() {
            let pattern = format!("%{query}%");
            clauses.push(
                "(LOWER(m.title) LIKE ? OR LOWER(COALESCE(m.title_myanmar, '')) LIKE ? OR LOWER(COALESCE(t.name, '')) LIKE ? OR LOWER(COALESCE(t.name_myanmar, '')) LIKE ?)"
                    .into(),
            );
            values.push(Value::Text(pattern.clone()));
            values.push(Value::Text(pattern.clone()));
            values.push(Value::Text(pattern.clone()));
            values.push(Value::Text(pattern));
        }
        if let Some(language) = request.language.as_deref()
            && matches!(language, "myanmar" | "english")
        {
            clauses.push("m.language = ?".into());
            values.push(Value::Text(language.to_string()));
        }
        if let Some(format) = request.format.as_deref()
            && matches!(format, "mp3" | "wma" | "mp4" | "wmv")
        {
            clauses.push("m.format = ?".into());
            values.push(Value::Text(format.to_string()));
        }
        if let Some(teacher_id) = request.teacher_id
            && teacher_id > 0
        {
            clauses.push("m.teacher_id = ?".into());
            values.push(Value::Integer(teacher_id));
        }
        if let Some(category_id) = request.category_id
            && category_id > 0
        {
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
        if let Some(collection_id) = request.collection_id
            && collection_id > 0
        {
            clauses.push(
                "EXISTS (SELECT 1 FROM media_collections filter_mc WHERE filter_mc.media_id = m.id AND filter_mc.collection_id = ?)"
                    .into(),
            );
            values.push(Value::Integer(collection_id));
        }

        let where_clause = clauses.join(" AND ");
        let count_sql = format!(
            "SELECT COUNT(*) FROM media m LEFT JOIN teachers t ON t.id = m.teacher_id WHERE {where_clause}"
        );
        let total: i64 =
            self.catalogue
                .query_row(&count_sql, params_from_iter(values.iter()), |row| {
                    row.get(0)
                })?;

        let page_sql = format!(
            "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                    m.date_recorded, m.location, m.teacher_id, t.name, m.type
             FROM media m
             LEFT JOIN teachers t ON t.id = m.teacher_id
             WHERE {where_clause}
             ORDER BY LOWER(COALESCE(t.name, '')), m.id
             LIMIT ? OFFSET ?"
        );
        let mut page_values = values;
        page_values.push(Value::Integer(limit));
        page_values.push(Value::Integer(offset));
        let mut statement = self.catalogue.prepare(&page_sql)?;
        let items = statement
            .query_map(params_from_iter(page_values.iter()), map_talk)?
            .collect::<Result<Vec<_>>>()?;
        Ok(AudioSearchPage { items, total })
    }

    pub fn get_track(&self, id: i64) -> Result<Option<Talk>> {
        if id <= 0 {
            return Ok(None);
        }
        self.catalogue
            .query_row(
                "SELECT m.id, m.title, COALESCE(m.format, ''), m.language, m.url,
                        m.date_recorded, m.location, m.teacher_id, t.name, m.type
                 FROM media m
                 LEFT JOIN teachers t ON t.id = m.teacher_id
                 WHERE m.id = ?1 AND m.type IN ('audio', 'video')",
                [id],
                map_talk,
            )
            .optional()
    }

    pub fn get_tracks_by_ids(&self, ids: &[i64]) -> Result<Vec<Talk>> {
        let mut by_id = HashMap::new();
        for &id in ids {
            if id > 0
                && !by_id.contains_key(&id)
                && let Some(track) = self.get_track(id)?
            {
                by_id.insert(id, track);
            }
        }
        Ok(ids.iter().filter_map(|id| by_id.get(id).cloned()).collect())
    }
}

fn map_teacher(row: &Row<'_>) -> Result<Teacher> {
    Ok(Teacher {
        id: row.get(0)?,
        name: normalize_text(&row.get::<_, String>(1)?),
        audio_count: row.get(2)?,
    })
}

fn map_collection(row: &Row<'_>) -> Result<Collection> {
    Ok(Collection {
        id: row.get(0)?,
        name: normalized_or(row.get(1)?, "Untitled collection"),
        teacher_id: row.get(2)?,
        teacher_name: normalized_or(row.get(3)?, "Unknown teacher"),
        audio_count: row.get(4)?,
    })
}

fn is_playable_media(format: &str, url: &str) -> bool {
    if !matches!(format.trim().to_ascii_lowercase().as_str(), "mp3" | "mp4") {
        return false;
    }
    let Ok(parsed) = Url::parse(url.trim()) else {
        return false;
    };
    matches!(parsed.scheme(), "http" | "https")
        && matches!(
            parsed.host_str().map(str::to_ascii_lowercase).as_deref(),
            Some("dhammadownload.com" | "www.dhammadownload.com")
        )
        && parsed.port().is_none()
        && parsed.username().is_empty()
        && parsed.password().is_none()
}

fn map_talk(row: &Row<'_>) -> Result<Talk> {
    let url: String = row.get(4)?;
    let format = normalize_text(&row.get::<_, String>(2)?).to_lowercase();
    let playable = is_playable_media(&format, &url);
    let raw_type = normalize_text(&row.get::<_, String>(9)?).to_lowercase();
    let media_type = if raw_type == "video" {
        "video".to_string()
    } else {
        "audio".to_string()
    };
    Ok(Talk {
        id: row.get(0)?,
        title: normalized_or(row.get(1)?, "Untitled talk"),
        format,
        language: normalize_text(&row.get::<_, String>(3)?).to_lowercase(),
        url,
        date_recorded: optional_normalized(row.get(5)?),
        location: optional_normalized(row.get(6)?),
        teacher_id: row.get(7)?,
        teacher_name: normalized_or(row.get(8)?, "Unknown teacher"),
        playable,
        media_type,
    })
}

fn natural_name_cmp(left: &Collection, right: &Collection) -> Ordering {
    natural_text_cmp(&left.name, &right.name).then_with(|| left.id.cmp(&right.id))
}

fn sort_collection_summaries(collections: &mut [Collection]) {
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

#[cfg(test)]
mod tests {
    use super::*;

    fn real_library() -> Library {
        let catalogue = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/dhamma.db");
        Library::open_read_only(&catalogue).expect("open real dhamma.db")
    }

    #[test]
    fn loads_full_catalogue_teachers_collections_and_pagination() {
        let library = real_library();
        let summary = library.summary().unwrap();
        assert!(summary.total_audio > 30_000);
        assert!(summary.total_teachers > 200);

        let all_teachers = library.teachers("", 500).unwrap();
        assert!(all_teachers.len() > 150);

        let page1 = library
            .search_audio(&AudioSearchRequest {
                limit: 50,
                offset: 0,
                ..Default::default()
            })
            .unwrap();
        assert_eq!(page1.items.len(), 50);
        assert!(page1.total > 40_000);

        let page2 = library
            .search_audio(&AudioSearchRequest {
                limit: 50,
                offset: 50,
                ..Default::default()
            })
            .unwrap();
        assert_eq!(page2.items.len(), 50);
        assert_ne!(page1.items[0].id, page2.items[0].id);

        let sql_injection = library
            .search_audio(&AudioSearchRequest {
                query: "' OR 1=1 --".into(),
                limit: 50,
                offset: 0,
                ..Default::default()
            })
            .unwrap();
        assert!(sql_injection.items.is_empty());
    }

    #[test]
    fn resolves_mp4_video_wma_and_details() {
        let library = real_library();
        let videos = library
            .search_audio(&AudioSearchRequest {
                format: Some("mp4".into()),
                limit: 10,
                offset: 0,
                ..Default::default()
            })
            .unwrap();
        assert!(!videos.items.is_empty());
        let video = &videos.items[0];
        assert!(video.is_video());
        assert!(video.playable);
        let candidates = video.media_url_candidates();
        assert_eq!(candidates.len(), 2);
        assert_eq!(candidates[0].scheme(), "https");

        let wmas = library
            .search_audio(&AudioSearchRequest {
                format: Some("wma".into()),
                limit: 5,
                offset: 0,
                ..Default::default()
            })
            .unwrap();
        assert!(!wmas.items.is_empty());
        assert!(!wmas.items[0].playable);
        assert!(wmas.items[0].media_url_candidates().is_empty());

        let collections = library
            .search_collections(&CollectionSearchRequest {
                limit: 10,
                offset: 0,
                ..Default::default()
            })
            .unwrap();
        assert!(!collections.items.is_empty());
        let detail = library
            .get_collection(collections.items[0].id)
            .unwrap()
            .expect("collection detail");
        assert!(!detail.tracks.is_empty());

        let teacher = library
            .get_teacher(16)
            .unwrap()
            .expect("featured teacher detail");
        assert!(teacher.audio_count > 0);
    }
}
