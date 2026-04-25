//! Tauri command for finding duplicate songs by name, size, and content hash.

use std::collections::HashMap;
use std::io::Read;
use std::path::PathBuf;

use md5::{Digest, Md5};

use crate::database::models::*;
use crate::database::parser;

/// Result bundle returned by [`find_duplicates`].
#[derive(serde::Serialize, Clone)]
pub struct DuplicateResult {
    pub by_name: Vec<DuplicateGroup>,
    pub by_size: Vec<DuplicateGroup>,
    pub by_hash: Vec<DuplicateGroup>,
}

/// Analyse the database for duplicates using three strategies.
///
/// - **by_name**: normalised (lowercased) file names.
/// - **by_size**: exact file size matches (> 0 bytes).
/// - **by_hash**: partial MD5 (first 64 KB) for size-matched files.
#[tauri::command]
pub async fn find_duplicates(vdj_folder: String) -> Result<DuplicateResult, String> {
    let db_path = PathBuf::from(&vdj_folder).join("database.xml");
    let db = parser::parse_database(&db_path)?;

    let summaries: Vec<SongSummary> = db
        .songs
        .iter()
        .enumerate()
        .map(|(i, s)| s.to_summary(i))
        .collect();

    // ─── By normalized file name ───
    let mut by_name: HashMap<String, Vec<SongSummary>> = HashMap::new();
    for s in &summaries {
        let normalized = s.file_name.to_lowercase();
        by_name.entry(normalized).or_default().push(s.clone());
    }
    let by_name_groups: Vec<DuplicateGroup> = by_name
        .into_iter()
        .filter(|(_, v)| v.len() > 1)
        .map(|(k, v)| DuplicateGroup { key: k, songs: v })
        .collect();

    // ─── By file size (only for files that exist) ───
    let mut by_size: HashMap<u64, Vec<SongSummary>> = HashMap::new();
    for s in &summaries {
        if let Some(sz) = s.file_size {
            if sz > 0 {
                by_size.entry(sz).or_default().push(s.clone());
            }
        }
    }
    let by_size_groups: Vec<DuplicateGroup> = by_size
        .into_iter()
        .filter(|(_, v)| v.len() > 1)
        .map(|(k, v)| DuplicateGroup {
            key: format!("{} bytes", k),
            songs: v,
        })
        .collect();

    // ─── By MD5 hash (first 64KB of existing files with matching sizes) ───
    let mut hash_candidates: Vec<&SongSummary> = Vec::new();
    for group in &by_size_groups {
        for song in &group.songs {
            hash_candidates.push(song);
        }
    }

    let mut by_hash_map: HashMap<String, Vec<SongSummary>> = HashMap::new();
    for s in hash_candidates {
        let path = PathBuf::from(&s.file_path);
        if path.exists() {
            if let Ok(hash) = compute_partial_hash(&path) {
                by_hash_map.entry(hash).or_default().push(s.clone());
            }
        }
    }
    let by_hash_groups: Vec<DuplicateGroup> = by_hash_map
        .into_iter()
        .filter(|(_, v)| v.len() > 1)
        .map(|(k, v)| DuplicateGroup { key: k, songs: v })
        .collect();

    Ok(DuplicateResult {
        by_name: by_name_groups,
        by_size: by_size_groups,
        by_hash: by_hash_groups,
    })
}

/// Compute MD5 hash of the first 64KB of a file
fn compute_partial_hash(path: &PathBuf) -> Result<String, String> {
    let mut file =
        std::fs::File::open(path).map_err(|e| format!("Error abriendo archivo: {}", e))?;
    let mut buffer = vec![0u8; 65536];
    let bytes_read = file
        .read(&mut buffer)
        .map_err(|e| format!("Error leyendo archivo: {}", e))?;
    buffer.truncate(bytes_read);

    let mut hasher = Md5::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}
