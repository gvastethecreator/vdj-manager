//! Tauri commands for file verification and file-system operations.

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

use crate::database::models::*;
use crate::database::parser;
use crate::safety;

use walkdir::WalkDir;

/// Verify that every song in the database exists on disk with the expected size.
#[tauri::command]
pub async fn verify_files(vdj_folder: String) -> Result<Vec<FileVerification>, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;

    let results: Vec<FileVerification> = db
        .songs
        .iter()
        .map(|song| {
            let path = PathBuf::from(&song.file_path);
            let exists = path.exists();
            let actual_size = if exists {
                std::fs::metadata(&path).ok().map(|m| m.len())
            } else {
                None
            };
            let size_match = match (song.file_size, actual_size) {
                (Some(expected), Some(actual)) => expected == actual,
                _ => false,
            };

            FileVerification {
                file_path: song.file_path.clone(),
                title: song.tags.as_ref().and_then(|t| t.title.clone()),
                author: song.tags.as_ref().and_then(|t| t.author.clone()),
                exists,
                size_match: exists && size_match,
                expected_size: song.file_size,
                actual_size,
            }
        })
        .collect();

    Ok(results)
}

/// Scans a folder on disk and returns all audio file paths found
#[tauri::command]
pub async fn scan_music_folder(folder_path: String) -> Result<Vec<String>, String> {
    let audio_extensions = [
        "mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "aif", "opus",
        "mp4", "avi", "mkv", "mov", "wmv", "flv", "webm",
    ];

    let mut files = Vec::new();

    for entry in WalkDir::new(&folder_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                let ext_lower = ext.to_string_lossy().to_lowercase();
                if audio_extensions.contains(&ext_lower.as_str()) {
                    files.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }

    Ok(files)
}

/// Rename a file on disk and update the database entry
#[tauri::command]
pub async fn rename_file_op(
    vdj_folder: String,
    song_index: usize,
    new_name: String,
) -> Result<String, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let mut db = parser::parse_database(&db_path)?;

    if song_index >= db.songs.len() {
        return Err("Índice fuera de rango".to_string());
    }

    let old_path = PathBuf::from(&db.songs[song_index].file_path);
    if !old_path.exists() {
        return Err(format!("El archivo no existe: {}", old_path.display()));
    }

    let new_path = old_path
        .parent()
        .ok_or("No se pudo obtener directorio padre")?
        .join(&new_name);

    if new_path.exists() {
        return Err(format!("Ya existe un archivo con ese nombre: {}", new_path.display()));
    }

    std::fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Error al renombrar: {}", e))?;

    db.songs[song_index].file_path = new_path.to_string_lossy().to_string();

    safety::create_timestamped_backup(&db_path, "database")?;
    parser::write_database_checked(&db_path, &db)?;

    Ok(new_path.to_string_lossy().to_string())
}

/// Move selected files to a target folder and update the database
#[tauri::command]
pub async fn move_files_op(
    vdj_folder: String,
    song_indices: Vec<usize>,
    target_folder: String,
) -> Result<Vec<String>, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let mut db = parser::parse_database(&db_path)?;
    let target = PathBuf::from(&target_folder);

    if !target.exists() {
        std::fs::create_dir_all(&target)
            .map_err(|e| format!("Error al crear directorio destino: {}", e))?;
    }

    let mut results = Vec::new();

    for &idx in &song_indices {
        if idx >= db.songs.len() {
            results.push(format!("Índice {} fuera de rango", idx));
            continue;
        }

        let old_path = PathBuf::from(&db.songs[idx].file_path);
        if !old_path.exists() {
            results.push(format!("No existe: {}", old_path.display()));
            continue;
        }

        let file_name = old_path
            .file_name()
            .ok_or("Sin nombre de archivo")?;
        let new_path = target.join(file_name);

        if new_path.exists() {
            results.push(format!("Ya existe en destino: {}", new_path.display()));
            continue;
        }

        match std::fs::rename(&old_path, &new_path) {
            Ok(_) => {
                db.songs[idx].file_path = new_path.to_string_lossy().to_string();
                results.push(format!("OK: {}", new_path.display()));
            }
            Err(e) => {
                // Cross-drive move: copy + delete
                match std::fs::copy(&old_path, &new_path) {
                    Ok(_) => {
                        match std::fs::remove_file(&old_path) {
                            Ok(()) => {
                                db.songs[idx].file_path = new_path.to_string_lossy().to_string();
                                results.push(format!("OK (copiado): {}", new_path.display()));
                            }
                            Err(remove_err) => {
                                let _ = std::fs::remove_file(&new_path);
                                results.push(format!(
                                    "Error removiendo original tras copiar {}: {}",
                                    old_path.display(),
                                    remove_err
                                ));
                            }
                        }
                    }
                    Err(_) => {
                        results.push(format!("Error moviendo {}: {}", old_path.display(), e));
                    }
                }
            }
        }
    }

    safety::create_timestamped_backup(&db_path, "database")?;
    parser::write_database_checked(&db_path, &db)?;

    Ok(results)
}

/// Find audio files on disk that are NOT in the database
#[tauri::command]
pub async fn find_orphan_files(
    vdj_folder: String,
    scan_folder: String,
) -> Result<Vec<String>, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;

    let db_paths: HashMap<String, bool> = db
        .songs
        .iter()
        .map(|s| (s.file_path.to_lowercase(), true))
        .collect();

    let all_files = scan_music_folder(scan_folder).await?;

    let orphans: Vec<String> = all_files
        .into_iter()
        .filter(|f| !db_paths.contains_key(&f.to_lowercase()))
        .collect();

    Ok(orphans)
}

fn normalize_for_match(raw: &str) -> String {
    raw.to_lowercase()
        .chars()
        .map(|ch| if ch.is_alphanumeric() { ch } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn path_key(raw: &str) -> String {
    parser::normalize_windows_path(raw).to_lowercase()
}

#[derive(Clone)]
struct MissingInfo {
    expected_size: Option<u64>,
    title_norm: Option<String>,
    author_norm: Option<String>,
    extension: String,
}

#[derive(Clone)]
struct ScannedFile {
    path: String,
    name_lower: String,
    stem_lower: String,
    extension: String,
    size: u64,
    path_norm: String,
}

fn missing_info_for_song(song: &Song) -> MissingInfo {
    let extension = std::path::Path::new(&song.file_path)
        .extension()
        .map(|extension| extension.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    MissingInfo {
        expected_size: song.file_size,
        title_norm: song
            .tags
            .as_ref()
            .and_then(|tags| tags.title.as_ref())
            .map(|value| normalize_for_match(value))
            .filter(|value| !value.is_empty()),
        author_norm: song
            .tags
            .as_ref()
            .and_then(|tags| tags.author.as_ref())
            .map(|value| normalize_for_match(value))
            .filter(|value| !value.is_empty()),
        extension,
    }
}

fn collect_scanned_files(scan_folders: &[String]) -> Vec<ScannedFile> {
    let mut scanned_files = Vec::new();
    let mut seen_roots = HashSet::new();
    let mut seen_files = HashSet::new();

    for scan_folder in scan_folders {
        let root_key = path_key(scan_folder);
        if !seen_roots.insert(root_key) {
            continue;
        }
        for entry in WalkDir::new(scan_folder)
            .follow_links(true)
            .into_iter()
            .filter_map(|entry| entry.ok())
        {
            let metadata = match entry.metadata() {
                Ok(metadata) if metadata.is_file() => metadata,
                _ => continue,
            };
            let Some(name) = entry.path().file_name() else { continue };
            let path = entry.path().to_string_lossy().to_string();
            if !seen_files.insert(path_key(&path)) {
                continue;
            }
            let name_lower = name.to_string_lossy().to_lowercase();
            let stem_lower = entry
                .path()
                .file_stem()
                .map(|stem| stem.to_string_lossy().to_lowercase())
                .unwrap_or_default();
            let extension = entry
                .path()
                .extension()
                .map(|extension| extension.to_string_lossy().to_lowercase())
                .unwrap_or_default();
            scanned_files.push(ScannedFile {
                path_norm: normalize_for_match(&path),
                path,
                name_lower,
                stem_lower,
                extension,
                size: metadata.len(),
            });
        }
    }

    scanned_files.sort_by(|left, right| path_key(&left.path).cmp(&path_key(&right.path)));
    scanned_files
}

fn find_candidates_for_paths(
    vdj_folder: &str,
    original_file_paths: &[String],
    scan_folders: &[String],
) -> Result<Vec<SimilarFileMatch>, String> {
    let db_path = PathBuf::from(vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;
    let scanned_files = collect_scanned_files(scan_folders);
    let mut results = Vec::new();
    let mut seen_missing = HashSet::new();

    for original_file_path in original_file_paths {
        if !seen_missing.insert(path_key(original_file_path)) {
            continue;
        }
        let matching_songs: Vec<&Song> = db
            .songs
            .iter()
            .filter(|song| parser::windows_paths_equal(&song.file_path, original_file_path))
            .collect();
        if matching_songs.is_empty() {
            results.push(SimilarFileMatch {
                status: SimilarFileMatchStatus::NotFound,
                original_file_path: original_file_path.clone(),
                candidates: Vec::new(),
                message: Some("No se encontró la entrada con la ruta original".to_string()),
            });
            continue;
        }
        if matching_songs.len() > 1 {
            results.push(SimilarFileMatch {
                status: SimilarFileMatchStatus::ManualReviewRequired,
                original_file_path: original_file_path.clone(),
                candidates: Vec::new(),
                message: Some("La ruta original coincide con más de una entrada".to_string()),
            });
            continue;
        }
        let missing_info = Some(missing_info_for_song(matching_songs[0]));
        let missing_info = missing_info.as_ref();
        let missing_name = std::path::Path::new(original_file_path)
            .file_name()
            .map(|name| name.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        let missing_stem = std::path::Path::new(&missing_name)
            .file_stem()
            .map(|stem| stem.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        let missing_extension = missing_info
            .map(|info| info.extension.as_str())
            .unwrap_or_else(|| {
                std::path::Path::new(original_file_path)
                    .extension()
                    .and_then(|extension| extension.to_str())
                    .unwrap_or("")
            })
            .to_lowercase();
        let mut candidates_by_path: HashMap<String, SimilarFileCandidate> = HashMap::new();

        for scanned in &scanned_files {
            let same_name = scanned.name_lower == missing_name;
            let same_stem = !missing_stem.is_empty() && scanned.stem_lower == missing_stem;
            let similar_stem = !same_stem
                && !missing_stem.is_empty()
                && (scanned.stem_lower.contains(&missing_stem)
                    || missing_stem.contains(&scanned.stem_lower));
            let same_extension = !missing_extension.is_empty()
                && scanned.extension == missing_extension;
            let mut score = 0i32;
            let mut reasons = Vec::new();
            if same_name {
                score += 260;
                reasons.push("same_name".to_string());
            }
            if same_stem {
                score += 180;
                reasons.push("same_stem".to_string());
            } else if similar_stem {
                score += 95;
                reasons.push("similar_stem".to_string());
            }
            if same_extension {
                score += 30;
                reasons.push("same_extension".to_string());
            }

            let mut size_match = false;
            if let Some(info) = missing_info {
                if let Some(expected) = info.expected_size {
                    if expected == scanned.size {
                        score += 320;
                        size_match = true;
                        reasons.push("size_match".to_string());
                    } else {
                        let diff = expected.abs_diff(scanned.size);
                        let pct = (diff as f64) / (expected.max(1) as f64);
                        if pct <= 0.01 {
                            score += 190;
                            reasons.push("size_close".to_string());
                        } else if pct <= 0.03 {
                            score += 120;
                            reasons.push("size_close".to_string());
                        } else if pct <= 0.08 {
                            score += 55;
                            reasons.push("size_close".to_string());
                        }
                    }
                }
                if let Some(title) = &info.title_norm {
                    if scanned.path_norm.contains(title) {
                        score += 90;
                        reasons.push("title_match".to_string());
                    }
                }
                if let Some(author) = &info.author_norm {
                    if scanned.path_norm.contains(author) {
                        score += 70;
                        reasons.push("author_match".to_string());
                    }
                }
            }

            if score <= 0 {
                continue;
            }
            let candidate = SimilarFileCandidate {
                path: scanned.path.clone(),
                score,
                reasons,
                same_extension,
                same_stem,
                same_name,
                size_match,
            };
            let key = path_key(&scanned.path);
            match candidates_by_path.get(&key) {
                Some(existing)
                    if existing.score > candidate.score
                        || (existing.score == candidate.score
                            && path_key(&existing.path) <= path_key(&candidate.path)) => {}
                _ => {
                    candidates_by_path.insert(key, candidate);
                }
            }
        }

        let mut candidates: Vec<SimilarFileCandidate> = candidates_by_path.into_values().collect();
        candidates.sort_by(|left, right| {
            right
                .score
                .cmp(&left.score)
                .then_with(|| path_key(&left.path).cmp(&path_key(&right.path)))
        });
        candidates.truncate(40);
        results.push(SimilarFileMatch {
            status: SimilarFileMatchStatus::Completed,
            original_file_path: original_file_path.clone(),
            candidates,
            message: None,
        });
    }

    Ok(results)
}

/// Find files with similar names to missing database entries.
/// Scans one folder recursively.  This compatibility command now returns the
/// same structured, backend-ordered candidates used by the relink owner.
#[tauri::command]
pub async fn find_similar_files(
    vdj_folder: String,
    missing_paths: Vec<String>,
    scan_folder: String,
) -> Result<Vec<SimilarFileMatch>, String> {
    find_candidates_for_paths(&vdj_folder, &missing_paths, &[scan_folder])
}

/// Find candidates for one reconciliation request across deduplicated roots.
#[tauri::command]
pub async fn find_relink_candidates(
    vdj_folder: String,
    original_file_path: String,
    scan_folders: Vec<String>,
) -> Result<SimilarFileMatch, String> {
    let mut matches = find_candidates_for_paths(
        &vdj_folder,
        std::slice::from_ref(&original_file_path),
        &scan_folders,
    )?;
    Ok(matches.pop().unwrap_or(SimilarFileMatch {
        status: SimilarFileMatchStatus::NotFound,
        original_file_path,
        candidates: Vec::new(),
        message: Some("No se encontró la entrada con la ruta original".to_string()),
    }))
}

fn typed_relink_result(
    status: RelinkFileStatus,
    original_file_path: &str,
    new_file_path: &str,
    file_size: Option<u64>,
    message: Option<String>,
    collision_path: Option<String>,
) -> RelinkFileResult {
    RelinkFileResult {
        status,
        original_file_path: original_file_path.to_string(),
        new_file_path: new_file_path.to_string(),
        file_size,
        collision_path,
        message,
    }
}

/// Reconcile one missing database entry by stable original path.
///
/// The command performs all validation before invoking the atomic
/// `FilePath`+`FileSize` patcher and returns a typed result for every expected
/// user-facing outcome.
#[tauri::command]
pub async fn relocate_file(
    vdj_folder: String,
    original_file_path: String,
    new_file_path: String,
) -> Result<RelinkFileResult, String> {
    if original_file_path.trim().is_empty() || new_file_path.trim().is_empty() {
        return Ok(typed_relink_result(
            RelinkFileStatus::FailedValidation,
            &original_file_path,
            &new_file_path,
            None,
            Some("La ruta original y la ruta destino son obligatorias".to_string()),
            None,
        ));
    }
    if parser::windows_paths_equal(&original_file_path, &new_file_path) {
        return Ok(typed_relink_result(
            RelinkFileStatus::FailedValidation,
            &original_file_path,
            &new_file_path,
            None,
            Some("La ruta destino debe ser distinta de la ruta original".to_string()),
            None,
        ));
    }

    let target_metadata = match std::fs::metadata(&new_file_path) {
        Ok(metadata) if metadata.is_file() => metadata,
        Ok(_) => {
            return Ok(typed_relink_result(
                RelinkFileStatus::FailedValidation,
                &original_file_path,
                &new_file_path,
                None,
                Some("La ruta destino no apunta a un archivo regular".to_string()),
                None,
            ));
        }
        Err(error) => {
            return Ok(typed_relink_result(
                RelinkFileStatus::FailedValidation,
                &original_file_path,
                &new_file_path,
                None,
                Some(format!("No se pudo leer metadata del destino: {}", error)),
                None,
            ));
        }
    };
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;
    let matching_count = db
        .songs
        .iter()
        .filter(|song| parser::windows_paths_equal(&song.file_path, &original_file_path))
        .count();
    if matching_count == 0 {
        return Ok(typed_relink_result(
            RelinkFileStatus::NotFound,
            &original_file_path,
            &new_file_path,
            Some(target_metadata.len()),
            Some("No se encontró la entrada con la ruta original".to_string()),
            None,
        ));
    }
    if matching_count > 1 {
        return Ok(typed_relink_result(
            RelinkFileStatus::ManualReviewRequired,
            &original_file_path,
            &new_file_path,
            Some(target_metadata.len()),
            Some("La ruta original coincide con más de una entrada".to_string()),
            None,
        ));
    }
    if let Some(collision) = db.songs.iter().find(|song| {
        !parser::windows_paths_equal(&song.file_path, &original_file_path)
            && parser::windows_paths_equal(&song.file_path, &new_file_path)
    }) {
        return Ok(typed_relink_result(
            RelinkFileStatus::ReferenceCollision,
            &original_file_path,
            &new_file_path,
            Some(target_metadata.len()),
            Some("La ruta destino ya pertenece a otra entrada catalogada".to_string()),
            Some(collision.file_path.clone()),
        ));
    }

    match parser::patch_song_path_in_place(
        &db_path,
        &original_file_path,
        &new_file_path,
    ) {
        Ok(result) => Ok(result),
        Err(error) => Ok(typed_relink_result(
            RelinkFileStatus::ManualReviewRequired,
            &original_file_path,
            &new_file_path,
            Some(target_metadata.len()),
            Some(error),
            None,
        )),
    }
}

/// List all subdirectories (one level) under a given folder path.
/// Used for tree navigation in BatchOperations.
#[tauri::command]
pub async fn list_subdirectories(folder_path: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err(format!("Carpeta no válida: {}", folder_path));
    }

    let mut dirs = Vec::new();
    let entries =
        std::fs::read_dir(&path).map_err(|e| format!("Error leyendo directorio: {}", e))?;

    for entry in entries.flatten() {
        if let Ok(ft) = entry.file_type() {
            if ft.is_dir() {
                dirs.push(entry.path().to_string_lossy().to_string());
            }
        }
    }

    dirs.sort();
    Ok(dirs)
}

/// Perform a dry-run of batch operations, returning what *would* happen.
#[derive(serde::Serialize)]
pub struct DryRunResult {
    pub description: String,
    pub affected_count: usize,
    pub details: Vec<String>,
}

#[tauri::command]
pub async fn dry_run_move(
    vdj_folder: String,
    song_indices: Vec<usize>,
    target_folder: String,
) -> Result<DryRunResult, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;
    let target = PathBuf::from(&target_folder);

    let mut details = Vec::new();
    let mut affected = 0usize;

    for &idx in &song_indices {
        if idx >= db.songs.len() {
            details.push(format!("⚠ Índice {} fuera de rango", idx));
            continue;
        }
        let old_path = PathBuf::from(&db.songs[idx].file_path);
        let file_name = old_path.file_name().unwrap_or_default();
        let new_path = target.join(file_name);

        if !old_path.exists() {
            details.push(format!("⚠ No existe: {}", old_path.display()));
        } else if new_path.exists() {
            details.push(format!(
                "⚠ Ya existe en destino: {}",
                new_path.display()
            ));
        } else {
            details.push(format!(
                "✓ {} → {}",
                old_path.display(),
                new_path.display()
            ));
            affected += 1;
        }
    }

    Ok(DryRunResult {
        description: format!(
            "Mover {} archivo(s) a {}",
            song_indices.len(),
            target_folder
        ),
        affected_count: affected,
        details,
    })
}

#[tauri::command]
pub async fn dry_run_rename(
    vdj_folder: String,
    song_indices: Vec<usize>,
    rename_pattern: String,
) -> Result<DryRunResult, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;

    let summaries: Vec<SongSummary> = db
        .songs
        .iter()
        .enumerate()
        .map(|(i, s)| s.to_summary(i))
        .collect();

    let mut details = Vec::new();
    let mut affected = 0usize;

    for &idx in &song_indices {
        if idx >= summaries.len() {
            details.push(format!("⚠ Índice {} fuera de rango", idx));
            continue;
        }
        let song = &summaries[idx];
        let ext = song
            .file_name
            .rsplit('.')
            .next()
            .unwrap_or("mp3");
        let new_name = rename_pattern
            .replace("{artist}", song.author.as_deref().unwrap_or("Unknown"))
            .replace("{title}", song.title.as_deref().unwrap_or(&song.file_name))
            .replace("{album}", song.album.as_deref().unwrap_or(""))
            .replace("{genre}", song.genre.as_deref().unwrap_or(""))
            .replace("{bpm}", &song.bpm.map(|b| format!("{:.0}", b)).unwrap_or_default())
            .replace("{year}", song.year.as_deref().unwrap_or(""))
            .replace(&['<', '>', ':', '"', '/', '\\', '|', '?', '*'][..], "_")
            + "."
            + ext;

        details.push(format!("{} → {}", song.file_name, new_name));
        affected += 1;
    }

    Ok(DryRunResult {
        description: format!(
            "Renombrar {} archivo(s) con patrón: {}",
            song_indices.len(),
            rename_pattern
        ),
        affected_count: affected,
        details,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir(test_name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should advance")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "vdj-manager-files-{test_name}-{}-{nonce}",
            std::process::id()
        ))
    }

    #[tokio::test]
    async fn relink_candidates_are_structured_ordered_and_dedupe_scan_roots() {
        let dir = unique_temp_dir("candidate-order");
        let root = dir.join("scan");
        std::fs::create_dir_all(&root).expect("scan root should be created");
        let candidate = root.join("Song.mp3");
        std::fs::write(&candidate, b"1234").expect("candidate should be written");
        let weaker = root.join("Song-copy.wav");
        std::fs::write(&weaker, b"123").expect("weaker candidate should be written");

        let missing = dir.join("missing").join("Song.mp3");
        let vdj_folder = dir.join("VirtualDJ");
        std::fs::create_dir_all(&vdj_folder).expect("VDJ folder should be created");
        let db_path = vdj_folder.join("database.xml");
        let xml = format!(
            r#"<VirtualDJ_Database><Song FilePath="{}" FileSize="4"><Tags Title="Song"/></Song></VirtualDJ_Database>"#,
            missing.to_string_lossy()
        );
        std::fs::write(&db_path, xml).expect("database fixture should be written");

        let result = find_relink_candidates(
            vdj_folder.to_string_lossy().to_string(),
            missing.to_string_lossy().to_string(),
            vec![
                root.to_string_lossy().to_string(),
                format!("{}/", root.to_string_lossy()),
            ],
        )
        .await
        .expect("candidate query should succeed");

        assert_eq!(result.candidates.len(), 2);
        assert_eq!(result.candidates[0].path, candidate.to_string_lossy());
        assert!(result.candidates[0].same_name);
        assert!(result.candidates[0].same_extension);
        assert!(result.candidates[0].size_match);
        assert!(result.candidates[0].reasons.iter().any(|reason| reason == "size_match"));
        assert!(result.candidates[0].score > result.candidates[1].score);

        std::fs::remove_dir_all(&dir).expect("temp directory should be removed");
    }

    #[tokio::test]
    async fn relink_candidates_report_not_found_for_absent_database_path() {
        let dir = unique_temp_dir("candidate-not-found");
        let vdj_folder = dir.join("VirtualDJ");
        std::fs::create_dir_all(&vdj_folder).expect("VDJ folder should be created");
        let known = r#"D:\Music\Known.mp3"#;
        let missing = r#"D:\Music\Missing.mp3"#;
        std::fs::write(
            vdj_folder.join("database.xml"),
            format!(r#"<VirtualDJ_Database><Song FilePath="{known}" FileSize="4"/></VirtualDJ_Database>"#),
        )
        .expect("database fixture should be written");

        let result = find_relink_candidates(
            vdj_folder.to_string_lossy().to_string(),
            missing.to_string(),
            Vec::new(),
        )
        .await
        .expect("absent source should be represented as a typed result");

        assert!(matches!(result.status, SimilarFileMatchStatus::NotFound));
        assert!(result.candidates.is_empty());
        assert!(result.message.is_some());
        std::fs::remove_dir_all(&dir).expect("temp directory should be removed");
    }

    #[tokio::test]
    async fn relink_candidates_require_manual_review_for_ambiguous_normalized_path() {
        let dir = unique_temp_dir("candidate-ambiguous");
        let vdj_folder = dir.join("VirtualDJ");
        std::fs::create_dir_all(&vdj_folder).expect("VDJ folder should be created");
        let xml = r#"<VirtualDJ_Database><Song FilePath="D:\Music\Track.mp3" FileSize="4"/><Song FilePath="D:/music/track.mp3" FileSize="4"/></VirtualDJ_Database>"#;
        std::fs::write(vdj_folder.join("database.xml"), xml)
            .expect("database fixture should be written");

        let result = find_relink_candidates(
            vdj_folder.to_string_lossy().to_string(),
            r#"d:/MUSIC/track.mp3"#.to_string(),
            Vec::new(),
        )
        .await
        .expect("ambiguous source should be represented as a typed result");

        assert!(matches!(
            result.status,
            SimilarFileMatchStatus::ManualReviewRequired
        ));
        assert!(result.candidates.is_empty());
        assert!(result.message.is_some());
        std::fs::remove_dir_all(&dir).expect("temp directory should be removed");
    }

    #[tokio::test]
    async fn relink_candidates_propagate_malformed_database_errors() {
        let dir = unique_temp_dir("candidate-malformed");
        let vdj_folder = dir.join("VirtualDJ");
        std::fs::create_dir_all(&vdj_folder).expect("VDJ folder should be created");
        std::fs::write(
            vdj_folder.join("database.xml"),
            r#"<VirtualDJ_Database><Song FilePath="D:\Music\Broken.mp3">"#,
        )
        .expect("malformed database fixture should be written");

        let error = find_relink_candidates(
            vdj_folder.to_string_lossy().to_string(),
            r#"D:\Music\Broken.mp3"#.to_string(),
            Vec::new(),
        )
        .await
        .expect_err("malformed database must not be treated as an empty candidate set");

        assert!(error.contains("parsear") || error.contains("XML"));
        std::fs::remove_dir_all(&dir).expect("temp directory should be removed");
    }

    #[tokio::test]
    async fn relocate_reports_reference_collision_before_patch() {
        let dir = unique_temp_dir("reference-collision");
        std::fs::create_dir_all(&dir).expect("temp dir should be created");
        let vdj_folder = dir.join("VirtualDJ");
        std::fs::create_dir_all(&vdj_folder).expect("VDJ folder should be created");
        let source = dir.join("old.mp3");
        let target = dir.join("Target.mp3");
        std::fs::write(&target, b"target").expect("target should be written");
        let db_path = vdj_folder.join("database.xml");
        let xml = format!(
            r#"<VirtualDJ_Database><Song FilePath="{}" FileSize="1"/><Song FilePath="{}" FileSize="6"/></VirtualDJ_Database>"#,
            source.to_string_lossy(),
            target.to_string_lossy()
        );
        std::fs::write(&db_path, xml).expect("database fixture should be written");
        let before = std::fs::read(&db_path).expect("database should be readable");

        let result = relocate_file(
            vdj_folder.to_string_lossy().to_string(),
            source.to_string_lossy().to_string().to_uppercase(),
            target.to_string_lossy().to_string().to_lowercase(),
        )
        .await
        .expect("collision should be represented as typed result");

        assert!(matches!(result.status, RelinkFileStatus::ReferenceCollision));
        assert_eq!(result.collision_path.as_deref(), Some(target.to_string_lossy().as_ref()));
        assert_eq!(before, std::fs::read(&db_path).expect("database should remain unchanged"));

        std::fs::remove_dir_all(&dir).expect("temp directory should be removed");
    }
}
