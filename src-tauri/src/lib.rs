mod commands;
mod db;
mod error;
mod models;
mod normalize;

use tauri::{Manager, path::BaseDirectory};

use crate::{
    commands::{
        download_audio, get_audio_track, get_catalogue_summary, get_collection, get_teacher,
        list_audio_categories, list_content_categories, list_featured_teachers, search_audio,
        search_collections, search_teachers,
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

            // The Tauri window config keeps native decorations on every
            // platform so macOS retains its traffic lights. On Windows and
            // Linux we strip decorations at runtime so the webview owns the
            // entire frame and renders the custom drag strip and
            // close / minimize / maximize buttons (see TitleBar.svelte).
            // macOS keeps decorations on and uses the configured overlay
            // title-bar style — the overlay area is naturally draggable.
            #[cfg(not(target_os = "macos"))]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.set_decorations(false)?;
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_catalogue_summary,
            list_audio_categories,
            list_content_categories,
            list_featured_teachers,
            search_teachers,
            get_teacher,
            search_collections,
            get_collection,
            search_audio,
            get_audio_track,
            download_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running Dhamma Echo");
}
