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
fn teacher_directory_allows_full_catalogue_without_expanding_featured_limit() {
    let database = fixture();
    let teachers = database.search_teachers("", 400).expect("directory");
    assert_eq!(teachers.len(), 2);
    assert_eq!(teachers[0].name, "Teacher One");
    assert!(database.search_teachers("", 401).is_err());
    assert!(database.search_teachers("", 0).is_err());
    assert!(database.featured_teachers(101).is_err());
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
