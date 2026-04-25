//! Tauri commands for reading VirtualDJ playlists.
//!
//! VDJ stores playlists as `.m3u` / `.m3u8` files under
//! `<VirtualDJ folder>/Playlists/`, optionally grouped in subfolders.

use serde::Serialize;
use std::path::{Path, PathBuf};

const PLAYLIST_EXTENSIONS: [&str; 4] = ["m3u", "m3u8", "vdjplaylist", "vdjlist"];

/// A playlist entry returned to the frontend.
#[derive(Debug, Serialize, Clone)]
pub struct PlaylistInfo {
    /// Display name (file stem).
    pub name: String,
    /// Absolute path to the .m3u/.m3u8 file.
    pub path: String,
    /// Subfolder inside Playlists/ (empty string for root-level playlists).
    pub folder: String,
    /// Number of entries in the playlist.
    pub count: usize,
    /// Playlist format extension (m3u, m3u8, vdjplaylist, vdjlist).
    pub format: String,
}

/// A single entry from a parsed playlist.
#[derive(Debug, Serialize, Clone)]
pub struct PlaylistEntry {
    /// Absolute file path (resolved relative to the playlist location).
    pub file_path: String,
}

/// Recursively discover `.m3u` / `.m3u8` playlists under `Playlists/`.
#[tauri::command]
pub async fn list_playlists(vdj_folder: String) -> Result<Vec<PlaylistInfo>, String> {
    let root = Path::new(&vdj_folder).join("Playlists");
    if !root.is_dir() {
        return Ok(vec![]);
    }

    let mut playlists = Vec::new();
    collect_playlists(&root, &root, &mut playlists).map_err(|e| e.to_string())?;
    playlists.sort_by(|a, b| a.folder.cmp(&b.folder).then(a.name.cmp(&b.name)));
    Ok(playlists)
}

/// Read the entries of a single playlist file.
#[tauri::command]
pub async fn read_playlist(playlist_path: String) -> Result<Vec<PlaylistEntry>, String> {
    let path = Path::new(&playlist_path);
    if !path.is_file() {
        return Err(format!("Playlist not found: {playlist_path}"));
    }

    parse_playlist_entries(path)
}

fn parse_playlist_entries(path: &Path) -> Result<Vec<PlaylistEntry>, String> {
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let parent = path.parent().unwrap_or(Path::new(""));
    let mut entries = Vec::new();

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    let is_vdj_virtual = ext == "vdjplaylist" || ext == "vdjlist";

    if is_vdj_virtual {
        // VDJ virtual playlists are XML-like and commonly store paths as FilePath="..."
        // We parse this attribute in a tolerant way to support small format differences.
        let mut cursor = 0usize;
        while let Some(rel_start) = content[cursor..].find("FilePath=\"") {
            let start = cursor + rel_start + "FilePath=\"".len();
            let Some(rel_end) = content[start..].find('"') else {
                break;
            };
            let end = start + rel_end;
            let raw_path = &content[start..end];
            if !raw_path.trim().is_empty() {
                let resolved = resolve_playlist_entry_path(parent, raw_path);
                entries.push(PlaylistEntry { file_path: resolved });
            }
            cursor = end + 1;
        }
    }

    // Fallback parser for M3U and tolerant line-based extraction.
    if entries.is_empty() {
        for line in content.lines() {
            let line = line.trim();
            // Skip empty lines, comments, and extended M3U directives
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let resolved = resolve_playlist_entry_path(parent, line);
            entries.push(PlaylistEntry { file_path: resolved });
        }
    }

    entries.sort_by(|a, b| a.file_path.cmp(&b.file_path));
    entries.dedup_by(|a, b| a.file_path.eq_ignore_ascii_case(&b.file_path));

    Ok(entries)
}

fn resolve_playlist_entry_path(parent: &Path, raw: &str) -> String {
    let file_path = if Path::new(raw).is_absolute() {
        PathBuf::from(raw)
    } else {
        parent.join(raw)
    };

    let resolved = match file_path.canonicalize() {
        Ok(p) => p.to_string_lossy().to_string(),
        Err(_) => file_path.to_string_lossy().to_string(),
    };

    // Strip the \\?\ prefix that canonicalize adds on Windows
    resolved
        .strip_prefix(r"\\?\")
        .unwrap_or(&resolved)
        .to_string()
}

/// Recursively walk a directory collecting playlist files.
fn collect_playlists(
    dir: &Path,
    root: &Path,
    out: &mut Vec<PlaylistInfo>,
) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let path = entry.path();
        if ft.is_dir() {
            collect_playlists(&path, root, out)?;
        } else if ft.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_ascii_lowercase();
                if PLAYLIST_EXTENSIONS.contains(&ext_lower.as_str()) {
                    let name = path
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();
                    let folder = path
                        .parent()
                        .and_then(|p| p.strip_prefix(root).ok())
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_default();
                    let count = count_playlist_entries(&path);
                    out.push(PlaylistInfo {
                        name,
                        path: path.to_string_lossy().to_string(),
                        folder,
                        count,
                        format: ext_lower,
                    });
                }
            }
        }
    }
    Ok(())
}

/// Quick count of non-comment, non-empty lines in a playlist file.
fn count_playlist_entries(path: &Path) -> usize {
    parse_playlist_entries(path)
        .map(|entries| entries.len())
        .unwrap_or(0)
}
