//! Tauri commands for loading, saving, and editing the VDJ database.

use std::path::PathBuf;
use std::collections::HashSet;

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

/// The two explicit library-removal policies.  `trash_then_unindex` invokes
/// the OS recycle-bin operation before committing the XML patch; a failed
/// trash operation therefore leaves the catalog entry untouched.
#[derive(Debug, serde::Deserialize, serde::Serialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LibraryRemovalMode {
    DbOnly,
    TrashThenUnindex,
}

/// Typed per-item outcome returned by the library-removal engine.
#[derive(Debug, serde::Serialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LibraryRemovalStatus {
    Completed,
    FailedValidation,
    TrashFailed,
    ManualReviewRequired,
    NotFound,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveLibraryEntriesRequest {
    pub vdj_folder: String,
    pub items: Vec<String>,
    pub mode: LibraryRemovalMode,
}

#[derive(Debug, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LibraryRemovalResult {
    pub original_file_path: String,
    pub status: LibraryRemovalStatus,
    pub mode: LibraryRemovalMode,
    pub message: Option<String>,
}

fn dedupe_removal_paths(items: &[String]) -> Vec<String> {
    let mut seen = HashSet::new();
    items
        .iter()
        .filter_map(|path| {
            let key = parser::normalize_windows_path(path).to_lowercase();
            if seen.insert(key) {
                Some(path.clone())
            } else {
                None
            }
        })
        .collect()
}

fn validate_trash_candidate(path: &std::path::Path) -> Result<(), String> {
    if !path.is_absolute() {
        return Err("La ruta física debe ser absoluta para usar la papelera".to_string());
    }
    let metadata = std::fs::symlink_metadata(path)
        .map_err(|error| format!("No se pudo validar el archivo físico: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.file_type().is_file() {
        return Err("La papelera sólo acepta un archivo regular, no enlaces ni directorios".to_string());
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        use windows_sys::Win32::Storage::FileSystem::FILE_ATTRIBUTE_REPARSE_POINT;
        if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
            return Err("La ruta física es un reparse point y requiere revisión manual".to_string());
        }
    }
    Ok(())
}

fn map_remove_song_result(
    mode: LibraryRemovalMode,
    result: parser::RemoveSongResult,
) -> LibraryRemovalResult {
    let status = match result.status {
        parser::RemoveSongStatus::Completed => LibraryRemovalStatus::Completed,
        parser::RemoveSongStatus::FailedValidation => LibraryRemovalStatus::FailedValidation,
        parser::RemoveSongStatus::NotFound => LibraryRemovalStatus::NotFound,
        // The public removal contract intentionally keeps the status set
        // small; an ambiguous identity is unsafe to resolve automatically and
        // therefore takes the same manual-review path as an optimistic race.
        parser::RemoveSongStatus::Ambiguous => LibraryRemovalStatus::ManualReviewRequired,
        parser::RemoveSongStatus::ManualReviewRequired => LibraryRemovalStatus::ManualReviewRequired,
        parser::RemoveSongStatus::TrashFailed => LibraryRemovalStatus::TrashFailed,
    };
    LibraryRemovalResult {
        original_file_path: result.original_file_path,
        status,
        mode,
        message: result.message,
    }
}

/// Remove library entries by their stable `originalFilePath` identity.
///
/// The injected trash closure is deliberately part of this core seam so tests
/// can exercise the failure ordering without touching the user's recycle bin.
/// Each unique path is processed independently; a failed trash step never
/// reaches the XML commit, while a successful trash followed by a failed or
/// conflicting XML commit is surfaced as `manual_review_required`.
pub fn remove_library_entries<F>(
    db_path: &std::path::Path,
    items: &[String],
    mode: LibraryRemovalMode,
    mut trash_file: F,
) -> Result<Vec<LibraryRemovalResult>, String>
where
    F: FnMut(&str) -> Result<(), String>,
{
    let unique_paths = dedupe_removal_paths(items);
    let database = parser::parse_database(db_path)?;
    let mut planned = Vec::with_capacity(unique_paths.len());

    // Complete the whole batch preflight before the first trash or XML write.
    // Unsafe identities remain per-item results; only uniquely matched items
    // proceed to the independent commit phase below.
    for original_file_path in unique_paths {
        if original_file_path.trim().is_empty() {
            planned.push(Err(LibraryRemovalResult {
                original_file_path,
                status: LibraryRemovalStatus::FailedValidation,
                mode,
                message: Some("La ruta original es obligatoria".to_string()),
            }));
            continue;
        }

        let matches: Vec<&str> = database
            .songs
            .iter()
            .filter(|song| parser::windows_paths_equal(&song.file_path, &original_file_path))
            .map(|song| song.file_path.as_str())
            .collect();
        let blocked = match matches.len() {
            0 => Some((
                LibraryRemovalStatus::NotFound,
                "No se encontró la entrada con la ruta original",
            )),
            1 => None,
            _ => Some((
                LibraryRemovalStatus::ManualReviewRequired,
                "La ruta original coincide con más de una entrada",
            )),
        };
        let trash_validation = if blocked.is_none() && mode == LibraryRemovalMode::TrashThenUnindex {
            validate_trash_candidate(std::path::Path::new(matches[0])).err()
        } else {
            None
        };
        if let Some(message) = trash_validation {
            planned.push(Err(LibraryRemovalResult {
                original_file_path,
                status: LibraryRemovalStatus::FailedValidation,
                mode,
                message: Some(message),
            }));
        } else if let Some((status, message)) = blocked {
            planned.push(Err(LibraryRemovalResult {
                original_file_path,
                status,
                mode,
                message: Some(message.to_string()),
            }));
        } else {
            planned.push(Ok(original_file_path));
        }
    }

    let mut results = Vec::with_capacity(planned.len());
    for plan in planned {
        let original_file_path = match plan {
            Ok(path) => path,
            Err(result) => {
                results.push(result);
                continue;
            }
        };
        let parser_result = match mode {
            LibraryRemovalMode::DbOnly => parser::remove_song_in_place(db_path, &original_file_path),
            LibraryRemovalMode::TrashThenUnindex => {
                parser::remove_song_in_place_with_before_commit(
                    db_path,
                    &original_file_path,
                    |current_file_path| {
                        validate_trash_candidate(std::path::Path::new(current_file_path))
                            .map_err(parser::RemoveSongPreCommitError::FailedValidation)?;
                        trash_file(current_file_path)
                            .map_err(parser::RemoveSongPreCommitError::TrashFailed)
                    },
                )
            }
        };
        match parser_result {
            Ok(result) => results.push(map_remove_song_result(mode, result)),
            Err(error) => results.push(LibraryRemovalResult {
                original_file_path,
                status: LibraryRemovalStatus::FailedValidation,
                mode,
                message: Some(format!("No se pudo procesar este ítem de forma segura: {error}")),
            }),
        }
    }
    Ok(results)
}

/// Tauri wrapper for the typed library-removal core.
#[tauri::command]
pub async fn remove_library_entries_command(
    request: RemoveLibraryEntriesRequest,
) -> Result<Vec<LibraryRemovalResult>, String> {
    let db_path = PathBuf::from(request.vdj_folder).join("database.xml");
    remove_library_entries(&db_path, &request.items, request.mode, |path| {
        trash::delete(path).map_err(|error| format!("No se pudo enviar a papelera: {}", error))
    })
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_database(test_name: &str, xml: &str) -> (std::path::PathBuf, std::path::PathBuf) {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time should advance")
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "vdj-manager-library-remove-{test_name}-{}-{nonce}",
            std::process::id()
        ));
        fs::create_dir_all(&dir).expect("temp dir should exist");
        let db_path = dir.join("database.xml");
        fs::write(&db_path, xml).expect("database fixture should write");
        (dir, db_path)
    }

    fn temp_trash_database(
        test_name: &str,
        file_names: &[&str],
    ) -> (std::path::PathBuf, std::path::PathBuf, Vec<std::path::PathBuf>) {
        let (dir, db_path) = temp_database(test_name, "<VirtualDJ_Database />");
        let music_dir = dir.join("music");
        fs::create_dir_all(&music_dir).expect("music fixture dir should exist");
        let mut files = Vec::new();
        let mut songs = String::new();
        for file_name in file_names {
            let path = music_dir.join(file_name);
            fs::write(&path, b"fixture audio").expect("audio fixture should write");
            let xml_path = path.to_string_lossy().replace('&', "&amp;");
            songs.push_str(&format!(r#"<Song FilePath="{xml_path}" FutureSong="keep"/>"#));
            files.push(path);
        }
        fs::write(
            &db_path,
            format!(r#"<VirtualDJ_Database FutureRoot="keep">{songs}</VirtualDJ_Database>"#),
        )
        .expect("trash database fixture should write");
        (dir, db_path, files)
    }

    const XML: &str = r#"<?xml version="1.0" encoding="UTF-8"?>
<VirtualDJ_Database Version="8.1" FutureRoot="keep-root">
  <Song FilePath="D:\Music\Keep.mp3" FutureSong="keep-song" />
  <Song FilePath="D:\Music\Remove.mp3" FutureSong="remove-song"><Tags FutureTags="keep-tags" /></Song>
</VirtualDJ_Database>
"#;

    #[test]
    fn db_only_removes_by_path_and_preserves_unknown_xml() {
        let (dir, db_path) = temp_database("db-only", XML);
        let items = vec![r"d:/music/remove.mp3".to_string()];

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::DbOnly,
            |_| panic!("db_only must not touch trash"),
        )
        .expect("db_only removal should return typed results");

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].status, LibraryRemovalStatus::Completed);
        assert_eq!(results[0].mode, LibraryRemovalMode::DbOnly);
        let output = fs::read_to_string(&db_path).expect("database should remain readable");
        assert!(output.contains(r#"FutureRoot="keep-root""#));
        assert!(output.contains(r#"FutureSong="keep-song""#));
        assert!(!output.contains(r#"Remove.mp3"#));
        assert!(!output.contains(r#"FutureTags="keep-tags""#));
        let parsed = parser::parse_database(&db_path).expect("database should reparse");
        assert_eq!(parsed.songs.len(), 1);
        assert_eq!(parsed.songs[0].file_path, r"D:\Music\Keep.mp3");

        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn trash_then_unindex_runs_trash_before_successful_db_commit() {
        let (dir, db_path, files) = temp_trash_database("trash-success", &["Remove.mp3"]);
        let canonical = files[0].to_string_lossy().to_string();
        let items = vec![canonical.replace('\\', "/").to_lowercase()];
        let mut trashed = Vec::new();

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::TrashThenUnindex,
            |path| {
                trashed.push(path.to_string());
                Ok(())
            },
        )
        .expect("trash_then_unindex should return typed results");

        assert_eq!(results[0].status, LibraryRemovalStatus::Completed);
        assert_eq!(
            trashed,
            vec![canonical],
            "trash must receive the canonical path stored in database.xml"
        );
        assert!(parser::parse_database(&db_path)
            .expect("database should remain readable")
            .songs
            .is_empty());

        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn trash_failure_keeps_database_bytes_and_catalog_entry() {
        let (dir, db_path, files) = temp_trash_database("trash-failure", &["Remove.mp3"]);
        let before = fs::read(&db_path).expect("database should be readable");
        let items = vec![files[0].to_string_lossy().to_string()];

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::TrashThenUnindex,
            |_| Err("simulated trash failure".to_string()),
        )
        .expect("trash failure should be a typed result");

        assert_eq!(results[0].status, LibraryRemovalStatus::TrashFailed);
        assert_eq!(before, fs::read(&db_path).expect("database bytes must be unchanged"));
        assert!(fs::read_to_string(&db_path)
            .expect("database should remain readable")
            .contains(r#"Remove.mp3"#));

        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn duplicate_case_insensitive_paths_are_processed_once() {
        let (dir, db_path) = temp_database("dedupe", XML);
        let items = vec![
            r"D:\Music\Remove.mp3".to_string(),
            r"d:/music/remove.mp3".to_string(),
            r"D:\Music\Keep.mp3".to_string(),
        ];

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::DbOnly,
            |_| panic!("db_only must not touch trash"),
        )
        .expect("dedupe should return typed results");

        assert_eq!(results.len(), 2);
        assert!(results
            .iter()
            .all(|result| result.status == LibraryRemovalStatus::Completed));
        assert!(parser::parse_database(&db_path)
            .expect("database should reparse")
            .songs
            .is_empty());

        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn trash_success_followed_by_optimistic_db_conflict_requires_manual_review() {
        let (dir, db_path, files) = temp_trash_database("manual-review", &["Remove.mp3"]);
        let items = vec![files[0].to_string_lossy().to_string()];
        let db_for_race = db_path.clone();

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::TrashThenUnindex,
            move |_| {
                fs::write(
                    &db_for_race,
                    r#"<VirtualDJ_Database FutureRoot="external"><Song FilePath="D:\Music\Remove.mp3"/></VirtualDJ_Database>"#,
                )
                .map_err(|error| error.to_string())
            },
        )
        .expect("optimistic conflict should be typed");

        assert_eq!(results[0].status, LibraryRemovalStatus::ManualReviewRequired);
        assert!(fs::read_to_string(&db_path)
            .expect("database should remain readable")
            .contains(r#"FutureRoot="external""#));

        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn trash_mode_rejects_a_catalog_path_that_points_to_a_directory() {
        let (dir, db_path) = temp_database("trash-directory", "<VirtualDJ_Database />");
        let directory_target = dir.join("not-a-song");
        fs::create_dir_all(&directory_target).expect("directory fixture should exist");
        fs::write(
            &db_path,
            format!(
                r#"<VirtualDJ_Database><Song FilePath="{}"/></VirtualDJ_Database>"#,
                directory_target.to_string_lossy()
            ),
        )
        .expect("database fixture should write");

        let results = remove_library_entries(
            &db_path,
            &[directory_target.to_string_lossy().to_string()],
            LibraryRemovalMode::TrashThenUnindex,
            |_| panic!("unsafe directory must never reach trash"),
        )
        .expect("unsafe target should be typed");

        assert_eq!(results[0].status, LibraryRemovalStatus::FailedValidation);
        assert!(directory_target.is_dir());
        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn post_trash_database_read_failure_is_typed_and_keeps_prior_batch_results() {
        let (dir, db_path, files) =
            temp_trash_database("trash-read-failure", &["First.mp3", "Second.mp3"]);
        let items: Vec<String> = files
            .iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect();
        let db_for_failure = db_path.clone();
        let mut calls = 0usize;

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::TrashThenUnindex,
            move |_| {
                calls += 1;
                if calls == 2 {
                    fs::remove_file(&db_for_failure).map_err(|error| error.to_string())?;
                }
                Ok(())
            },
        )
        .expect("post-trash database failure must remain per-item");

        assert_eq!(results.len(), 2);
        assert_eq!(results[0].status, LibraryRemovalStatus::Completed);
        assert_eq!(results[1].status, LibraryRemovalStatus::ManualReviewRequired);
        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn later_internal_error_does_not_discard_an_earlier_item_outcome() {
        let (dir, db_path, files) =
            temp_trash_database("trash-partial-internal", &["First.mp3", "Second.mp3"]);
        let items: Vec<String> = files
            .iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect();
        let db_for_failure = db_path.clone();
        let mut calls = 0usize;

        let results = remove_library_entries(
            &db_path,
            &items,
            LibraryRemovalMode::TrashThenUnindex,
            move |_| {
                calls += 1;
                if calls == 1 {
                    fs::remove_file(&db_for_failure).map_err(|error| error.to_string())?;
                }
                Ok(())
            },
        )
        .expect("batch-level setup succeeded, so item errors must stay typed");

        assert_eq!(results.len(), 2);
        assert_eq!(results[0].status, LibraryRemovalStatus::ManualReviewRequired);
        assert_eq!(results[1].status, LibraryRemovalStatus::FailedValidation);
        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }

    #[test]
    fn pre_trash_revalidation_failure_is_not_mislabeled_as_trash_failure() {
        let (dir, db_path, files) =
            temp_trash_database("trash-revalidation", &["Track.mp3"]);
        let result = parser::remove_song_in_place_with_before_commit(
            &db_path,
            &files[0].to_string_lossy(),
            |_| {
                Err(parser::RemoveSongPreCommitError::FailedValidation(
                    "target cambió antes de papelera".to_string(),
                ))
            },
        )
        .expect("revalidation failure should be typed");

        assert_eq!(result.status, parser::RemoveSongStatus::FailedValidation);
        assert!(files[0].is_file());
        fs::remove_dir_all(dir).expect("temp dir should be removed");
    }
}
