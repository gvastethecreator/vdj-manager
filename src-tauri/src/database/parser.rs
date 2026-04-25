//! VDJ database XML parser and serialiser using `quick-xml`.

use std::collections::HashMap;
use std::fs;
use std::path::Path;

use quick_xml::de::from_str;
use quick_xml::se::to_string;

use super::models::*;

/// Basic structural checks to catch obvious corruption before writing.
pub fn validate_database_integrity(db: &VdjDatabase) -> Result<(), String> {
    for (idx, song) in db.songs.iter().enumerate() {
        if song.file_path.trim().is_empty() {
            return Err(format!(
                "Entrada inválida en índice {}: FilePath vacío",
                idx
            ));
        }
    }

    Ok(())
}

/// Parse a VDJ database.xml file
pub fn parse_database(path: &Path) -> Result<VdjDatabase, String> {
    let content =
        fs::read_to_string(path).map_err(|e| format!("No se pudo leer el archivo: {}", e))?;

    // Remove BOM if present
    let content = content.trim_start_matches('\u{feff}');

    from_str::<VdjDatabase>(content)
        .map_err(|e| format!("Error al parsear la base de datos XML: {}", e))
}

/// Serialize and write the database back to XML
pub fn write_database(path: &Path, db: &VdjDatabase) -> Result<(), String> {
    let xml_header = r#"<?xml version="1.0" encoding="UTF-8"?>"#;
    let body = to_string(db).map_err(|e| format!("Error al serializar XML: {}", e))?;
    let output = format!("{}\n{}", xml_header, body);
    fs::write(path, output).map_err(|e| format!("Error al escribir archivo: {}", e))
}

/// Validate + write + reparse to ensure persisted XML remains healthy.
pub fn write_database_checked(path: &Path, db: &VdjDatabase) -> Result<(), String> {
    validate_database_integrity(db)?;
    write_database(path, db)?;
    let reparsed = parse_database(path)?;
    validate_database_integrity(&reparsed)
}

/// Compute aggregate statistics from the database
pub fn compute_stats(db: &VdjDatabase) -> DatabaseStats {
    let mut genres: HashMap<String, usize> = HashMap::new();
    let mut artists: HashMap<String, usize> = HashMap::new();
    let mut years: HashMap<String, usize> = HashMap::new();
    let mut bpm_sum = 0.0_f64;
    let mut bpm_count = 0usize;
    let mut songs_with_cues = 0usize;
    let mut songs_with_tags = 0usize;
    let mut total_size: u64 = 0;

    for song in &db.songs {
        if let Some(sz) = song.file_size {
            total_size += sz;
        }

        if let Some(tags) = &song.tags {
            songs_with_tags += 1;
            if let Some(g) = &tags.genre {
                if !g.is_empty() {
                    *genres.entry(g.clone()).or_insert(0) += 1;
                }
            }
            if let Some(a) = &tags.author {
                if !a.is_empty() {
                    *artists.entry(a.clone()).or_insert(0) += 1;
                }
            }
            if let Some(y) = &tags.year {
                if !y.is_empty() {
                    *years.entry(y.clone()).or_insert(0) += 1;
                }
            }
        }

        if let Some(scan) = &song.scan {
            if let Some(bpm_str) = &scan.bpm {
                if let Ok(v) = bpm_str.parse::<f64>() {
                    if v > 0.0 {
                        bpm_sum += 60.0 / v;
                        bpm_count += 1;
                    }
                }
            }
        }

        if !song.pois.is_empty() {
            songs_with_cues += 1;
        }
    }

    let mut genres_vec: Vec<(String, usize)> = genres.into_iter().collect();
    genres_vec.sort_by(|a, b| b.1.cmp(&a.1));

    let mut artists_vec: Vec<(String, usize)> = artists.into_iter().collect();
    artists_vec.sort_by(|a, b| b.1.cmp(&a.1));

    let mut years_vec: Vec<(String, usize)> = years.into_iter().collect();
    years_vec.sort_by(|a, b| a.0.cmp(&b.0));

    DatabaseStats {
        total_songs: db.songs.len(),
        total_size_bytes: total_size,
        genres: genres_vec,
        artists: artists_vec,
        years: years_vec,
        avg_bpm: if bpm_count > 0 {
            Some(bpm_sum / bpm_count as f64)
        } else {
            None
        },
        songs_with_cues,
        songs_with_tags,
    }
}
