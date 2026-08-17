use std::path::PathBuf;

use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::{
    db::Database,
    error::CommandError,
    models::{
        AudioSearchPage, AudioSearchRequest, AudioTrack, CatalogueSummary, CollectionDetail,
        CollectionSearchPage, CollectionSearchRequest, ContentCategory, TeacherDetail,
        TeacherSummary,
    },
};

#[derive(Clone, Serialize)]
struct DownloadProgress {
    id: i64,
    downloaded: u64,
    total: Option<u64>,
}

#[tauri::command]
pub fn get_catalogue_summary(
    database: State<'_, Database>,
) -> Result<CatalogueSummary, CommandError> {
    database.summary().map_err(CommandError::from)
}

#[tauri::command]
pub fn list_audio_categories(
    database: State<'_, Database>,
) -> Result<Vec<ContentCategory>, CommandError> {
    database.audio_categories().map_err(CommandError::from)
}

#[tauri::command]
pub fn search_collections(
    database: State<'_, Database>,
    request: CollectionSearchRequest,
) -> Result<CollectionSearchPage, CommandError> {
    database
        .search_collections(&request)
        .map_err(CommandError::from)
}

#[tauri::command]
pub fn get_collection(
    database: State<'_, Database>,
    id: i64,
) -> Result<CollectionDetail, CommandError> {
    database.collection(id).map_err(CommandError::from)
}

#[tauri::command]
pub fn list_featured_teachers(
    database: State<'_, Database>,
    limit: i64,
) -> Result<Vec<TeacherSummary>, CommandError> {
    database
        .featured_teachers(limit)
        .map_err(CommandError::from)
}

#[tauri::command]
pub fn search_teachers(
    database: State<'_, Database>,
    query: String,
    limit: i64,
) -> Result<Vec<TeacherSummary>, CommandError> {
    database
        .search_teachers(&query, limit)
        .map_err(CommandError::from)
}

#[tauri::command]
pub fn get_teacher(database: State<'_, Database>, id: i64) -> Result<TeacherDetail, CommandError> {
    database.teacher(id).map_err(CommandError::from)
}

#[tauri::command]
pub fn search_audio(
    database: State<'_, Database>,
    request: AudioSearchRequest,
) -> Result<AudioSearchPage, CommandError> {
    database.search_audio(&request).map_err(CommandError::from)
}

#[tauri::command]
pub fn get_audio_track(database: State<'_, Database>, id: i64) -> Result<AudioTrack, CommandError> {
    database.audio_track(id).map_err(CommandError::from)
}

#[tauri::command]
pub async fn download_audio(app: AppHandle, id: i64, url: String) -> Result<String, CommandError> {
    let parsed = validate_download_url(id, &url).map_err(CommandError::from)?;
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| CommandError::from(crate::error::AppError::Download(error.to_string())))?;
    tokio::fs::create_dir_all(&root)
        .await
        .map_err(|error| CommandError::from(crate::error::AppError::Download(error.to_string())))?;
    let path: PathBuf = root.join(format!("favorite-{id}.mp3"));
    let response = reqwest::get(parsed)
        .await
        .map_err(|error| CommandError::from(crate::error::AppError::Download(error.to_string())))?;
    if !response.status().is_success() {
        return Err(CommandError::from(crate::error::AppError::Download(
            format!("server returned {}", response.status()),
        )));
    }
    let total = response.content_length();
    let mut downloaded = 0;
    let mut bytes = Vec::new();
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| {
            CommandError::from(crate::error::AppError::Download(error.to_string()))
        })?;
        downloaded += chunk.len() as u64;
        bytes.extend_from_slice(&chunk);
        app.emit(
            "download-progress",
            DownloadProgress {
                id,
                downloaded,
                total,
            },
        )
        .map_err(|error| CommandError::from(crate::error::AppError::Download(error.to_string())))?;
    }
    tokio::fs::write(&path, bytes)
        .await
        .map_err(|error| CommandError::from(crate::error::AppError::Download(error.to_string())))?;
    Ok(path.to_string_lossy().into_owned())
}

fn validate_download_url(id: i64, url: &str) -> Result<reqwest::Url, crate::error::AppError> {
    if id <= 0 {
        return Err(crate::error::AppError::InvalidInput(
            "Audio id must be positive.".into(),
        ));
    }
    let parsed = reqwest::Url::parse(url)
        .map_err(|error| crate::error::AppError::InvalidInput(error.to_string()))?;
    if parsed.scheme() != "https"
        || !matches!(
            parsed.host_str(),
            Some("dhammadownload.com" | "www.dhammadownload.com")
        )
        || !parsed.path().to_ascii_lowercase().ends_with(".mp3")
    {
        return Err(crate::error::AppError::InvalidInput(
            "Only approved HTTPS MP3 sources can be downloaded.".into(),
        ));
    }
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::validate_download_url;

    #[test]
    fn accepts_only_approved_https_mp3_sources() {
        assert!(validate_download_url(7, "https://dhammadownload.com/talk.mp3").is_ok());
        assert!(validate_download_url(7, "https://www.dhammadownload.com/talk.MP3").is_ok());
        assert!(validate_download_url(0, "https://dhammadownload.com/talk.mp3").is_err());
        assert!(validate_download_url(7, "http://dhammadownload.com/talk.mp3").is_err());
        assert!(validate_download_url(7, "https://dhammadownload.com/talk.wma").is_err());
        assert!(validate_download_url(7, "https://dhammadownload.com.evil.test/talk.mp3").is_err());
    }
}
