//! User-confirmed recovery for interrupted filesystem + database mutations.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::database::models::RelinkFileStatus;
use crate::database::parser;
use crate::mutation_journal::{
    CriticalMutationGuard, MutationJournalItem, MutationJournalPhase, MutationJournalStore,
    MutationOperationKind, MutationRecoveryEntry,
    MutationRecoveryAction, MutationRecoveryState, MutationRecoveryStatus,
};

use super::files::recovery_transfer_file;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyRecoveryRequest {
    pub vdj_folder: String,
    pub action: MutationRecoveryAction,
    #[serde(default)]
    pub journal_id: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RecoveryItemOutcomeStatus {
    Resolved,
    ManualReviewRequired,
    Failed,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryItemOutcome {
    pub journal_id: String,
    pub item_id: String,
    pub original_file_path: String,
    pub target_file_path: Option<String>,
    pub status: RecoveryItemOutcomeStatus,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyRecoveryResult {
    pub state: MutationRecoveryState,
    pub outcomes: Vec<RecoveryItemOutcome>,
}

fn selected_recovery_entries(
    state: &MutationRecoveryState,
    action: MutationRecoveryAction,
    journal_id: Option<&str>,
) -> Result<Vec<MutationRecoveryEntry>, String> {
    if let Some(journal_id) = journal_id {
        let entry = state
            .entries
            .iter()
            .find(|entry| entry.journal.journal_id == journal_id)
            .ok_or_else(|| format!("No existe el journal solicitado: {journal_id}"))?;
        if !entry.allowed_actions.contains(&action) {
            return Err(format!(
                "La acción {:?} no está permitida para el journal {}",
                action, journal_id
            ));
        }
        return Ok(vec![entry.clone()]);
    }
    if !state.allowed_actions.contains(&action) {
        return Err(format!(
            "La acción {:?} no está permitida para todos los journals pendientes",
            action
        ));
    }
    Ok(state.entries.clone())
}

fn store_for_app(app: &tauri::AppHandle) -> Result<MutationJournalStore, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("No se pudo resolver app-data para recovery: {error}"))?;
    Ok(MutationJournalStore::new(app_data_dir))
}

pub fn acquire_mutation_guard(
    app: &tauri::AppHandle,
    vdj_folder: &str,
) -> Result<CriticalMutationGuard, String> {
    store_for_app(app)?
        .begin_critical_mutation(vdj_folder)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_mutation_recovery_state(
    app: tauri::AppHandle,
    vdj_folder: String,
) -> Result<MutationRecoveryState, String> {
    store_for_app(&app)?
        .recovery_state(vdj_folder)
        .map_err(|error| error.to_string())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PhysicalEntry {
    Missing,
    RegularFile,
    Unsafe,
}

fn physical_entry(path: &Path) -> PhysicalEntry {
    match std::fs::symlink_metadata(path) {
        Ok(metadata) if metadata.file_type().is_file() && !metadata.file_type().is_symlink() => {
            #[cfg(windows)]
            {
                use std::os::windows::fs::MetadataExt;
                use windows_sys::Win32::Storage::FileSystem::FILE_ATTRIBUTE_REPARSE_POINT;
                if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
                    return PhysicalEntry::Unsafe;
                }
            }
            PhysicalEntry::RegularFile
        }
        Ok(_) => PhysicalEntry::Unsafe,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => PhysicalEntry::Missing,
        Err(_) => PhysicalEntry::Unsafe,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DatabaseReferenceState {
    SourceOnly,
    TargetOnly,
    Neither,
    Ambiguous,
}

fn database_reference_state(
    database_path: &Path,
    source: &str,
    target: &str,
) -> Result<DatabaseReferenceState, String> {
    let database = parser::parse_database(database_path)?;
    let source_count = database
        .songs
        .iter()
        .filter(|song| parser::windows_paths_equal(&song.file_path, source))
        .count();
    let target_count = database
        .songs
        .iter()
        .filter(|song| parser::windows_paths_equal(&song.file_path, target))
        .count();
    Ok(match (source_count, target_count) {
        (1, 0) => DatabaseReferenceState::SourceOnly,
        (0, 1) => DatabaseReferenceState::TargetOnly,
        (0, 0) => DatabaseReferenceState::Neither,
        _ => DatabaseReferenceState::Ambiguous,
    })
}

fn patch_reference(database_path: &Path, from: &str, to: &str) -> Result<(), String> {
    let result = parser::patch_song_path_in_place(database_path, from, to)?;
    if result.status == RelinkFileStatus::Completed {
        Ok(())
    } else {
        Err(result
            .message
            .unwrap_or_else(|| format!("El patch terminó en {:?}", result.status)))
    }
}

fn outcome(
    journal_id: &str,
    item: &MutationJournalItem,
    status: RecoveryItemOutcomeStatus,
    message: impl Into<String>,
) -> RecoveryItemOutcome {
    RecoveryItemOutcome {
        journal_id: journal_id.to_string(),
        item_id: item.item_id.clone(),
        original_file_path: item.original_file_path.clone(),
        target_file_path: item.target_file_path.clone(),
        status,
        message: message.into(),
    }
}

fn verify_journal_file_identity(
    store: &MutationJournalStore,
    library: &str,
    journal_id: &str,
    item: &MutationJournalItem,
    path: &Path,
) -> Result<(), RecoveryItemOutcome> {
    match item.matches_source_identity(path) {
        Ok(true) => Ok(()),
        Ok(false) => Err(require_manual(
            store,
            library,
            journal_id,
            item,
            "La identidad SHA-256/tamaño no coincide o el journal antiguo no conserva identidad; no se movió ningún archivo".to_string(),
        )),
        Err(error) => Err(require_manual(store, library, journal_id, item, error)),
    }
}

fn require_manual(
    store: &MutationJournalStore,
    library: &str,
    journal_id: &str,
    item: &MutationJournalItem,
    message: String,
) -> RecoveryItemOutcome {
    let persisted = store.require_manual_review(
        library,
        journal_id,
        &item.item_id,
        message.clone(),
    );
    let status = if persisted.is_ok() {
        RecoveryItemOutcomeStatus::ManualReviewRequired
    } else {
        RecoveryItemOutcomeStatus::Failed
    };
    outcome(
        journal_id,
        item,
        status,
        match persisted {
            Ok(_) => message,
            Err(error) => format!("{message}; no se pudo persistir revisión manual: {error}"),
        },
    )
}

fn resume_item(
    store: &MutationJournalStore,
    library: &str,
    database_path: &Path,
    journal_id: &str,
    operation: MutationOperationKind,
    item: &MutationJournalItem,
) -> RecoveryItemOutcome {
    let Some(target_raw) = item.target_file_path.as_deref() else {
        return require_manual(
            store,
            library,
            journal_id,
            item,
            "El journal no contiene targetFilePath".to_string(),
        );
    };
    if item.phase == MutationJournalPhase::ManualReviewRequired {
        return outcome(
            journal_id,
            item,
            RecoveryItemOutcomeStatus::Failed,
            "Este ítem requiere rollback o acknowledgement manual",
        );
    }
    let source = PathBuf::from(&item.original_file_path);
    let target = PathBuf::from(target_raw);
    match database_reference_state(database_path, &item.original_file_path, target_raw) {
        Ok(DatabaseReferenceState::SourceOnly | DatabaseReferenceState::TargetOnly) => {}
        Ok(state) => {
            return require_manual(
                store,
                library,
                journal_id,
                item,
                format!("Referencias de database.xml incompatibles con resume: {state:?}"),
            );
        }
        Err(error) => return require_manual(store, library, journal_id, item, error),
    }
    match (physical_entry(&source), physical_entry(&target)) {
        (PhysicalEntry::RegularFile, PhysicalEntry::Missing)
            if item.phase == MutationJournalPhase::Planned =>
        {
            if let Err(outcome) = verify_journal_file_identity(store, library, journal_id, item, &source) {
                return outcome;
            }
            if let Err(error) = recovery_transfer_file(operation, &source, &target) {
                return require_manual(
                    store,
                    library,
                    journal_id,
                    item,
                    format!("No se pudo reanudar el movimiento físico: {error}"),
                );
            }
            if let Err(error) = store.transition_item(
                library,
                journal_id,
                &item.item_id,
                MutationJournalPhase::FsApplied,
            ) {
                let rollback = recovery_transfer_file(operation, &target, &source);
                return require_manual(
                    store,
                    library,
                    journal_id,
                    item,
                    format!("No se pudo persistir fs_applied: {error}; rollback={rollback:?}"),
                );
            }
        }
        (PhysicalEntry::Missing, PhysicalEntry::RegularFile) => {
            if let Err(outcome) = verify_journal_file_identity(store, library, journal_id, item, &target) {
                return outcome;
            }
            if item.phase == MutationJournalPhase::Planned {
                if let Err(error) = store.transition_item(
                    library,
                    journal_id,
                    &item.item_id,
                    MutationJournalPhase::FsApplied,
                ) {
                    return require_manual(
                        store,
                        library,
                        journal_id,
                        item,
                        format!("El archivo ya estaba movido, pero no se pudo registrar: {error}"),
                    );
                }
            }
        }
        state => {
            return require_manual(
                store,
                library,
                journal_id,
                item,
                format!("Estado físico incompatible con resume: {state:?}"),
            );
        }
    }

    match database_reference_state(database_path, &item.original_file_path, target_raw) {
        Ok(DatabaseReferenceState::SourceOnly) => {
            if let Err(error) = patch_reference(database_path, &item.original_file_path, target_raw) {
                let rollback = recovery_transfer_file(operation, &target, &source);
                if rollback.is_ok() {
                    match store.transition_item(
                        library,
                        journal_id,
                        &item.item_id,
                        MutationJournalPhase::RolledBack,
                    ) {
                        Ok(_) => {
                            return outcome(
                                journal_id,
                                item,
                                RecoveryItemOutcomeStatus::Resolved,
                                format!(
                                    "Resume no pudo completar database.xml ({error}); el archivo fue revertido de forma segura"
                                ),
                            );
                        }
                        Err(journal_error) => {
                            return require_manual(
                                store,
                                library,
                                journal_id,
                                item,
                                format!(
                                    "El archivo fue revertido tras fallo DB ({error}), pero no se pudo cerrar rolled_back: {journal_error}"
                                ),
                            );
                        }
                    }
                }
                return require_manual(
                    store,
                    library,
                    journal_id,
                    item,
                    format!("No se pudo completar database.xml: {error}; rollback={rollback:?}"),
                );
            }
        }
        Ok(DatabaseReferenceState::TargetOnly) => {}
        Ok(state) => {
            return require_manual(
                store,
                library,
                journal_id,
                item,
                format!("Referencias de database.xml incompatibles con resume: {state:?}"),
            );
        }
        Err(error) => {
            return require_manual(store, library, journal_id, item, error);
        }
    }

    match store.transition_item(
        library,
        journal_id,
        &item.item_id,
        MutationJournalPhase::Completed,
    ) {
        Ok(_) => outcome(
            journal_id,
            item,
            RecoveryItemOutcomeStatus::Resolved,
            "Mutación reanudada y completada",
        ),
        Err(error) => require_manual(
            store,
            library,
            journal_id,
            item,
            format!("Filesystem y DB están aplicados, pero no se pudo cerrar completed: {error}"),
        ),
    }
}

fn rollback_item(
    store: &MutationJournalStore,
    library: &str,
    database_path: &Path,
    journal_id: &str,
    operation: MutationOperationKind,
    item: &MutationJournalItem,
) -> RecoveryItemOutcome {
    let Some(target_raw) = item.target_file_path.as_deref() else {
        return require_manual(
            store,
            library,
            journal_id,
            item,
            "El journal no contiene targetFilePath".to_string(),
        );
    };
    let source = PathBuf::from(&item.original_file_path);
    let target = PathBuf::from(target_raw);
    match database_reference_state(database_path, &item.original_file_path, target_raw) {
        Ok(DatabaseReferenceState::SourceOnly | DatabaseReferenceState::TargetOnly) => {}
        Ok(state) => {
            return require_manual(
                store,
                library,
                journal_id,
                item,
                format!("Referencias de database.xml incompatibles con rollback: {state:?}"),
            );
        }
        Err(error) => return require_manual(store, library, journal_id, item, error),
    }
    match (physical_entry(&source), physical_entry(&target)) {
        (PhysicalEntry::Missing, PhysicalEntry::RegularFile) => {
            if let Err(outcome) = verify_journal_file_identity(store, library, journal_id, item, &target) {
                return outcome;
            }
            if let Err(error) = recovery_transfer_file(operation, &target, &source) {
                return require_manual(
                    store,
                    library,
                    journal_id,
                    item,
                    format!("No se pudo revertir el archivo físico: {error}"),
                );
            }
        }
        (PhysicalEntry::RegularFile, PhysicalEntry::Missing) => {
            if let Err(outcome) = verify_journal_file_identity(store, library, journal_id, item, &source) {
                return outcome;
            }
        }
        state => {
            return require_manual(
                store,
                library,
                journal_id,
                item,
                format!("Estado físico incompatible con rollback: {state:?}"),
            );
        }
    }

    match database_reference_state(database_path, &item.original_file_path, target_raw) {
        Ok(DatabaseReferenceState::TargetOnly) => {
            if let Err(error) = patch_reference(database_path, target_raw, &item.original_file_path) {
                return require_manual(
                    store,
                    library,
                    journal_id,
                    item,
                    format!("Archivo revertido, pero database.xml no pudo revertirse: {error}"),
                );
            }
        }
        Ok(DatabaseReferenceState::SourceOnly) => {}
        Ok(state) => {
            return require_manual(
                store,
                library,
                journal_id,
                item,
                format!("Referencias de database.xml incompatibles con rollback: {state:?}"),
            );
        }
        Err(error) => return require_manual(store, library, journal_id, item, error),
    }

    match store.transition_item(
        library,
        journal_id,
        &item.item_id,
        MutationJournalPhase::RolledBack,
    ) {
        Ok(_) => outcome(
            journal_id,
            item,
            RecoveryItemOutcomeStatus::Resolved,
            "Mutación revertida",
        ),
        Err(error) => require_manual(
            store,
            library,
            journal_id,
            item,
            format!("Estado físico y DB revertidos, pero falló rolled_back: {error}"),
        ),
    }
}

#[tauri::command]
pub async fn apply_mutation_recovery_action(
    app: tauri::AppHandle,
    request: ApplyRecoveryRequest,
) -> Result<ApplyRecoveryResult, String> {
    let store = store_for_app(&app)?;
    let _mutation_guard = store
        .begin_recovery_mutation(&request.vdj_folder)
        .map_err(|error| error.to_string())?;
    let state = store
        .recovery_state(&request.vdj_folder)
        .map_err(|error| error.to_string())?;
    if state.status == MutationRecoveryStatus::Clean {
        return Ok(ApplyRecoveryResult { state, outcomes: Vec::new() });
    }
    let selected_entries = selected_recovery_entries(
        &state,
        request.action,
        request.journal_id.as_deref(),
    )?;

    let database_path = PathBuf::from(&request.vdj_folder).join("database.xml");
    let mut outcomes = Vec::new();
    for entry in selected_entries {
        for item in entry.journal.items.iter().filter(|item| item.is_pending()) {
            let item_outcome = match request.action {
                MutationRecoveryAction::Resume => resume_item(
                    &store,
                    &request.vdj_folder,
                    &database_path,
                    &entry.journal.journal_id,
                    entry.journal.operation,
                    item,
                ),
                MutationRecoveryAction::Rollback => rollback_item(
                    &store,
                    &request.vdj_folder,
                    &database_path,
                    &entry.journal.journal_id,
                    entry.journal.operation,
                    item,
                ),
                MutationRecoveryAction::ManualReviewAcknowledged => {
                    match store.acknowledge_manual_review_item(
                        &request.vdj_folder,
                        &entry.journal.journal_id,
                        &item.item_id,
                    ) {
                        Ok(_) => outcome(
                            &entry.journal.journal_id,
                            item,
                            RecoveryItemOutcomeStatus::Resolved,
                            "Revisión manual confirmada por el usuario",
                        ),
                        Err(error) => outcome(
                            &entry.journal.journal_id,
                            item,
                            RecoveryItemOutcomeStatus::Failed,
                            error.to_string(),
                        ),
                    }
                }
            };
            outcomes.push(item_outcome);
        }
    }
    let state = store
        .recovery_state(&request.vdj_folder)
        .map_err(|error| error.to_string())?;
    Ok(ApplyRecoveryResult { state, outcomes })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn fixture(label: &str, physical_at_target: bool) -> (PathBuf, PathBuf, MutationJournalStore, String, String) {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time should advance")
            .as_nanos();
        let root = std::env::temp_dir().join(format!(
            "vdj-manager-recovery-{label}-{}-{nonce}",
            std::process::id()
        ));
        let library = root.join("VirtualDJ");
        let music = root.join("music");
        let app_data = root.join("app-data");
        fs::create_dir_all(&library).expect("library fixture should exist");
        fs::create_dir_all(&music).expect("music fixture should exist");
        let source = music.join("Original.mp3");
        let target = music.join("Recovered.mp3");
        let physical = if physical_at_target { &target } else { &source };
        fs::write(physical, b"audio fixture").expect("audio fixture should write");
        let db_reference = if physical_at_target { &target } else { &source };
        fs::write(
            library.join("database.xml"),
            format!(
                r#"<VirtualDJ_Database><Song FilePath="{}"/></VirtualDJ_Database>"#,
                db_reference.to_string_lossy()
            ),
        )
        .expect("database fixture should write");
        (
            root,
            library,
            MutationJournalStore::new(app_data),
            source.to_string_lossy().to_string(),
            target.to_string_lossy().to_string(),
        )
    }

    fn planned_operation(
        store: &MutationJournalStore,
        library: &Path,
        source: &str,
        target: &str,
    ) -> crate::mutation_journal::MutationJournalOperation {
        let identity_path = if Path::new(source).is_file() { source } else { target };
        store
            .plan_operation(
                library,
                MutationOperationKind::Rename,
                vec![MutationJournalItem::new(source, Some(target))
                    .with_source_identity_from(Path::new(identity_path))
                    .expect("fixture identity should be captured")],
            )
            .expect("planned recovery fixture should persist")
    }

    #[test]
    fn resume_planned_item_applies_filesystem_database_and_journal() {
        let (root, library, store, source, target) = fixture("resume-planned", false);
        let operation = planned_operation(&store, &library, &source, &target);

        let result = resume_item(
            &store,
            &library.to_string_lossy(),
            &library.join("database.xml"),
            &operation.journal_id,
            operation.operation,
            &operation.items[0],
        );

        assert_eq!(result.status, RecoveryItemOutcomeStatus::Resolved);
        assert!(!Path::new(&source).exists());
        assert!(Path::new(&target).is_file());
        assert_eq!(
            store.recovery_state(&library).expect("state should load").status,
            MutationRecoveryStatus::Clean
        );
        let database = parser::parse_database(&library.join("database.xml"))
            .expect("database should remain readable");
        assert!(parser::windows_paths_equal(&database.songs[0].file_path, &target));
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn resume_fs_applied_item_detects_existing_target_and_commits_database() {
        let (root, library, store, source, target) = fixture("resume-fs", false);
        let operation = planned_operation(&store, &library, &source, &target);
        fs::rename(&source, &target).expect("crash fixture should move file");
        store
            .transition_item(
                &library,
                &operation.journal_id,
                &operation.items[0].item_id,
                MutationJournalPhase::FsApplied,
            )
            .expect("fs_applied fixture should persist");
        let item = store
            .load_library(&library)
            .expect("journal should load")
            .operations[0]
            .items[0]
            .clone();

        let result = resume_item(
            &store,
            &library.to_string_lossy(),
            &library.join("database.xml"),
            &operation.journal_id,
            operation.operation,
            &item,
        );

        assert_eq!(result.status, RecoveryItemOutcomeStatus::Resolved);
        assert_eq!(
            store.recovery_state(&library).expect("state should load").status,
            MutationRecoveryStatus::Clean
        );
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn rollback_fs_applied_item_restores_file_and_database_reference() {
        let (root, library, store, source, target) = fixture("rollback-fs", true);
        let operation = planned_operation(&store, &library, &source, &target);
        store
            .transition_item(
                &library,
                &operation.journal_id,
                &operation.items[0].item_id,
                MutationJournalPhase::FsApplied,
            )
            .expect("fs_applied fixture should persist");
        let item = store
            .load_library(&library)
            .expect("journal should load")
            .operations[0]
            .items[0]
            .clone();

        let result = rollback_item(
            &store,
            &library.to_string_lossy(),
            &library.join("database.xml"),
            &operation.journal_id,
            operation.operation,
            &item,
        );

        assert_eq!(result.status, RecoveryItemOutcomeStatus::Resolved);
        assert!(Path::new(&source).is_file());
        assert!(!Path::new(&target).exists());
        let database = parser::parse_database(&library.join("database.xml"))
            .expect("database should remain readable");
        assert!(parser::windows_paths_equal(&database.songs[0].file_path, &source));
        assert_eq!(
            store.recovery_state(&library).expect("state should load").status,
            MutationRecoveryStatus::Clean
        );
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn resume_with_both_paths_present_requires_manual_review() {
        let (root, library, store, source, target) = fixture("resume-ambiguous", false);
        fs::write(&target, b"unrelated target").expect("ambiguous target should write");
        let operation = planned_operation(&store, &library, &source, &target);

        let result = resume_item(
            &store,
            &library.to_string_lossy(),
            &library.join("database.xml"),
            &operation.journal_id,
            operation.operation,
            &operation.items[0],
        );

        assert_eq!(
            result.status,
            RecoveryItemOutcomeStatus::ManualReviewRequired
        );
        assert_eq!(
            store.recovery_state(&library).expect("state should load").status,
            MutationRecoveryStatus::PendingRecovery
        );
        assert!(Path::new(&source).is_file());
        assert!(Path::new(&target).is_file());
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn targeted_selection_keeps_mixed_journals_isolated() {
        let (root, library, store, source, target) = fixture("targeted-selection", false);
        let resumable = planned_operation(&store, &library, &source, &target);
        let manual = store
            .plan_operation_for_recovery(
                &library,
                MutationOperationKind::Rename,
                vec![MutationJournalItem::new(&source, Some(&target))
                    .with_source_identity()
                    .expect("identity")],
            )
            .expect("second journal");
        store
            .require_manual_review(
                &library,
                &manual.journal_id,
                &manual.items[0].item_id,
                "fixture manual review",
            )
            .expect("manual state");
        let state = store.recovery_state(&library).expect("mixed state");

        let selected = selected_recovery_entries(
            &state,
            MutationRecoveryAction::Resume,
            Some(&resumable.journal_id),
        )
        .expect("resume should target one journal");
        assert_eq!(selected.len(), 1);
        assert_eq!(selected[0].journal.journal_id, resumable.journal_id);
        assert!(selected_recovery_entries(
            &state,
            MutationRecoveryAction::Resume,
            Some(&manual.journal_id),
        )
        .is_err());
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn substituted_source_is_never_moved_by_resume() {
        let (root, library, store, source, target) = fixture("substituted", false);
        let operation = planned_operation(&store, &library, &source, &target);
        fs::write(&source, b"evil content!").expect("same-size substitution should write");

        let result = resume_item(
            &store,
            &library.to_string_lossy(),
            &library.join("database.xml"),
            &operation.journal_id,
            operation.operation,
            &operation.items[0],
        );

        assert_eq!(result.status, RecoveryItemOutcomeStatus::ManualReviewRequired);
        assert!(Path::new(&source).is_file());
        assert!(!Path::new(&target).exists());
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }

    #[test]
    fn incompatible_database_is_detected_before_filesystem_resume() {
        let (root, library, store, source, target) = fixture("db-before-fs", false);
        let operation = planned_operation(&store, &library, &source, &target);
        fs::write(
            library.join("database.xml"),
            r#"<VirtualDJ_Database><Song FilePath="D:\\Music\\Elsewhere.mp3"/></VirtualDJ_Database>"#,
        )
        .expect("database substitution should write");

        let result = resume_item(
            &store,
            &library.to_string_lossy(),
            &library.join("database.xml"),
            &operation.journal_id,
            operation.operation,
            &operation.items[0],
        );

        assert_eq!(result.status, RecoveryItemOutcomeStatus::ManualReviewRequired);
        assert!(Path::new(&source).is_file());
        assert!(!Path::new(&target).exists());
        fs::remove_dir_all(root).expect("temporary fixture should be removed");
    }
}
