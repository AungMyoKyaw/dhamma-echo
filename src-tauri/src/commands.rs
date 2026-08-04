use tauri::State;

use crate::{
    db::Database,
    error::CommandError,
    models::{
        AudioSearchPage, AudioSearchRequest, AudioTrack, CatalogueSummary, TeacherDetail,
        TeacherSummary,
    },
};

#[tauri::command]
pub fn get_catalogue_summary(
    database: State<'_, Database>,
) -> Result<CatalogueSummary, CommandError> {
    database.summary().map_err(CommandError::from)
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
