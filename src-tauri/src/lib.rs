mod commands;
mod db;
mod error;
mod models;
mod normalize;

use tauri::{Manager, path::BaseDirectory};

use crate::{
    commands::{
        get_audio_track, get_catalogue_summary, get_teacher, list_featured_teachers, search_audio,
        search_teachers,
    },
    db::Database,
    error::AppError,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app
                .path()
                .resolve("resources/dhamma.db", BaseDirectory::Resource)
                .map_err(|error| AppError::ResourcePath(error.to_string()))?;
            app.manage(Database::open_read_only(&path)?);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_catalogue_summary,
            list_featured_teachers,
            search_teachers,
            get_teacher,
            search_audio,
            get_audio_track
        ])
        .run(tauri::generate_context!())
        .expect("error while running Dhamma Echo");
}
