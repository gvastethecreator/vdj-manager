//! VDJ Database Manager — Tauri backend.
//!
//! Provides commands for parsing, querying, and modifying a VirtualDJ
//! `database.xml` file, plus file-system operations (verify, rename, move)
//! and duplicate detection.

mod commands;
pub mod database;
pub mod safety;

use commands::{configs, database as db_commands, duplicates, files, playlists, waveforms};

/// Bootstrap and run the Tauri application with all plugins and commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            db_commands::load_database,
            db_commands::get_database_stats,
            db_commands::save_database,
            db_commands::update_song_tags,
            db_commands::delete_songs,
            files::verify_files,
            files::scan_music_folder,
            files::rename_file_op,
            files::move_files_op,
            files::find_orphan_files,
            files::find_similar_files,
            files::relocate_file,
            files::list_subdirectories,
            files::dry_run_move,
            files::dry_run_rename,
            duplicates::find_duplicates,
            playlists::list_playlists,
            playlists::read_playlist,
            waveforms::get_waveform_preview,
            configs::list_vdj_config_files,
            configs::read_vdj_config_file,
            configs::write_vdj_config_file,
            configs::get_vdj_settings,
            configs::update_vdj_settings,
            configs::get_vdj_mapper,
            configs::update_vdj_mapper,
            configs::get_vdj_pad_document,
            configs::update_vdj_pad_document,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
