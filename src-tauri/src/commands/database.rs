//! Tauri commands for loading, saving, and editing the VDJ database.

use std::path::PathBuf;

use crate::database::models::*;
use crate::database::parser;
use crate::safety;

fn apply_song_update(song: &mut Song, update: &SongUpdate) {
    let tags = song.tags.get_or_insert_with(Tags::default);

    if let Some(v) = &update.title        { tags.title = Some(v.clone()); }
    if let Some(v) = &update.author       { tags.author = Some(v.clone()); }
    if let Some(v) = &update.album        { tags.album = Some(v.clone()); }
    if let Some(v) = &update.genre        { tags.genre = Some(v.clone()); }
    if let Some(v) = &update.year         { tags.year = Some(v.clone()); }
    if let Some(v) = &update.key          { tags.key = Some(v.clone()); }
    if let Some(v) = &update.bpm          { tags.bpm = Some(v.clone()); }
    if let Some(v) = &update.grouping     { tags.grouping = Some(v.clone()); }
    if let Some(v) = &update.label        { tags.label = Some(v.clone()); }
    if let Some(v) = &update.remix        { tags.remix = Some(v.clone()); }
    if let Some(v) = &update.remixer      { tags.remixer = Some(v.clone()); }
    if let Some(v) = &update.composer     { tags.composer = Some(v.clone()); }
    if let Some(v) = &update.track_number { tags.track_number = Some(v.clone()); }
    if let Some(v) = &update.stars        { tags.stars = Some(v.clone()); }
    if let Some(v) = &update.user1        { tags.user1 = Some(v.clone()); }
    if let Some(v) = &update.user2        { tags.user2 = Some(v.clone()); }

    if let Some(v) = &update.comment_text {
        song.comment = Some(crate::database::models::CommentEl { text: Some(v.clone()) });
    }

    if update.color.is_some() || update.gain.is_some() {
        let infos = song.infos.get_or_insert_with(Infos::default);
        if let Some(v) = &update.color { infos.color = Some(v.clone()); }
        if let Some(v) = &update.gain  { infos.gain  = Some(v.clone()); }
    }
}

/// Load the database and return a vec of [`SongSummary`] for the frontend.
#[tauri::command]
pub async fn load_database(vdj_folder: String) -> Result<Vec<SongSummary>, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    if !db_path.exists() {
        return Err(format!(
            "No se encontró database.xml en {}",
            vdj_folder
        ));
    }

    let db = parser::parse_database(&db_path)?;
    let summaries: Vec<SongSummary> = db
        .songs
        .iter()
        .enumerate()
        .map(|(i, s)| s.to_summary(i))
        .collect();

    Ok(summaries)
}

/// Compute aggregated statistics from the full database.
#[tauri::command]
pub async fn get_database_stats(vdj_folder: String) -> Result<DatabaseStats, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;
    Ok(parser::compute_stats(&db))
}

/// Apply batch tag updates from JSON. Creates `.xml.bak` before writing.
#[tauri::command]
pub async fn save_database(vdj_folder: String, songs_json: String) -> Result<(), String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");

    // Read the existing database
    let mut db = parser::parse_database(&db_path)?;

    // Parse the incoming song updates (partial updates by index)
    let updates: Vec<SongUpdate> =
        serde_json::from_str(&songs_json).map_err(|e| format!("JSON inválido: {}", e))?;

    for update in &updates {
        if update.index < db.songs.len() {
            let song = &mut db.songs[update.index];
            apply_song_update(song, update);
        }
    }

    safety::create_timestamped_backup(&db_path, "database")?;

    parser::write_database_checked(&db_path, &db)
}

/// Update tags for one song using its stable original path.  The parser owns
/// the narrow patch-in-place write; this command intentionally does not fall
/// back to the legacy whole-document serializer.
#[tauri::command]
pub async fn update_song_tags(request: UpdateSongTagsRequest) -> Result<UpdateSongTagsResult, String> {
    let db_path = PathBuf::from(&request.vdj_folder).join("database.xml");
    match parser::patch_song_in_place(&db_path, &request.original_file_path, &request.update) {
        Ok(result) => Ok(result),
        Err(error) => {
            eprintln!("update_song_tags aborted safely: {}", error);
            Ok(UpdateSongTagsResult {
                status: UpdateSongTagsStatus::UnsafeToPatch,
                original_file_path: request.original_file_path,
                current_file_path: String::new(),
                updated_fields: request.update.updated_fields(),
            })
        }
    }
}

/// Remove songs from the database by index, optionally moving the physical files to trash.
/// Returns a log of actions taken.
#[tauri::command]
pub async fn delete_songs(
    vdj_folder: String,
    indices: Vec<usize>,
    delete_files: bool,
) -> Result<Vec<String>, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let mut db = parser::parse_database(&db_path)?;

    if indices.is_empty() {
        return Ok(vec![]);
    }

    safety::create_timestamped_backup(&db_path, "database")?;

    let mut results: Vec<String> = Vec::new();

    // Optionally trash files first (before modifying indices)
    if delete_files {
        for &idx in &indices {
            if idx < db.songs.len() {
                let file_path = &db.songs[idx].file_path;
                match trash::delete(file_path) {
                    Ok(_) => results.push(format!("✓ Enviado a papelera: {}", file_path)),
                    Err(e) => results.push(format!("⚠ No se pudo mover a papelera {}: {}", file_path, e)),
                }
            }
        }
    }

    // Remove from DB: sort descending so removing by index stays valid
    let mut sorted: Vec<usize> = indices;
    sorted.sort_unstable_by(|a, b| b.cmp(a));
    sorted.dedup();

    for idx in &sorted {
        if *idx < db.songs.len() {
            let path = db.songs[*idx].file_path.clone();
            db.songs.remove(*idx);
            if !delete_files {
                results.push(format!("✓ Eliminado de BD: {}", path));
            }
        }
    }

    parser::write_database_checked(&db_path, &db)?;
    Ok(results)
}

#[derive(serde::Deserialize)]
pub struct SongUpdate {
    pub index: usize,
    pub title: Option<String>,
    pub author: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub year: Option<String>,
    pub key: Option<String>,
    pub bpm: Option<String>,
    pub grouping: Option<String>,
    pub label: Option<String>,
    pub remix: Option<String>,
    pub remixer: Option<String>,
    pub composer: Option<String>,
    #[serde(rename = "trackNumber")]
    pub track_number: Option<String>,
    pub stars: Option<String>,
    pub user1: Option<String>,
    pub user2: Option<String>,
    #[serde(rename = "commentText")]
    pub comment_text: Option<String>,
    pub color: Option<String>,
    pub gain: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSongTagsRequest {
    pub vdj_folder: String,
    pub original_file_path: String,
    pub update: InlineSongUpdate,
}
