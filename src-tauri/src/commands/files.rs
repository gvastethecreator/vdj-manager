//! Tauri commands for file verification and file-system operations.

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

use crate::database::models::*;
use crate::database::parser;
use crate::mutation_journal::{
    MutationJournalItem, MutationJournalPhase, MutationJournalStore, MutationOperationKind,
};

use serde::{Deserialize, Serialize};
use tauri::Manager;
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

/// Request for the journaled single-item rename operation.
///
/// `original_file_path` is the stable database identity.  The command never
/// accepts a UI index and `new_file_name` is deliberately a literal filename;
/// pattern expansion and sanitization belong nowhere in this critical path.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameFileRequest {
    pub vdj_folder: String,
    pub original_file_path: String,
    pub new_file_name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RenameFileStatus {
    Completed,
    FailedValidation,
    TargetConflict,
    RolledBack,
    ManualReviewRequired,
    JournalFailure,
}

/// Machine-readable outcome of the single-item rename choreography.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameFileResult {
    pub status: RenameFileStatus,
    pub original_file_path: String,
    pub new_file_path: String,
    pub journal_id: Option<String>,
    pub phase: Option<MutationJournalPhase>,
    pub message: Option<String>,
}

impl RenameFileResult {
    fn new(
        status: RenameFileStatus,
        original_file_path: impl Into<String>,
        new_file_path: impl Into<String>,
        journal_id: Option<String>,
        phase: Option<MutationJournalPhase>,
        message: Option<String>,
    ) -> Self {
        Self {
            status,
            original_file_path: original_file_path.into(),
            new_file_path: new_file_path.into(),
            journal_id,
            phase,
            message,
        }
    }
}

/// Rename a single file and patch its database reference with a durable
/// journal and physical rollback on every database failure.
///
/// Tauri resolves the app-data directory here, while the core below receives
/// a caller-owned [`MutationJournalStore`].  Keeping that seam explicit makes
/// the filesystem/database choreography testable with temporary directories.
#[tauri::command]
pub async fn rename_file_op(
    app: tauri::AppHandle,
    request: RenameFileRequest,
) -> Result<RenameFileResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("No se pudo resolver app-data para el journal: {error}"))?;
    let store = MutationJournalStore::new(app_data_dir);
    Ok(rename_file_core(&store, request))
}

/// Core rename engine using the production filesystem rename and patcher.
pub fn rename_file_core(
    store: &MutationJournalStore,
    request: RenameFileRequest,
) -> RenameFileResult {
    rename_file_core_with_hooks(
        store,
        request,
        rename_without_replace,
        |database_path, original_file_path, new_file_path| {
            let patch = parser::patch_song_path_in_place(
                database_path,
                original_file_path,
                new_file_path,
            )?;
            match patch.status {
                RelinkFileStatus::Completed => Ok(()),
                status => Err(format!(
                    "patch_song_path_in_place no completó ({status:?}): {}",
                    patch
                        .message
                        .unwrap_or_else(|| "resultado no exitoso".to_string())
                )),
            }
        },
    )
}

/// Move a regular file without ever replacing a destination that appeared
/// after preflight. The same primitive is used for forward apply and rollback.
#[cfg(windows)]
fn rename_without_replace(from: &Path, to: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::MoveFileExW;

    let from_wide: Vec<u16> = from.as_os_str().encode_wide().chain(Some(0)).collect();
    let to_wide: Vec<u16> = to.as_os_str().encode_wide().chain(Some(0)).collect();
    // No MOVEFILE_REPLACE_EXISTING: Windows atomically fails on any existing
    // destination, including entries that `Path::exists` cannot observe.
    let moved = unsafe { MoveFileExW(from_wide.as_ptr(), to_wide.as_ptr(), 0) };
    if moved == 0 {
        Err(std::io::Error::last_os_error().to_string())
    } else {
        Ok(())
    }
}

#[cfg(not(windows))]
fn rename_without_replace(from: &Path, to: &Path) -> Result<(), String> {
    // Same-directory audio moves are regular files. Creating the destination
    // hard link is atomic and fails if any directory entry already exists.
    std::fs::hard_link(from, to).map_err(|error| error.to_string())?;
    if let Err(error) = std::fs::remove_file(from) {
        let _ = std::fs::remove_file(to);
        return Err(error.to_string());
    }
    Ok(())
}

/// Test seam for the rename choreography.  Hooks are intentionally narrow:
/// they can fail deterministically without touching a real VirtualDJ folder,
/// while the journal and rollback state machine remains the production one.
pub(crate) fn rename_file_core_with_hooks<R, P>(
    store: &MutationJournalStore,
    request: RenameFileRequest,
    mut rename: R,
    mut patch: P,
) -> RenameFileResult
where
    R: FnMut(&Path, &Path) -> Result<(), String>,
    P: FnMut(&Path, &str, &str) -> Result<(), String>,
{
    let original = request.original_file_path.clone();
    let _mutation_guard = match store.begin_critical_mutation(&request.vdj_folder) {
        Ok(guard) => guard,
        Err(error) => {
            return RenameFileResult::new(
                RenameFileStatus::JournalFailure,
                original,
                String::new(),
                None,
                None,
                Some(format!("No se pudo adquirir el lease de mutación: {error}")),
            );
        }
    };
    let preflight = match rename_preflight(&request) {
        Ok(paths) => paths,
        Err((status, path, message)) => {
            return RenameFileResult::new(status, original, path, None, None, Some(message));
        }
    };
    let (old_path, new_path, database_path) = preflight;
    let old_path_string = old_path.to_string_lossy().to_string();
    let new_path_string = new_path.to_string_lossy().to_string();

    let item = match MutationJournalItem::new(&old_path_string, Some(&new_path_string))
        .with_source_identity()
    {
        Ok(item) => item,
        Err(error) => {
            return RenameFileResult::new(
                RenameFileStatus::FailedValidation,
                original,
                new_path_string,
                None,
                None,
                Some(error),
            );
        }
    };
    let operation = match store.plan_operation(
        &request.vdj_folder,
        MutationOperationKind::Rename,
        vec![item],
    ) {
        Ok(operation) => operation,
        Err(error) => {
            return RenameFileResult::new(
                RenameFileStatus::JournalFailure,
                original,
                new_path_string,
                None,
                None,
                Some(format!("No se pudo persistir la fase planned: {error}")),
            );
        }
    };
    let journal_id = operation.journal_id.clone();
    let item_id = operation.items[0].item_id.clone();

    // Re-check the target after the journal commit.  A concurrent creator
    // must never be overwritten just because preflight was initially clean.
    if new_path.exists() {
        return close_planned_as_rollback(
            store,
            &request.vdj_folder,
            &journal_id,
            &item_id,
            &original,
            &new_path_string,
            RenameFileStatus::TargetConflict,
            "El destino apareció mientras se preparaba el rename".to_string(),
        );
    }

    if let Err(error) = rename(&old_path, &new_path) {
        let status = match std::fs::symlink_metadata(&new_path) {
            Ok(_) => RenameFileStatus::TargetConflict,
            Err(metadata_error) if metadata_error.kind() == std::io::ErrorKind::NotFound => {
                RenameFileStatus::RolledBack
            }
            // An unreadable directory entry is not safe to treat as absent.
            Err(_) => RenameFileStatus::TargetConflict,
        };
        return match store.transition_item(
            &request.vdj_folder,
            &journal_id,
            &item_id,
            MutationJournalPhase::RolledBack,
        ) {
            Ok(operation) => RenameFileResult::new(
                status,
                original,
                new_path_string,
                Some(journal_id),
                Some(operation.phase),
                Some(format!("No se pudo renombrar físicamente: {error}")),
            ),
            Err(journal_error) => RenameFileResult::new(
                RenameFileStatus::JournalFailure,
                original,
                new_path_string,
                Some(journal_id),
                Some(MutationJournalPhase::Planned),
                Some(format!(
                    "Falló el rename físico ({error}) y también el cierre del journal: {journal_error}"
                )),
            ),
        };
    }

    // From this point on the filesystem has changed.  If the journal cannot
    // record FsApplied, restore the source before returning a manual-review
    // result so the pending journal cannot hide a physical mismatch.
    if let Err(journal_error) = store.transition_item(
        &request.vdj_folder,
        &journal_id,
        &item_id,
        MutationJournalPhase::FsApplied,
    ) {
        let rollback_error = rename(&new_path, &old_path).err();
        let message = format!(
            "No se pudo persistir FsApplied: {journal_error}; rollback: {}",
            rollback_error
                .as_deref()
                .unwrap_or("completado")
        );
        let (phase, message) = persist_manual_review_or_report_actual(
            store,
            &request.vdj_folder,
            &journal_id,
            &item_id,
            MutationJournalPhase::Planned,
            message,
        );
        return RenameFileResult::new(
            RenameFileStatus::ManualReviewRequired,
            original,
            new_path_string,
            Some(journal_id),
            Some(phase),
            Some(message),
        );
    }

    if let Err(patch_error) = patch(&database_path, &old_path_string, &new_path_string) {
        return rollback_after_database_failure(
            store,
            &request.vdj_folder,
            &journal_id,
            &item_id,
            &old_path,
            &new_path,
            &original,
            &new_path_string,
            patch_error,
            &mut rename,
        );
    }

    match store.transition_item(
        &request.vdj_folder,
        &journal_id,
        &item_id,
        MutationJournalPhase::Completed,
    ) {
        Ok(operation) => RenameFileResult::new(
            RenameFileStatus::Completed,
            original,
            new_path_string,
            Some(journal_id),
            Some(operation.phase),
            None,
        ),
        Err(error) => {
            let (phase, message) = persist_manual_review_or_report_actual(
                store,
                &request.vdj_folder,
                &journal_id,
                &item_id,
                MutationJournalPhase::FsApplied,
                format!(
                    "filesystem y database están aplicados, pero no se pudo cerrar el journal: {error}"
                ),
            );
            RenameFileResult::new(
                RenameFileStatus::ManualReviewRequired,
                original,
                new_path_string,
                Some(journal_id),
                Some(phase),
                Some(message),
            )
        }
    }
}

fn rename_preflight(
    request: &RenameFileRequest,
) -> Result<(PathBuf, PathBuf, PathBuf), (RenameFileStatus, String, String)> {
    if request.vdj_folder.trim().is_empty() {
        return Err((
            RenameFileStatus::FailedValidation,
            String::new(),
            "vdjFolder es obligatorio".to_string(),
        ));
    }
    if request.original_file_path.trim().is_empty() {
        return Err((
            RenameFileStatus::FailedValidation,
            String::new(),
            "originalFilePath es obligatorio".to_string(),
        ));
    }
    if let Err(message) = validate_windows_file_name(&request.new_file_name) {
        return Err((
            RenameFileStatus::FailedValidation,
            String::new(),
            message,
        ));
    }

    let old_path = PathBuf::from(&request.original_file_path);
    let vdj_folder = PathBuf::from(&request.vdj_folder);
    if !old_path.is_absolute() || !vdj_folder.is_absolute() {
        return Err((
            RenameFileStatus::FailedValidation,
            String::new(),
            "vdjFolder y originalFilePath deben ser rutas absolutas".to_string(),
        ));
    }

    let metadata = match std::fs::metadata(&old_path) {
        Ok(metadata) if metadata.is_file() => metadata,
        Ok(_) => {
            return Err((
                RenameFileStatus::FailedValidation,
                old_path.to_string_lossy().to_string(),
                "El origen debe ser un archivo regular".to_string(),
            ));
        }
        Err(error) => {
            return Err((
                RenameFileStatus::FailedValidation,
                old_path.to_string_lossy().to_string(),
                format!("El archivo origen no existe o no se puede leer: {error}"),
            ));
        }
    };
    let _ = metadata;

    let Some(parent) = old_path.parent() else {
        return Err((
            RenameFileStatus::FailedValidation,
            old_path.to_string_lossy().to_string(),
            "No se pudo obtener el directorio padre del origen".to_string(),
        ));
    };
    let new_path = parent.join(&request.new_file_name);
    let parent_string = parent.to_string_lossy();
    let target_parent_string = new_path
        .parent()
        .map(|path| path.to_string_lossy().into_owned())
        .unwrap_or_default();
    if !parser::windows_paths_equal(&parent_string, &target_parent_string) {
        return Err((
            RenameFileStatus::FailedValidation,
            new_path.to_string_lossy().to_string(),
            "El rename debe conservar exactamente el mismo directorio padre".to_string(),
        ));
    }
    if parser::windows_paths_equal(
        &old_path.to_string_lossy(),
        &new_path.to_string_lossy(),
    ) {
        return Err((
            RenameFileStatus::FailedValidation,
            new_path.to_string_lossy().to_string(),
            "El nombre destino no cambia la ruta (no-op)".to_string(),
        ));
    }
    if new_path.exists() {
        return Err((
            RenameFileStatus::TargetConflict,
            new_path.to_string_lossy().to_string(),
            "Ya existe un archivo o directorio con ese nombre".to_string(),
        ));
    }

    Ok((old_path, new_path, vdj_folder.join("database.xml")))
}

fn validate_windows_file_name(name: &str) -> Result<(), String> {
    if name.is_empty() || name == "." || name == ".." {
        return Err("El nombre destino no puede estar vacío ni ser . o ..".to_string());
    }
    if name.encode_utf16().count() > 255 {
        return Err("El nombre destino supera 255 unidades UTF-16".to_string());
    }
    if name.chars().any(|character| {
        character.is_control()
            || matches!(character, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*')
    }) {
        return Err("El nombre destino contiene caracteres inválidos para Windows".to_string());
    }
    if name.ends_with('.') || name.ends_with(' ') {
        return Err("El nombre destino no puede terminar en punto ni espacio".to_string());
    }

    let stem = name.split('.').next().unwrap_or(name);
    let stem = stem.trim_end_matches(['.', ' ']);
    let uppercase = stem.to_ascii_uppercase();
    let reserved = matches!(
        uppercase.as_str(),
        "CON" | "PRN" | "AUX" | "NUL"
    ) || ["COM", "LPT"].iter().any(|prefix| {
        uppercase.strip_prefix(prefix).is_some_and(|suffix| {
            matches!(suffix, "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³")
        })
    });
    if reserved {
        return Err("El nombre destino está reservado por Windows".to_string());
    }
    Ok(())
}

fn close_planned_as_rollback(
    store: &MutationJournalStore,
    library: &str,
    journal_id: &str,
    item_id: &str,
    original: &str,
    target: &str,
    status: RenameFileStatus,
    message: String,
) -> RenameFileResult {
    match store.transition_item(library, journal_id, item_id, MutationJournalPhase::RolledBack) {
        Ok(operation) => RenameFileResult::new(
            status,
            original,
            target,
            Some(journal_id.to_string()),
            Some(operation.phase),
            Some(message),
        ),
        Err(error) => RenameFileResult::new(
            RenameFileStatus::JournalFailure,
            original,
            target,
            Some(journal_id.to_string()),
            Some(MutationJournalPhase::Planned),
            Some(format!("{message}; no se pudo cerrar el journal: {error}")),
        ),
    }
}

fn persist_manual_review_or_report_actual(
    store: &MutationJournalStore,
    library: &str,
    journal_id: &str,
    item_id: &str,
    actual_phase_on_failure: MutationJournalPhase,
    message: String,
) -> (MutationJournalPhase, String) {
    let observed_phase = store
        .load_library(library)
        .ok()
        .and_then(|document| {
            document
                .operations
                .iter()
                .find(|operation| operation.journal_id == journal_id)
                .and_then(|operation| {
                    operation
                        .items
                        .iter()
                        .find(|item| item.item_id == item_id)
                        .map(|item| item.phase)
                })
        })
        .unwrap_or(actual_phase_on_failure);
    match store.require_manual_review(library, journal_id, item_id, message.clone()) {
        Ok(operation) => (operation.phase, message),
        Err(error) => (
            observed_phase,
            format!(
                "{message}; además no se pudo persistir manual_review_required: {error}"
            ),
        ),
    }
}

fn rollback_after_database_failure<R>(
    store: &MutationJournalStore,
    library: &str,
    journal_id: &str,
    item_id: &str,
    old_path: &Path,
    new_path: &Path,
    original: &str,
    target: &str,
    patch_error: String,
    rename: &mut R,
) -> RenameFileResult
where
    R: FnMut(&Path, &Path) -> Result<(), String>,
{
    match rename(new_path, old_path) {
        Ok(()) => match store.transition_item(
            library,
            journal_id,
            item_id,
            MutationJournalPhase::RolledBack,
        ) {
            Ok(operation) => RenameFileResult::new(
                RenameFileStatus::RolledBack,
                original,
                target,
                Some(journal_id.to_string()),
                Some(operation.phase),
                Some(format!("El commit de database.xml falló y el archivo fue revertido: {patch_error}")),
            ),
            Err(error) => {
                let (phase, message) = persist_manual_review_or_report_actual(
                    store,
                    library,
                    journal_id,
                    item_id,
                    MutationJournalPhase::FsApplied,
                    format!(
                        "El archivo fue revertido, pero no se pudo persistir rolled_back: {error}; causa DB: {patch_error}"
                    ),
                );
                RenameFileResult::new(
                    RenameFileStatus::ManualReviewRequired,
                    original,
                    target,
                    Some(journal_id.to_string()),
                    Some(phase),
                    Some(message),
                )
            }
        },
        Err(rollback_error) => {
            let message = format!(
                "Falló el commit de database.xml ({patch_error}) y también el rollback físico: {rollback_error}"
            );
            let (phase, message) = persist_manual_review_or_report_actual(
                store,
                library,
                journal_id,
                item_id,
                MutationJournalPhase::FsApplied,
                message,
            );
            RenameFileResult::new(
                RenameFileStatus::ManualReviewRequired,
                original,
                target,
                Some(journal_id.to_string()),
                Some(phase),
                Some(message),
            )
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveBatchRequest {
    pub vdj_folder: String,
    pub original_file_paths: Vec<String>,
    pub target_folder: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MoveItemStatus {
    Ready,
    FailedValidation,
    TargetConflict,
    FsMoved,
    DbCommitted,
    RolledBack,
    ManualReviewRequired,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MoveTransferMethod {
    Rename,
    CopyDelete,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveItemResult {
    pub original_file_path: String,
    pub target_file_path: String,
    pub status: MoveItemStatus,
    pub message: Option<String>,
    pub journal_id: Option<String>,
    pub transfer_method: Option<MoveTransferMethod>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveBatchSummary {
    pub total: usize,
    pub ready: usize,
    pub completed: usize,
    pub blocked: usize,
    pub manual_review: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveBatchReport {
    pub summary: MoveBatchSummary,
    pub items: Vec<MoveItemResult>,
}

#[derive(Debug, Clone)]
struct PlannedMoveItem {
    result: MoveItemResult,
    source_path: Option<PathBuf>,
    target_path: Option<PathBuf>,
}

fn filesystem_entry_exists(path: &Path) -> bool {
    match std::fs::symlink_metadata(path) {
        Ok(_) => true,
        Err(error) => error.kind() != std::io::ErrorKind::NotFound,
    }
}

fn validate_regular_file(path: &Path) -> Result<(), String> {
    if !path.is_absolute() {
        return Err("La ruta origen debe ser absoluta".to_string());
    }
    let metadata = std::fs::symlink_metadata(path)
        .map_err(|error| format!("No se pudo validar el archivo origen: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.file_type().is_file() {
        return Err("El origen debe ser un archivo regular, no un enlace o directorio".to_string());
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        use windows_sys::Win32::Storage::FileSystem::FILE_ATTRIBUTE_REPARSE_POINT;
        if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
            return Err("El origen es un reparse point y requiere revisión manual".to_string());
        }
    }
    Ok(())
}

fn validate_target_directory(path: &Path) -> Result<(), String> {
    if !path.is_absolute() {
        return Err("La carpeta destino debe ser absoluta".to_string());
    }
    let metadata = std::fs::symlink_metadata(path)
        .map_err(|error| format!("No se pudo validar la carpeta destino: {error}"))?;
    if metadata.file_type().is_symlink() || !metadata.file_type().is_dir() {
        return Err("El destino debe ser un directorio existente y no puede ser un enlace".to_string());
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        use windows_sys::Win32::Storage::FileSystem::FILE_ATTRIBUTE_REPARSE_POINT;
        if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
            return Err("La carpeta destino es un reparse point y requiere revisión manual".to_string());
        }
    }
    Ok(())
}

fn build_move_plan(request: &MoveBatchRequest) -> Result<Vec<PlannedMoveItem>, String> {
    let library_path = PathBuf::from(&request.vdj_folder);
    let database_path = library_path.join("database.xml");
    let database = parser::parse_database(&database_path)?;
    let target_folder = PathBuf::from(&request.target_folder);
    let target_error = if !library_path.is_absolute() {
        Some("vdjFolder debe ser una ruta absoluta".to_string())
    } else {
        validate_target_directory(&target_folder).err()
    };
    let mut seen = HashSet::new();
    let mut planned = Vec::new();

    for original_file_path in &request.original_file_paths {
        let key = path_key(original_file_path);
        if !seen.insert(key) {
            continue;
        }
        let blocked = |message: String| PlannedMoveItem {
            result: MoveItemResult {
                original_file_path: original_file_path.clone(),
                target_file_path: String::new(),
                status: MoveItemStatus::FailedValidation,
                message: Some(message),
                journal_id: None,
                transfer_method: None,
            },
            source_path: None,
            target_path: None,
        };
        if original_file_path.trim().is_empty() {
            planned.push(blocked("originalFilePath es obligatorio".to_string()));
            continue;
        }
        if let Some(message) = &target_error {
            planned.push(blocked(message.clone()));
            continue;
        }

        let matches: Vec<&Song> = database
            .songs
            .iter()
            .filter(|song| parser::windows_paths_equal(&song.file_path, original_file_path))
            .collect();
        if matches.len() != 1 {
            planned.push(blocked(if matches.is_empty() {
                "No se encontró la entrada por originalFilePath".to_string()
            } else {
                "originalFilePath coincide con varias entradas".to_string()
            }));
            continue;
        }

        let source_path = PathBuf::from(&matches[0].file_path);
        if let Err(message) = validate_regular_file(&source_path) {
            planned.push(blocked(message));
            continue;
        }
        let Some(file_name) = source_path.file_name() else {
            planned.push(blocked("El origen no tiene nombre de archivo".to_string()));
            continue;
        };
        let target_path = target_folder.join(file_name);
        if parser::windows_paths_equal(
            &source_path.to_string_lossy(),
            &target_path.to_string_lossy(),
        ) {
            planned.push(blocked("El movimiento sería un no-op".to_string()));
            continue;
        }
        let target_file_path = target_path.to_string_lossy().to_string();
        let target_conflict = filesystem_entry_exists(&target_path);
        planned.push(PlannedMoveItem {
            result: MoveItemResult {
                original_file_path: original_file_path.clone(),
                target_file_path,
                status: if target_conflict {
                    MoveItemStatus::TargetConflict
                } else {
                    MoveItemStatus::Ready
                },
                message: target_conflict.then(|| "Ya existe una entrada en el destino".to_string()),
                journal_id: None,
                transfer_method: None,
            },
            source_path: Some(source_path),
            target_path: Some(target_path),
        });
    }

    let mut target_counts: HashMap<String, usize> = HashMap::new();
    for item in planned.iter().filter(|item| item.result.status == MoveItemStatus::Ready) {
        *target_counts.entry(path_key(&item.result.target_file_path)).or_default() += 1;
    }
    for item in &mut planned {
        if item.result.status == MoveItemStatus::Ready
            && target_counts
                .get(&path_key(&item.result.target_file_path))
                .copied()
                .unwrap_or_default()
                > 1
        {
            item.result.status = MoveItemStatus::TargetConflict;
            item.result.message = Some("Varios ítems del lote comparten el mismo destino".to_string());
        }
    }
    Ok(planned)
}

fn summarize_move_items(items: &[MoveItemResult]) -> MoveBatchSummary {
    MoveBatchSummary {
        total: items.len(),
        ready: items.iter().filter(|item| item.status == MoveItemStatus::Ready).count(),
        completed: items
            .iter()
            .filter(|item| item.status == MoveItemStatus::DbCommitted)
            .count(),
        blocked: items
            .iter()
            .filter(|item| {
                matches!(
                    item.status,
                    MoveItemStatus::FailedValidation
                        | MoveItemStatus::TargetConflict
                        | MoveItemStatus::RolledBack
                )
            })
            .count(),
        manual_review: items
            .iter()
            .filter(|item| item.status == MoveItemStatus::ManualReviewRequired)
            .count(),
    }
}

fn public_move_report(planned: &[PlannedMoveItem]) -> MoveBatchReport {
    let items: Vec<MoveItemResult> = planned.iter().map(|item| item.result.clone()).collect();
    MoveBatchReport {
        summary: summarize_move_items(&items),
        items,
    }
}

fn close_unapplied_move_item(
    store: &MutationJournalStore,
    library: &str,
    journal_id: &str,
    item_id: &str,
    result: &mut MoveItemResult,
    status: MoveItemStatus,
    message: String,
) {
    match store.transition_item(
        library,
        journal_id,
        item_id,
        MutationJournalPhase::RolledBack,
    ) {
        Ok(_) => {
            result.status = status;
            result.message = Some(message);
        }
        Err(error) => {
            let (phase, message) = persist_manual_review_or_report_actual(
                store,
                library,
                journal_id,
                item_id,
                MutationJournalPhase::Planned,
                format!("{message}; no se pudo cerrar rolled_back: {error}"),
            );
            result.status = MoveItemStatus::ManualReviewRequired;
            result.message = Some(format!("fase journal={phase:?}: {message}"));
        }
    }
}

#[tauri::command]
pub async fn plan_move_files(request: MoveBatchRequest) -> Result<MoveBatchReport, String> {
    build_move_plan(&request).map(|planned| public_move_report(&planned))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum MoveTransferFailureKind {
    TargetConflict,
    CleanFailure,
    Uncertain,
}

#[derive(Debug, Clone)]
struct MoveTransferFailure {
    kind: MoveTransferFailureKind,
    message: String,
}

impl std::fmt::Display for MoveTransferFailure {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.message)
    }
}

impl MoveTransferFailure {
    fn clean(message: impl Into<String>) -> Self {
        Self { kind: MoveTransferFailureKind::CleanFailure, message: message.into() }
    }

    fn conflict(message: impl Into<String>) -> Self {
        Self { kind: MoveTransferFailureKind::TargetConflict, message: message.into() }
    }

    fn uncertain(message: impl Into<String>) -> Self {
        Self { kind: MoveTransferFailureKind::Uncertain, message: message.into() }
    }
}

fn cleanup_copy_failure(to: &Path, message: String) -> MoveTransferFailure {
    match std::fs::remove_file(to) {
        Ok(()) => MoveTransferFailure::clean(message),
        Err(cleanup_error) => MoveTransferFailure::uncertain(format!(
            "{message}; además no se pudo limpiar la copia: {cleanup_error}"
        )),
    }
}

fn copy_delete_no_replace(from: &Path, to: &Path) -> Result<(), MoveTransferFailure> {
    use std::io::Write;
    let mut source = std::fs::File::open(from)
        .map_err(|error| MoveTransferFailure::clean(error.to_string()))?;
    let mut target = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(to)
        .map_err(|error| {
            if filesystem_entry_exists(to) {
                MoveTransferFailure::conflict(error.to_string())
            } else {
                MoveTransferFailure::clean(error.to_string())
            }
        })?;
    let copy_result = std::io::copy(&mut source, &mut target)
        .and_then(|_| target.flush())
        .and_then(|_| target.sync_all());
    if let Err(error) = copy_result {
        drop(target);
        return Err(cleanup_copy_failure(to, error.to_string()));
    }
    let source_len = match source.metadata() {
        Ok(metadata) => metadata.len(),
        Err(error) => {
            drop(target);
            return Err(cleanup_copy_failure(
                to,
                format!("No se pudo validar el origen copiado: {error}"),
            ));
        }
    };
    let target_len = match target.metadata() {
        Ok(metadata) => metadata.len(),
        Err(error) => {
            drop(target);
            return Err(cleanup_copy_failure(
                to,
                format!("No se pudo validar la copia: {error}"),
            ));
        }
    };
    drop(target);
    if source_len != target_len {
        return Err(cleanup_copy_failure(
            to,
            "La copia no conserva el tamaño del archivo".to_string(),
        ));
    }
    if let Err(error) = std::fs::remove_file(from) {
        return Err(cleanup_copy_failure(
            to,
            format!("No se pudo remover el origen después de copiar: {error}"),
        ));
    }
    Ok(())
}

fn transfer_file_no_replace(
    from: &Path,
    to: &Path,
) -> Result<MoveTransferMethod, MoveTransferFailure> {
    let target_parent = to
        .parent()
        .ok_or_else(|| MoveTransferFailure::clean("El destino no tiene directorio padre"))?;
    validate_target_directory(target_parent).map_err(MoveTransferFailure::clean)?;
    match rename_without_replace(from, to) {
        Ok(()) => Ok(MoveTransferMethod::Rename),
        Err(rename_error) => {
            if filesystem_entry_exists(to) {
                return Err(MoveTransferFailure::conflict(format!(
                    "El destino apareció durante el movimiento: {rename_error}"
                )));
            }
            copy_delete_no_replace(from, to)
                .map(|()| MoveTransferMethod::CopyDelete)
                .map_err(|mut copy_error| {
                    copy_error.message = format!(
                        "Falló rename ({rename_error}) y fallback copy-delete ({})",
                        copy_error.message
                    );
                    copy_error
                })
        }
    }
}

pub(crate) fn recovery_transfer_file(
    operation: MutationOperationKind,
    from: &Path,
    to: &Path,
) -> Result<(), String> {
    validate_regular_file(from)?;
    let parent = to
        .parent()
        .ok_or_else(|| "El destino de recovery no tiene directorio padre".to_string())?;
    validate_target_directory(parent)?;
    if filesystem_entry_exists(to) {
        return Err("El destino de recovery ya existe".to_string());
    }
    match operation {
        MutationOperationKind::Rename => rename_without_replace(from, to),
        MutationOperationKind::Move => transfer_file_no_replace(from, to)
            .map(|_| ())
            .map_err(|error| error.message),
        MutationOperationKind::RemoveLibrary => {
            Err("Recovery físico de remove_library no está soportado".to_string())
        }
    }
}

#[tauri::command]
pub async fn move_files_op(
    app: tauri::AppHandle,
    request: MoveBatchRequest,
) -> Result<MoveBatchReport, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("No se pudo resolver app-data para el journal: {error}"))?;
    let store = MutationJournalStore::new(app_data_dir);
    execute_move_batch_with_hooks(
        &store,
        request,
        transfer_file_no_replace,
        |database_path, original, target| {
            let result = parser::patch_song_path_in_place(database_path, original, target)?;
            if result.status == RelinkFileStatus::Completed {
                Ok(())
            } else {
                Err(result
                    .message
                    .unwrap_or_else(|| format!("El patch de database.xml terminó en {:?}", result.status)))
            }
        },
    )
}

fn execute_move_batch_with_hooks<T, P>(
    store: &MutationJournalStore,
    request: MoveBatchRequest,
    mut transfer: T,
    mut patch: P,
) -> Result<MoveBatchReport, String>
where
    T: FnMut(&Path, &Path) -> Result<MoveTransferMethod, MoveTransferFailure>,
    P: FnMut(&Path, &str, &str) -> Result<(), String>,
{
    let _mutation_guard = store
        .begin_critical_mutation(&request.vdj_folder)
        .map_err(|error| format!("No se pudo adquirir el lease de mutación: {error}"))?;
    let mut planned = build_move_plan(&request)?;
    let candidate_indices: Vec<usize> = planned
        .iter()
        .enumerate()
        .filter_map(|(index, item)| (item.result.status == MoveItemStatus::Ready).then_some(index))
        .collect();
    if candidate_indices.is_empty() {
        return Ok(public_move_report(&planned));
    }
    let mut ready_indices = Vec::new();
    let mut journal_items = Vec::new();
    for index in candidate_indices {
        let source = planned[index]
                    .source_path
                    .as_ref()
                    .expect("ready item has source");
        let target = planned[index]
                        .target_path
                        .as_ref()
                        .expect("ready item has target");
        match MutationJournalItem::new(source.to_string_lossy(), Some(target.to_string_lossy()))
            .with_source_identity()
        {
            Ok(item) => {
                ready_indices.push(index);
                journal_items.push(item);
            }
            Err(error) => {
                planned[index].result.status = MoveItemStatus::FailedValidation;
                planned[index].result.message = Some(error);
            }
        }
    }
    if ready_indices.is_empty() {
        return Ok(public_move_report(&planned));
    }
    let operation = match store.plan_operation(
        &request.vdj_folder,
        MutationOperationKind::Move,
        journal_items,
    ) {
        Ok(operation) => operation,
        Err(error) => {
            for index in ready_indices {
                planned[index].result.status = MoveItemStatus::ManualReviewRequired;
                planned[index].result.message = Some(format!("No se pudo crear el journal: {error}"));
            }
            return Ok(public_move_report(&planned));
        }
    };
    let database_path = PathBuf::from(&request.vdj_folder).join("database.xml");

    for (position, index) in ready_indices.into_iter().enumerate() {
        let source = planned[index].source_path.clone().expect("ready source");
        let target = planned[index].target_path.clone().expect("ready target");
        let journal_item = &operation.items[position];
        planned[index].result.journal_id = Some(operation.journal_id.clone());

        if let Err(error) = validate_regular_file(&source) {
            close_unapplied_move_item(
                store,
                &request.vdj_folder,
                &operation.journal_id,
                &journal_item.item_id,
                &mut planned[index].result,
                MoveItemStatus::FailedValidation,
                error,
            );
            continue;
        }
        if let Err(error) = validate_target_directory(Path::new(&request.target_folder)) {
            close_unapplied_move_item(
                store,
                &request.vdj_folder,
                &operation.journal_id,
                &journal_item.item_id,
                &mut planned[index].result,
                MoveItemStatus::FailedValidation,
                format!("La carpeta destino cambió después del preflight: {error}"),
            );
            continue;
        }
        if filesystem_entry_exists(&target) {
            close_unapplied_move_item(
                store,
                &request.vdj_folder,
                &operation.journal_id,
                &journal_item.item_id,
                &mut planned[index].result,
                MoveItemStatus::TargetConflict,
                "El destino apareció después del preflight".to_string(),
            );
            continue;
        }

        let transfer_method = match transfer(&source, &target) {
            Ok(method) => method,
            Err(error) => {
                if error.kind == MoveTransferFailureKind::Uncertain {
                    let (phase, message) = persist_manual_review_or_report_actual(
                        store,
                        &request.vdj_folder,
                        &operation.journal_id,
                        &journal_item.item_id,
                        MutationJournalPhase::Planned,
                        format!("El transfer falló con estado físico incierto: {}", error.message),
                    );
                    planned[index].result.status = MoveItemStatus::ManualReviewRequired;
                    planned[index].result.message = Some(format!("fase journal={phase:?}: {message}"));
                } else {
                    let status = if error.kind == MoveTransferFailureKind::TargetConflict {
                        MoveItemStatus::TargetConflict
                    } else {
                        MoveItemStatus::RolledBack
                    };
                    close_unapplied_move_item(
                        store,
                        &request.vdj_folder,
                        &operation.journal_id,
                        &journal_item.item_id,
                        &mut planned[index].result,
                        status,
                        error.message,
                    );
                }
                continue;
            }
        };
        planned[index].result.status = MoveItemStatus::FsMoved;
        planned[index].result.transfer_method = Some(transfer_method);

        if let Err(error) = store.transition_item(
            &request.vdj_folder,
            &operation.journal_id,
            &journal_item.item_id,
            MutationJournalPhase::FsApplied,
        ) {
            let rollback = transfer(&target, &source);
            match rollback {
                Ok(_) => close_unapplied_move_item(
                    store,
                    &request.vdj_folder,
                    &operation.journal_id,
                    &journal_item.item_id,
                    &mut planned[index].result,
                    MoveItemStatus::RolledBack,
                    format!("No se pudo persistir fs_applied ({error}); archivo revertido"),
                ),
                Err(rollback_error) => {
                    let (phase, message) = persist_manual_review_or_report_actual(
                        store,
                        &request.vdj_folder,
                        &operation.journal_id,
                        &journal_item.item_id,
                        MutationJournalPhase::Planned,
                        format!(
                            "No se pudo persistir fs_applied ({error}) ni revertir el archivo ({rollback_error})"
                        ),
                    );
                    planned[index].result.status = MoveItemStatus::ManualReviewRequired;
                    planned[index].result.message =
                        Some(format!("fase journal={phase:?}: {message}"));
                }
            }
            continue;
        }

        if let Err(error) = patch(
            &database_path,
            &source.to_string_lossy(),
            &target.to_string_lossy(),
        ) {
            match transfer(&target, &source) {
                Ok(_) => match store.transition_item(
                    &request.vdj_folder,
                    &operation.journal_id,
                    &journal_item.item_id,
                    MutationJournalPhase::RolledBack,
                ) {
                    Ok(_) => {
                        planned[index].result.status = MoveItemStatus::RolledBack;
                        planned[index].result.message = Some(format!(
                            "Falló database.xml y el archivo fue revertido: {error}"
                        ));
                    }
                    Err(journal_error) => {
                        let (phase, message) = persist_manual_review_or_report_actual(
                            store,
                            &request.vdj_folder,
                            &operation.journal_id,
                            &journal_item.item_id,
                            MutationJournalPhase::FsApplied,
                            format!(
                                "Archivo revertido, pero falló rolled_back ({journal_error}); DB={error}"
                            ),
                        );
                        planned[index].result.status = MoveItemStatus::ManualReviewRequired;
                        planned[index].result.message = Some(format!("fase journal={phase:?}: {message}"));
                    }
                },
                Err(rollback_error) => {
                    let (phase, message) = persist_manual_review_or_report_actual(
                        store,
                        &request.vdj_folder,
                        &operation.journal_id,
                        &journal_item.item_id,
                        MutationJournalPhase::FsApplied,
                        format!("Falló DB ({error}) y rollback físico ({rollback_error})"),
                    );
                    planned[index].result.status = MoveItemStatus::ManualReviewRequired;
                    planned[index].result.message = Some(format!("fase journal={phase:?}: {message}"));
                }
            }
            continue;
        }

        match store.transition_item(
            &request.vdj_folder,
            &operation.journal_id,
            &journal_item.item_id,
            MutationJournalPhase::Completed,
        ) {
            Ok(_) => {
                planned[index].result.status = MoveItemStatus::DbCommitted;
                planned[index].result.message = None;
            }
            Err(error) => {
                let (phase, message) = persist_manual_review_or_report_actual(
                    store,
                    &request.vdj_folder,
                    &operation.journal_id,
                    &journal_item.item_id,
                    MutationJournalPhase::FsApplied,
                    format!("Filesystem y DB aplicados; no se pudo cerrar completed: {error}"),
                );
                planned[index].result.status = MoveItemStatus::ManualReviewRequired;
                planned[index].result.message = Some(format!("fase journal={phase:?}: {message}"));
            }
        }
    }
    Ok(public_move_report(&planned))
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
    app: tauri::AppHandle,
    vdj_folder: String,
    original_file_path: String,
    new_file_path: String,
) -> Result<RelinkFileResult, String> {
    let _mutation_guard = super::recovery::acquire_mutation_guard(&app, &vdj_folder)?;
    relocate_file_core(vdj_folder, original_file_path, new_file_path).await
}

async fn relocate_file_core(
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

        let result = relocate_file_core(
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

    fn rename_fixture(label: &str) -> (PathBuf, PathBuf, PathBuf, PathBuf) {
        let root = unique_temp_dir(label);
        let vdj_folder = root.join("VirtualDJ");
        let app_data = root.join("app-data");
        std::fs::create_dir_all(&vdj_folder).expect("VDJ folder should be created");
        std::fs::create_dir_all(&app_data).expect("app-data folder should be created");
        let source = root.join("Track.mp3");
        std::fs::write(&source, b"track").expect("source should be written");
        let database = vdj_folder.join("database.xml");
        let xml = format!(
            r#"<VirtualDJ_Database><Song FilePath="{}" FileSize="5"/></VirtualDJ_Database>"#,
            source.to_string_lossy()
        );
        std::fs::write(&database, xml).expect("database fixture should be written");
        (root, vdj_folder, app_data, source)
    }

    fn rename_request(vdj_folder: &Path, source: &Path, name: &str) -> RenameFileRequest {
        RenameFileRequest {
            vdj_folder: vdj_folder.to_string_lossy().to_string(),
            original_file_path: source.to_string_lossy().to_string(),
            new_file_name: name.to_string(),
        }
    }

    fn move_fixture(
        label: &str,
        file_names: &[&str],
    ) -> (PathBuf, PathBuf, PathBuf, PathBuf, Vec<PathBuf>) {
        let root = unique_temp_dir(label);
        let vdj_folder = root.join("VirtualDJ");
        let app_data = root.join("app-data");
        let music = root.join("music");
        let target = root.join("target");
        std::fs::create_dir_all(&vdj_folder).expect("vdj fixture should exist");
        std::fs::create_dir_all(&music).expect("music fixture should exist");
        std::fs::create_dir_all(&target).expect("target fixture should exist");
        let mut files = Vec::new();
        let mut songs = String::new();
        for file_name in file_names {
            let path = music.join(file_name);
            std::fs::write(&path, format!("audio-{file_name}")).expect("audio fixture should write");
            let xml_path = path.to_string_lossy().replace('&', "&amp;");
            songs.push_str(&format!(r#"<Song FilePath="{xml_path}"/>"#));
            files.push(path);
        }
        std::fs::write(
            vdj_folder.join("database.xml"),
            format!(r#"<VirtualDJ_Database>{songs}</VirtualDJ_Database>"#),
        )
        .expect("database fixture should write");
        (root, vdj_folder, app_data, target, files)
    }

    fn move_request(vdj_folder: &Path, target: &Path, files: &[PathBuf]) -> MoveBatchRequest {
        MoveBatchRequest {
            vdj_folder: vdj_folder.to_string_lossy().to_string(),
            original_file_paths: files
                .iter()
                .map(|path| path.to_string_lossy().to_string())
                .collect(),
            target_folder: target.to_string_lossy().to_string(),
        }
    }

    #[test]
    fn move_planner_reports_ready_missing_and_target_conflict_before_execution() {
        let (root, vdj_folder, _app_data, target, files) =
            move_fixture("move-plan-mixed", &["Ready.mp3", "Conflict.mp3"]);
        let missing = root.join("music").join("Missing.mp3");
        let db_path = vdj_folder.join("database.xml");
        let xml = std::fs::read_to_string(&db_path).expect("database should read");
        std::fs::write(
            &db_path,
            xml.replace(
                "</VirtualDJ_Database>",
                &format!(
                    r#"<Song FilePath="{}"/></VirtualDJ_Database>"#,
                    missing.to_string_lossy()
                ),
            ),
        )
        .expect("missing database entry should write");
        std::fs::write(target.join("Conflict.mp3"), b"existing")
            .expect("conflict fixture should write");
        let mut requested = files.clone();
        requested.push(missing);

        let report = public_move_report(
            &build_move_plan(&move_request(&vdj_folder, &target, &requested))
                .expect("planner should return per-item results"),
        );

        assert_eq!(report.summary.total, 3);
        assert_eq!(report.summary.ready, 1);
        assert_eq!(report.summary.blocked, 2);
        assert_eq!(report.items[0].status, MoveItemStatus::Ready);
        assert_eq!(report.items[1].status, MoveItemStatus::TargetConflict);
        assert_eq!(report.items[2].status, MoveItemStatus::FailedValidation);
        assert!(files.iter().all(|path| path.exists()));
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn move_executor_commits_only_ready_items_from_a_mixed_batch() {
        let (root, vdj_folder, app_data, target, files) =
            move_fixture("move-execute-mixed", &["Ready.mp3", "Conflict.mp3"]);
        std::fs::write(target.join("Conflict.mp3"), b"existing")
            .expect("conflict fixture should write");
        let store = MutationJournalStore::new(&app_data);

        let report = execute_move_batch_with_hooks(
            &store,
            move_request(&vdj_folder, &target, &files),
            transfer_file_no_replace,
            |database, original, destination| {
                let result = parser::patch_song_path_in_place(database, original, destination)?;
                (result.status == RelinkFileStatus::Completed)
                    .then_some(())
                    .ok_or_else(|| format!("patch status={:?}", result.status))
            },
        )
        .expect("mixed batch should return a report");

        assert_eq!(report.items[0].status, MoveItemStatus::DbCommitted);
        assert_eq!(report.items[1].status, MoveItemStatus::TargetConflict);
        assert!(!files[0].exists());
        assert!(target.join("Ready.mp3").is_file());
        assert!(files[1].is_file());
        let database = parser::parse_database(&vdj_folder.join("database.xml"))
            .expect("database should remain readable");
        assert!(database.songs.iter().any(|song| {
            parser::windows_paths_equal(&song.file_path, &target.join("Ready.mp3").to_string_lossy())
        }));
        assert_eq!(store.list_pending(&vdj_folder).expect("journal should load").len(), 0);
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn move_executor_rolls_back_physical_file_when_database_patch_fails() {
        let (root, vdj_folder, app_data, target, files) =
            move_fixture("move-db-rollback", &["Track.mp3"]);
        let store = MutationJournalStore::new(&app_data);

        let report = execute_move_batch_with_hooks(
            &store,
            move_request(&vdj_folder, &target, &files),
            transfer_file_no_replace,
            |_database, _original, _destination| Err("injected DB failure".to_string()),
        )
        .expect("rollback should be a typed result");

        assert_eq!(report.items[0].status, MoveItemStatus::RolledBack);
        assert!(files[0].is_file());
        assert!(!target.join("Track.mp3").exists());
        assert_eq!(store.list_pending(&vdj_folder).expect("journal should load").len(), 0);
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn move_executor_reports_copy_delete_transfer_method() {
        let (root, vdj_folder, app_data, target, files) =
            move_fixture("move-copy-delete", &["Track.mp3"]);
        let store = MutationJournalStore::new(&app_data);

        let report = execute_move_batch_with_hooks(
            &store,
            move_request(&vdj_folder, &target, &files),
            |from, to| {
                copy_delete_no_replace(from, to)?;
                Ok(MoveTransferMethod::CopyDelete)
            },
            |database, original, destination| {
                let result = parser::patch_song_path_in_place(database, original, destination)?;
                (result.status == RelinkFileStatus::Completed)
                    .then_some(())
                    .ok_or_else(|| format!("patch status={:?}", result.status))
            },
        )
        .expect("copy-delete should be reported");

        assert_eq!(report.items[0].status, MoveItemStatus::DbCommitted);
        assert_eq!(
            report.items[0].transfer_method,
            Some(MoveTransferMethod::CopyDelete)
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn move_transfer_revalidates_target_directory_after_planning() {
        let (root, _vdj_folder, _app_data, target, files) =
            move_fixture("move-target-dir-race", &["Track.mp3"]);
        std::fs::remove_dir(&target).expect("empty target fixture should be removable");
        std::fs::write(&target, b"replacement entry").expect("replacement should write");

        let error = transfer_file_no_replace(&files[0], &target.join("Track.mp3"))
            .expect_err("replaced target directory must be rejected");

        assert_eq!(error.kind, MoveTransferFailureKind::CleanFailure);
        assert!(files[0].is_file());
        assert_eq!(
            std::fs::read(&target).expect("replacement should remain"),
            b"replacement entry"
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn move_uncertain_copy_cleanup_requires_manual_review() {
        let (root, vdj_folder, app_data, target, files) =
            move_fixture("move-copy-uncertain", &["Track.mp3"]);
        let store = MutationJournalStore::new(&app_data);

        let report = execute_move_batch_with_hooks(
            &store,
            move_request(&vdj_folder, &target, &files),
            |_from, to| {
                std::fs::write(to, b"partial copy").expect("partial target should write");
                Err(MoveTransferFailure::uncertain("simulated cleanup failure"))
            },
            |_database, _original, _destination| Ok(()),
        )
        .expect("uncertain physical state should be typed");

        assert_eq!(
            report.items[0].status,
            MoveItemStatus::ManualReviewRequired
        );
        assert!(files[0].is_file());
        assert!(target.join("Track.mp3").is_file());
        assert_eq!(store.list_pending(&vdj_folder).expect("journal should load").len(), 1);
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_happy_path_persists_database_and_completed_journal() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-happy");
        let store = MutationJournalStore::new(&app_data);

        let result = rename_file_core(
            &store,
            rename_request(&vdj_folder, &source, "Renamed.mp3"),
        );

        assert_eq!(result.status, RenameFileStatus::Completed);
        let target = root.join("Renamed.mp3");
        assert!(!source.exists(), "source should be moved");
        assert!(target.exists(), "target should exist");
        let database = parser::parse_database(&vdj_folder.join("database.xml"))
            .expect("patched database should parse");
        assert_eq!(database.songs[0].file_path, target.to_string_lossy());
        let journal = store
            .load_library(&vdj_folder)
            .expect("journal should load");
        assert_eq!(journal.operations.len(), 1);
        assert_eq!(
            journal.operations[0].items[0].phase,
            MutationJournalPhase::Completed
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_rejects_target_conflict_before_creating_journal() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-conflict");
        let target = root.join("Existing.mp3");
        std::fs::write(&target, b"existing").expect("target should be written");
        let store = MutationJournalStore::new(&app_data);

        let result = rename_file_core(
            &store,
            rename_request(&vdj_folder, &source, "Existing.mp3"),
        );

        assert_eq!(result.status, RenameFileStatus::TargetConflict);
        assert!(source.exists());
        assert!(target.exists());
        assert!(store
            .load_library(&vdj_folder)
            .expect("journal should load")
            .operations
            .is_empty());
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_primitive_never_replaces_a_destination_created_after_preflight() {
        let (root, _vdj_folder, _app_data, source) = rename_fixture("rename-race");
        let target = root.join("Raced.mp3");
        std::fs::write(&target, b"do not replace").expect("race target should be written");

        let error = rename_without_replace(&source, &target)
            .expect_err("no-replace rename must reject an existing directory entry");

        assert!(!error.is_empty());
        assert_eq!(
            std::fs::read(&target).expect("race target should remain readable"),
            b"do not replace"
        );
        assert_eq!(
            std::fs::read(&source).expect("source should remain readable"),
            b"track"
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_race_reports_target_conflict_and_preserves_both_files() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-race-result");
        let store = MutationJournalStore::new(&app_data);
        let target = root.join("Raced.mp3");

        let result = rename_file_core_with_hooks(
            &store,
            rename_request(&vdj_folder, &source, "Raced.mp3"),
            |from, to| {
                std::fs::write(to, b"concurrent target")
                    .map_err(|error| error.to_string())?;
                rename_without_replace(from, to)
            },
            |_database, _original, _target| Ok(()),
        );

        assert_eq!(result.status, RenameFileStatus::TargetConflict);
        assert_eq!(result.phase, Some(MutationJournalPhase::RolledBack));
        assert_eq!(
            std::fs::read(&target).expect("concurrent target should survive"),
            b"concurrent target"
        );
        assert_eq!(
            std::fs::read(&source).expect("source should survive"),
            b"track"
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_rejects_invalid_literal_without_touching_filesystem() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-invalid");
        let store = MutationJournalStore::new(&app_data);

        for invalid in [
            "bad/name.mp3",
            "CON.txt",
            "COM¹.txt",
            "LPT².wav",
            "trailing. ",
            "a\nname.mp3",
        ] {
            let result = rename_file_core(
                &store,
                rename_request(&vdj_folder, &source, invalid),
            );
            assert_eq!(result.status, RenameFileStatus::FailedValidation);
            assert!(source.exists());
        }
        assert!(store
            .load_library(&vdj_folder)
            .expect("journal should load")
            .operations
            .is_empty());
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_rolls_back_when_database_commit_fails() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-db-fail");
        let store = MutationJournalStore::new(&app_data);

        let result = rename_file_core_with_hooks(
            &store,
            rename_request(&vdj_folder, &source, "Renamed.mp3"),
            |from, to| std::fs::rename(from, to).map_err(|error| error.to_string()),
            |_database, _original, _target| Err("injected database failure".to_string()),
        );

        assert_eq!(result.status, RenameFileStatus::RolledBack);
        assert!(source.exists());
        assert!(!root.join("Renamed.mp3").exists());
        let journal = store
            .load_library(&vdj_folder)
            .expect("journal should load");
        assert_eq!(
            journal.operations[0].items[0].phase,
            MutationJournalPhase::RolledBack
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_persists_planned_before_invoking_filesystem_hook() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-planned");
        let store = MutationJournalStore::new(&app_data);
        let library = vdj_folder.to_string_lossy().to_string();
        let mut saw_planned = false;

        let result = rename_file_core_with_hooks(
            &store,
            rename_request(&vdj_folder, &source, "Renamed.mp3"),
            |_from, _to| {
                let journal = store.load_library(&library).expect("planned journal should load");
                assert_eq!(journal.operations.len(), 1);
                assert_eq!(
                    journal.operations[0].items[0].phase,
                    MutationJournalPhase::Planned
                );
                saw_planned = true;
                Err("injected filesystem failure".to_string())
            },
            |_database, _original, _target| Ok(()),
        );

        assert!(saw_planned);
        assert_eq!(result.status, RenameFileStatus::RolledBack);
        assert!(source.exists());
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_reports_the_persisted_phase_when_secondary_journal_marking_fails() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-phase-truth");
        let store = MutationJournalStore::new(&app_data);
        let library = vdj_folder.to_string_lossy().to_string();

        let result = rename_file_core_with_hooks(
            &store,
            rename_request(&vdj_folder, &source, "Renamed.mp3"),
            rename_without_replace,
            |_database, _original, _target| {
                let document = store.load_library(&library).expect("journal should load");
                let operation = &document.operations[0];
                store
                    .transition_item(
                        &library,
                        &operation.journal_id,
                        &operation.items[0].item_id,
                        MutationJournalPhase::RolledBack,
                    )
                    .expect("simulated conflicting journal phase should persist");
                Ok(())
            },
        );

        assert_eq!(result.status, RenameFileStatus::ManualReviewRequired);
        assert_eq!(result.phase, Some(MutationJournalPhase::RolledBack));
        assert!(result
            .message
            .as_deref()
            .is_some_and(|message| message.contains("no se pudo persistir manual_review_required")));
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn journal_failure_happens_before_filesystem_hook() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-journal-fail");
        std::fs::remove_dir_all(&app_data).expect("app-data directory should be removable");
        std::fs::write(&app_data, b"not a directory").expect("app-data blocker should be written");
        let store = MutationJournalStore::new(&app_data);
        let mut rename_called = false;

        let result = rename_file_core_with_hooks(
            &store,
            rename_request(&vdj_folder, &source, "Renamed.mp3"),
            |_from, _to| {
                rename_called = true;
                Ok(())
            },
            |_database, _original, _target| Ok(()),
        );

        assert_eq!(result.status, RenameFileStatus::JournalFailure);
        assert!(!rename_called);
        assert!(source.exists());
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rename_reports_manual_review_when_physical_rollback_fails() {
        let (root, vdj_folder, app_data, source) = rename_fixture("rename-rollback-fail");
        let store = MutationJournalStore::new(&app_data);
        let mut calls = 0usize;

        let result = rename_file_core_with_hooks(
            &store,
            rename_request(&vdj_folder, &source, "Renamed.mp3"),
            |from, to| {
                calls += 1;
                if calls == 2 {
                    return Err("injected rollback failure".to_string());
                }
                std::fs::rename(from, to).map_err(|error| error.to_string())
            },
            |_database, _original, _target| Err("injected database failure".to_string()),
        );

        assert_eq!(result.status, RenameFileStatus::ManualReviewRequired);
        assert!(!source.exists());
        assert!(root.join("Renamed.mp3").exists());
        let journal = store
            .load_library(&vdj_folder)
            .expect("journal should load");
        assert_eq!(
            journal.operations[0].items[0].phase,
            MutationJournalPhase::ManualReviewRequired
        );
        std::fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }
}
