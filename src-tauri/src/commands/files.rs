//! Tauri commands for file verification and file-system operations.

use std::collections::HashMap;
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

/// A candidate match for relocating a missing file.
#[derive(serde::Serialize, Clone)]
pub struct SimilarFileMatch {
    /// The original missing path from the database
    pub missing_path: String,
    /// Candidate files found on disk with similar names
    pub candidates: Vec<String>,
}

/// Find files with similar names to missing database entries.
/// Scans `scan_folder` recursively and matches by filename similarity.
#[tauri::command]
pub async fn find_similar_files(
    vdj_folder: String,
    missing_paths: Vec<String>,
    scan_folder: String,
) -> Result<Vec<SimilarFileMatch>, String> {
    fn normalize_for_match(raw: &str) -> String {
        raw.to_lowercase()
            .chars()
            .map(|ch| if ch.is_alphanumeric() { ch } else { ' ' })
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
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
        size: Option<u64>,
        path_norm: String,
    }

    // Optional DB context for stronger matching (size/title/author)
    let db_context: HashMap<String, MissingInfo> = {
        let db_path = PathBuf::from(&vdj_folder).join("database.xml");
        match parser::parse_database(&db_path) {
            Ok(db) => db
                .songs
                .into_iter()
                .map(|song| {
                    let extension = std::path::Path::new(&song.file_path)
                        .extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_default();

                    let info = MissingInfo {
                        expected_size: song.file_size,
                        title_norm: song
                            .tags
                            .as_ref()
                            .and_then(|t| t.title.as_ref())
                            .map(|v| normalize_for_match(v))
                            .filter(|v| !v.is_empty()),
                        author_norm: song
                            .tags
                            .as_ref()
                            .and_then(|t| t.author.as_ref())
                            .map(|v| normalize_for_match(v))
                            .filter(|v| !v.is_empty()),
                        extension,
                    };

                    (song.file_path.to_lowercase(), info)
                })
                .collect(),
            Err(_) => HashMap::new(),
        }
    };

    // Build scan index from disk for scoring
    let mut scanned_files: Vec<ScannedFile> = Vec::new();

    for entry in WalkDir::new(&scan_folder)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            if let Some(name) = entry.path().file_name() {
                let name_lower = name.to_string_lossy().to_lowercase();
                let stem_lower = entry
                    .path()
                    .file_stem()
                    .map(|s| s.to_string_lossy().to_lowercase())
                    .unwrap_or_default();
                let extension = entry
                    .path()
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase())
                    .unwrap_or_default();
                let path = entry.path().to_string_lossy().to_string();

                scanned_files.push(ScannedFile {
                    path_norm: normalize_for_match(&path),
                    path,
                    name_lower,
                    stem_lower,
                    extension,
                    size: entry.metadata().ok().map(|m| m.len()),
                });
            }
        }
    }

    let mut results = Vec::new();
    for missing in &missing_paths {
        let missing_name = std::path::Path::new(missing)
            .file_name()
            .map(|n| n.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        // Strip extension for fuzzy matching
        let missing_stem = std::path::Path::new(&missing_name)
            .file_stem()
            .map(|s| s.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        let missing_info = db_context.get(&missing.to_lowercase());
        let mut scored_candidates: HashMap<String, i32> = HashMap::new();

        for scanned in &scanned_files {
            let mut score = 0i32;

            // Name-based matching (existing behavior, but now always scored)
            if scanned.name_lower == missing_name {
                score += 260;
            }

            if !missing_stem.is_empty() {
                if scanned.stem_lower == missing_stem {
                    score += 180;
                } else if scanned.stem_lower.contains(&missing_stem)
                    || missing_stem.contains(&scanned.stem_lower)
                {
                    score += 95;
                }
            }

            // Extension hint
            let missing_ext = missing_info
                .map(|i| i.extension.as_str())
                .unwrap_or_else(|| {
                    std::path::Path::new(missing)
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("")
                })
                .to_lowercase();

            if !missing_ext.is_empty() && scanned.extension == missing_ext {
                score += 30;
            }

            // Size-based matching from DB expected size
            if let Some(info) = missing_info {
                if let (Some(expected), Some(actual)) = (info.expected_size, scanned.size) {
                    if expected == actual {
                        score += 320;
                    } else {
                        let diff = expected.abs_diff(actual);
                        let pct = (diff as f64) / (expected.max(1) as f64);
                        if pct <= 0.01 {
                            score += 190;
                        } else if pct <= 0.03 {
                            score += 120;
                        } else if pct <= 0.08 {
                            score += 55;
                        }
                    }
                }

                // Metadata hint from song title/author against full candidate path
                if let Some(title) = &info.title_norm {
                    if !title.is_empty() && scanned.path_norm.contains(title) {
                        score += 90;
                    }
                }

                if let Some(author) = &info.author_norm {
                    if !author.is_empty() && scanned.path_norm.contains(author) {
                        score += 70;
                    }
                }
            }

            if score > 0 {
                scored_candidates
                    .entry(scanned.path.clone())
                    .and_modify(|existing| {
                        if score > *existing {
                            *existing = score;
                        }
                    })
                    .or_insert(score);
            }
        }

        // Keep compatibility: ordered string paths only
        let mut candidates: Vec<(String, i32)> = scored_candidates.into_iter().collect();
        candidates.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

        // Guardrail: avoid flooding UI with huge candidate sets
        if candidates.len() > 40 {
            candidates.truncate(40);
        }

        if !candidates.is_empty() {
            results.push(SimilarFileMatch {
                missing_path: missing.clone(),
                candidates: candidates.into_iter().map(|(path, _)| path).collect(),
            });
        }
    }

    Ok(results)
}

/// Relocate a missing file: update its path in the database to a new location.
/// Creates a timestamped backup before writing.
#[tauri::command]
pub async fn relocate_file(
    vdj_folder: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let mut db = parser::parse_database(&db_path)?;

    // Verify new file exists
    if !PathBuf::from(&new_path).exists() {
        return Err(format!("El archivo destino no existe: {}", new_path));
    }

    let mut found = false;
    for song in &mut db.songs {
        if song.file_path == old_path {
            song.file_path = new_path.clone();
            // Update file size from actual file
            if let Ok(meta) = std::fs::metadata(&new_path) {
                song.file_size = Some(meta.len());
            }
            found = true;
            break;
        }
    }

    if !found {
        return Err(format!(
            "No se encontró la entrada con ruta: {}",
            old_path
        ));
    }

    safety::create_timestamped_backup(&db_path, "database")?;

    parser::write_database_checked(&db_path, &db)
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
