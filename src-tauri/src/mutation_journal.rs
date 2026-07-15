//! Crash-safe journal primitives for critical VirtualDJ library mutations.
//!
//! The store never discovers app-data or canonicalizes a library path. The
//! caller supplies the app-data root explicitly, while library identities use
//! lexical Windows normalization. Each library has an OS-backed lock and an
//! append-only sequence of immutable JSON generations. A torn newest
//! generation can only be ignored when an older valid generation exists.

use fs2::FileExt;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::fmt;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

pub const JOURNAL_SCHEMA_VERSION: u32 = 2;

const JOURNAL_DIRECTORY_NAME: &str = "mutation-journal";
const LOCK_FILE_NAME: &str = "journal.lock";
const MUTATION_LOCK_FILE_NAME: &str = "mutation.lock";
const REVISION_PREFIX: &str = "revision-";
const REVISION_SUFFIX: &str = ".json";
const REVISION_DIGITS: usize = 20;

static ID_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MutationJournalPhase {
    Planned,
    FsApplied,
    Completed,
    RolledBack,
    ManualReviewRequired,
}

impl MutationJournalPhase {
    pub const fn is_terminal(self) -> bool {
        matches!(self, Self::Completed | Self::RolledBack)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MutationOutcomeSummary {
    InProgress,
    Completed,
    RolledBack,
    MixedTerminal,
    ManualReviewRequired,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MutationOperationKind {
    Rename,
    Move,
    RemoveLibrary,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MutationRecoveryAction {
    Resume,
    Rollback,
    ManualReviewAcknowledged,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MutationRecoveryStatus {
    Clean,
    PendingRecovery,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationJournalLibrary {
    pub key: String,
    pub path: String,
}

impl MutationJournalLibrary {
    pub fn from_path(path: impl AsRef<Path>) -> Result<Self, MutationJournalError> {
        let raw_path = path.as_ref().to_string_lossy().into_owned();
        let key = library_key(path)?;
        Ok(Self {
            key,
            path: raw_path,
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationJournalItem {
    pub item_id: String,
    pub original_file_path: String,
    pub target_file_path: Option<String>,
    #[serde(default)]
    pub source_file_size: Option<u64>,
    #[serde(default)]
    pub source_sha256: Option<String>,
    pub phase: MutationJournalPhase,
    #[serde(default)]
    pub last_error: Option<String>,
    #[serde(default)]
    pub manual_review_acknowledged: bool,
}

impl MutationJournalItem {
    pub fn new(
        original_file_path: impl Into<String>,
        target_file_path: Option<impl Into<String>>,
    ) -> Self {
        Self::with_id(new_id("item"), original_file_path, target_file_path)
    }

    pub fn with_id(
        item_id: impl Into<String>,
        original_file_path: impl Into<String>,
        target_file_path: Option<impl Into<String>>,
    ) -> Self {
        Self {
            item_id: item_id.into(),
            original_file_path: original_file_path.into(),
            target_file_path: target_file_path.map(Into::into),
            source_file_size: None,
            source_sha256: None,
            phase: MutationJournalPhase::Planned,
            last_error: None,
            manual_review_acknowledged: false,
        }
    }

    /// Capture immutable source identity before a filesystem mutation is planned.
    pub fn with_source_identity(self) -> Result<Self, String> {
        let path = PathBuf::from(&self.original_file_path);
        self.with_source_identity_from(&path)
    }

    pub fn with_source_identity_from(mut self, path: &Path) -> Result<Self, String> {
        let metadata = fs::symlink_metadata(path)
            .map_err(|error| format!("No se pudo identificar el archivo fuente: {error}"))?;
        if !metadata.file_type().is_file() || metadata.file_type().is_symlink() {
            return Err("La fuente no es un archivo regular seguro".to_string());
        }
        self.source_file_size = Some(metadata.len());
        self.source_sha256 = Some(sha256_file(path)?);
        Ok(self)
    }

    /// Recovery must refuse files from older journals or substituted paths.
    pub fn matches_source_identity(&self, path: &Path) -> Result<bool, String> {
        let (Some(expected_size), Some(expected_sha256)) =
            (self.source_file_size, self.source_sha256.as_deref())
        else {
            return Ok(false);
        };
        let metadata = fs::symlink_metadata(path)
            .map_err(|error| format!("No se pudo verificar identidad física: {error}"))?;
        if !metadata.file_type().is_file()
            || metadata.file_type().is_symlink()
            || metadata.len() != expected_size
        {
            return Ok(false);
        }
        Ok(sha256_file(path)? == expected_sha256)
    }

    pub fn is_pending(&self) -> bool {
        match self.phase {
            MutationJournalPhase::Planned | MutationJournalPhase::FsApplied => true,
            MutationJournalPhase::ManualReviewRequired => !self.manual_review_acknowledged,
            MutationJournalPhase::Completed | MutationJournalPhase::RolledBack => false,
        }
    }

    pub fn transition(&mut self, next: MutationJournalPhase) -> Result<(), MutationJournalError> {
        validate_phase_transition(self.phase, next)?;
        self.phase = next;
        self.manual_review_acknowledged = false;
        if next != MutationJournalPhase::ManualReviewRequired {
            self.last_error = None;
        }
        Ok(())
    }

    pub fn acknowledge_manual_review(&mut self) -> Result<(), MutationJournalError> {
        if self.phase != MutationJournalPhase::ManualReviewRequired || !self.is_pending() {
            return Err(MutationJournalError::ActionNotAllowed {
                action: MutationRecoveryAction::ManualReviewAcknowledged,
                phase: self.phase,
            });
        }
        self.manual_review_acknowledged = true;
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationJournalOperation {
    pub journal_id: String,
    pub operation: MutationOperationKind,
    pub phase: MutationJournalPhase,
    pub outcome_summary: MutationOutcomeSummary,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub items: Vec<MutationJournalItem>,
}

impl MutationJournalOperation {
    pub fn new(operation: MutationOperationKind, item: MutationJournalItem) -> Self {
        Self::new_with_items(operation, vec![item])
    }

    pub fn new_with_items(
        operation: MutationOperationKind,
        items: Vec<MutationJournalItem>,
    ) -> Self {
        Self::with_id(new_id("journal"), operation, items)
    }

    pub fn with_id(
        journal_id: impl Into<String>,
        operation: MutationOperationKind,
        items: Vec<MutationJournalItem>,
    ) -> Self {
        let now = timestamp_millis();
        let mut journal = Self {
            journal_id: journal_id.into(),
            operation,
            phase: MutationJournalPhase::Planned,
            outcome_summary: MutationOutcomeSummary::InProgress,
            created_at_ms: now,
            updated_at_ms: now,
            items,
        };
        journal.refresh_summary();
        journal
    }

    pub fn is_pending(&self) -> bool {
        self.items.iter().any(MutationJournalItem::is_pending)
    }

    pub fn pending_items(&self) -> impl Iterator<Item = &MutationJournalItem> {
        self.items.iter().filter(|item| item.is_pending())
    }

    pub fn recommended_action(&self) -> Option<MutationRecoveryAction> {
        let (has_manual, has_resumable) = self.pending_kinds();
        match (has_manual, has_resumable) {
            (false, false) => None,
            (true, false) => Some(MutationRecoveryAction::ManualReviewAcknowledged),
            (false, true) => Some(MutationRecoveryAction::Resume),
            (true, true) => Some(MutationRecoveryAction::Rollback),
        }
    }

    pub fn allowed_actions(&self) -> Vec<MutationRecoveryAction> {
        let (has_manual, has_resumable) = self.pending_kinds();
        match (has_manual, has_resumable) {
            (false, false) => Vec::new(),
            (true, false) => vec![
                MutationRecoveryAction::Rollback,
                MutationRecoveryAction::ManualReviewAcknowledged,
            ],
            (false, true) => vec![
                MutationRecoveryAction::Resume,
                MutationRecoveryAction::Rollback,
            ],
            // A journal-level acknowledgement must not hide resumable items,
            // and resume cannot resolve a manual-review item. Rollback is the
            // only action safe to offer across the mixed set.
            (true, true) => vec![MutationRecoveryAction::Rollback],
        }
    }

    pub fn item(&self, item_id: &str) -> Result<&MutationJournalItem, MutationJournalError> {
        self.items
            .iter()
            .find(|item| item.item_id == item_id)
            .ok_or_else(|| MutationJournalError::ItemNotFound(item_id.to_string()))
    }

    pub fn item_mut(
        &mut self,
        item_id: &str,
    ) -> Result<&mut MutationJournalItem, MutationJournalError> {
        self.items
            .iter_mut()
            .find(|item| item.item_id == item_id)
            .ok_or_else(|| MutationJournalError::ItemNotFound(item_id.to_string()))
    }

    pub fn transition_item(
        &mut self,
        item_id: &str,
        next: MutationJournalPhase,
    ) -> Result<(), MutationJournalError> {
        self.item_mut(item_id)?.transition(next)?;
        self.updated_at_ms = timestamp_millis();
        self.refresh_summary();
        self.validate()
    }

    pub fn require_manual_review(
        &mut self,
        item_id: &str,
        message: impl Into<String>,
    ) -> Result<(), MutationJournalError> {
        let item = self.item_mut(item_id)?;
        item.transition(MutationJournalPhase::ManualReviewRequired)?;
        item.last_error = Some(message.into());
        self.updated_at_ms = timestamp_millis();
        self.refresh_summary();
        self.validate()
    }

    pub fn acknowledge_manual_review_item(
        &mut self,
        item_id: &str,
    ) -> Result<(), MutationJournalError> {
        self.item_mut(item_id)?.acknowledge_manual_review()?;
        self.updated_at_ms = timestamp_millis();
        self.refresh_summary();
        self.validate()
    }

    /// Journal-wide acknowledgement is only valid when every pending item is
    /// already in manual review. Mixed journals must be resolved per item.
    pub fn acknowledge_all_manual_review(&mut self) -> Result<(), MutationJournalError> {
        let pending: Vec<usize> = self
            .items
            .iter()
            .enumerate()
            .filter(|(_, item)| item.is_pending())
            .map(|(index, _)| index)
            .collect();
        if pending.is_empty()
            || pending
                .iter()
                .any(|index| self.items[*index].phase != MutationJournalPhase::ManualReviewRequired)
        {
            return Err(MutationJournalError::MixedAcknowledgementNotAllowed(
                self.journal_id.clone(),
            ));
        }
        for index in pending {
            self.items[index].manual_review_acknowledged = true;
        }
        self.updated_at_ms = timestamp_millis();
        self.refresh_summary();
        self.validate()
    }

    pub fn validate(&self) -> Result<(), MutationJournalError> {
        if self.journal_id.trim().is_empty() {
            return Err(MutationJournalError::InvalidJournal(
                "journalId no puede estar vacío".to_string(),
            ));
        }
        if self.items.is_empty() {
            return Err(MutationJournalError::InvalidJournal(
                "una operación debe contener al menos un ítem".to_string(),
            ));
        }

        let mut item_ids = BTreeSet::new();
        for item in &self.items {
            validate_item(self.operation, item)?;
            if !item_ids.insert(item.item_id.clone()) {
                return Err(MutationJournalError::InvalidJournal(format!(
                    "itemId duplicado: {}",
                    item.item_id
                )));
            }
        }

        let (expected_phase, expected_outcome) = self.derived_summary();
        if self.phase != expected_phase || self.outcome_summary != expected_outcome {
            return Err(MutationJournalError::InvalidJournal(format!(
                "resumen inconsistente: phase={:?}/{:?}, outcome={:?}/{:?}",
                self.phase, expected_phase, self.outcome_summary, expected_outcome
            )));
        }
        Ok(())
    }

    fn pending_kinds(&self) -> (bool, bool) {
        let has_manual = self
            .pending_items()
            .any(|item| item.phase == MutationJournalPhase::ManualReviewRequired);
        let has_resumable = self.pending_items().any(|item| {
            matches!(
                item.phase,
                MutationJournalPhase::Planned | MutationJournalPhase::FsApplied
            )
        });
        (has_manual, has_resumable)
    }

    fn refresh_summary(&mut self) {
        (self.phase, self.outcome_summary) = self.derived_summary();
    }

    fn derived_summary(&self) -> (MutationJournalPhase, MutationOutcomeSummary) {
        if self
            .items
            .iter()
            .all(|item| item.phase == MutationJournalPhase::Completed)
        {
            return (
                MutationJournalPhase::Completed,
                MutationOutcomeSummary::Completed,
            );
        }
        if self
            .items
            .iter()
            .all(|item| item.phase == MutationJournalPhase::RolledBack)
        {
            return (
                MutationJournalPhase::RolledBack,
                MutationOutcomeSummary::RolledBack,
            );
        }
        if self.items.iter().all(|item| item.phase.is_terminal()) {
            return (
                MutationJournalPhase::Completed,
                MutationOutcomeSummary::MixedTerminal,
            );
        }
        if self.items.iter().any(|item| {
            item.phase == MutationJournalPhase::ManualReviewRequired && item.is_pending()
        }) {
            return (
                MutationJournalPhase::ManualReviewRequired,
                MutationOutcomeSummary::ManualReviewRequired,
            );
        }
        if self
            .items
            .iter()
            .any(|item| item.phase == MutationJournalPhase::FsApplied)
        {
            return (
                MutationJournalPhase::FsApplied,
                MutationOutcomeSummary::InProgress,
            );
        }
        (
            MutationJournalPhase::Planned,
            MutationOutcomeSummary::InProgress,
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationJournalDocument {
    pub schema_version: u32,
    pub revision: u64,
    pub library: MutationJournalLibrary,
    pub operations: Vec<MutationJournalOperation>,
}

impl MutationJournalDocument {
    pub fn new(library_path: impl AsRef<Path>) -> Result<Self, MutationJournalError> {
        Ok(Self {
            schema_version: JOURNAL_SCHEMA_VERSION,
            revision: 0,
            library: MutationJournalLibrary::from_path(library_path)?,
            operations: Vec::new(),
        })
    }

    pub fn pending_operations(&self) -> Vec<MutationJournalOperation> {
        self.operations
            .iter()
            .filter(|operation| operation.is_pending())
            .cloned()
            .collect()
    }

    pub fn operation(
        &self,
        journal_id: &str,
    ) -> Result<&MutationJournalOperation, MutationJournalError> {
        self.operations
            .iter()
            .find(|operation| operation.journal_id == journal_id)
            .ok_or_else(|| MutationJournalError::OperationNotFound(journal_id.to_string()))
    }

    pub fn operation_mut(
        &mut self,
        journal_id: &str,
    ) -> Result<&mut MutationJournalOperation, MutationJournalError> {
        self.operations
            .iter_mut()
            .find(|operation| operation.journal_id == journal_id)
            .ok_or_else(|| MutationJournalError::OperationNotFound(journal_id.to_string()))
    }

    pub fn validate(&self) -> Result<(), MutationJournalError> {
        if self.schema_version != JOURNAL_SCHEMA_VERSION {
            return Err(MutationJournalError::UnsupportedSchema(self.schema_version));
        }
        let expected_key = library_key(&self.library.path)?;
        if self.library.key != expected_key {
            return Err(MutationJournalError::LibraryMismatch {
                expected: expected_key,
                actual: self.library.key.clone(),
            });
        }

        let mut journal_ids = BTreeSet::new();
        for operation in &self.operations {
            if !journal_ids.insert(operation.journal_id.clone()) {
                return Err(MutationJournalError::InvalidJournal(format!(
                    "journalId duplicado: {}",
                    operation.journal_id
                )));
            }
            operation.validate()?;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationRecoveryEntry {
    pub journal: MutationJournalOperation,
    pub recommended_action: Option<MutationRecoveryAction>,
    pub allowed_actions: Vec<MutationRecoveryAction>,
}

impl From<MutationJournalOperation> for MutationRecoveryEntry {
    fn from(journal: MutationJournalOperation) -> Self {
        let recommended_action = journal.recommended_action();
        let allowed_actions = journal.allowed_actions();
        Self {
            journal,
            recommended_action,
            allowed_actions,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationRecoveryState {
    pub status: MutationRecoveryStatus,
    pub library_key: String,
    pub recommended_action: Option<MutationRecoveryAction>,
    pub allowed_actions: Vec<MutationRecoveryAction>,
    pub entries: Vec<MutationRecoveryEntry>,
}

#[derive(Debug, Clone)]
pub struct MutationJournalStore {
    app_data_dir: PathBuf,
}

/// Exclusive library-scoped lease held for the complete duration of an
/// unjournaled critical mutation. Dropping it releases the OS-backed lock.
pub struct CriticalMutationGuard {
    _lock: LibraryLock,
}

impl MutationJournalStore {
    /// Construct a store scoped to an explicitly supplied app-data root.
    pub fn new(app_data_dir: impl AsRef<Path>) -> Self {
        Self {
            app_data_dir: app_data_dir.as_ref().to_path_buf(),
        }
    }

    pub fn app_data_dir(&self) -> &Path {
        &self.app_data_dir
    }

    pub fn journal_directory(&self) -> PathBuf {
        self.app_data_dir.join(JOURNAL_DIRECTORY_NAME)
    }

    pub fn begin_critical_mutation(
        &self,
        library_path: impl AsRef<Path>,
    ) -> Result<CriticalMutationGuard, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_mutation_lock(&library)?;
        let document = self.load_library(&library.path)?;
        if let Some(blocking) = document.operations.iter().find(|entry| entry.is_pending()) {
            return Err(MutationJournalError::PendingRecoveryBlocksMutation {
                library_key: library.key,
                journal_id: blocking.journal_id.clone(),
            });
        }
        Ok(CriticalMutationGuard { _lock: guard })
    }

    /// Recovery holds the same cross-process choreography lease as normal
    /// mutation engines, but it is allowed to start while journals are pending.
    pub fn begin_recovery_mutation(
        &self,
        library_path: impl AsRef<Path>,
    ) -> Result<CriticalMutationGuard, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        Ok(CriticalMutationGuard {
            _lock: self.acquire_mutation_lock(&library)?,
        })
    }

    /// Return the fixed-length per-library directory. The directory name is
    /// the SHA-256 digest of the verified canonical library key, not the path.
    pub fn library_journal_directory(
        &self,
        library_path: impl AsRef<Path>,
    ) -> Result<PathBuf, MutationJournalError> {
        let key = library_key(library_path)?;
        Ok(self
            .journal_directory()
            .join(format!("{:x}", Sha256::digest(key.as_bytes()))))
    }

    pub fn load_library(
        &self,
        library_path: impl AsRef<Path>,
    ) -> Result<MutationJournalDocument, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_lock(&library, LockMode::Shared)?;
        let result = self.load_unlocked(&library);
        drop(guard);
        result
    }

    /// Persist a caller-owned document using optimistic revision checking.
    /// Mutation engines should prefer the transaction methods below, which
    /// keep load-modify-save under one exclusive lock.
    pub fn save_library(
        &self,
        document: &MutationJournalDocument,
    ) -> Result<u64, MutationJournalError> {
        document.validate()?;
        let guard = self.acquire_lock(&document.library, LockMode::Exclusive)?;
        let current = self.load_unlocked(&document.library)?;
        if current.revision != document.revision {
            return Err(MutationJournalError::ConcurrentModification {
                expected_revision: document.revision,
                actual_revision: current.revision,
            });
        }
        let mut next = document.clone();
        let revision = self.persist_generation_unlocked(&mut next)?;
        drop(guard);
        Ok(revision)
    }

    /// Start a normal critical mutation. A pending journal for the same
    /// library blocks this call until recovery resolves it.
    pub fn plan_operation(
        &self,
        library_path: impl AsRef<Path>,
        operation: MutationOperationKind,
        items: Vec<MutationJournalItem>,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        self.plan_operation_inner(library_path, operation, items, false)
    }

    /// Explicit recovery/import seam allowed to add work while a library is
    /// already recovery-blocked. This is intentionally named separately so a
    /// normal mutation cannot bypass the gate by accident.
    pub fn plan_operation_for_recovery(
        &self,
        library_path: impl AsRef<Path>,
        operation: MutationOperationKind,
        items: Vec<MutationJournalItem>,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        self.plan_operation_inner(library_path, operation, items, true)
    }

    pub fn transition_item(
        &self,
        library_path: impl AsRef<Path>,
        journal_id: &str,
        item_id: &str,
        next: MutationJournalPhase,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_lock(&library, LockMode::Exclusive)?;
        let mut document = self.load_unlocked(&library)?;
        let operation = document.operation_mut(journal_id)?;
        operation.transition_item(item_id, next)?;
        let result = operation.clone();
        self.persist_generation_unlocked(&mut document)?;
        drop(guard);
        Ok(result)
    }

    pub fn require_manual_review(
        &self,
        library_path: impl AsRef<Path>,
        journal_id: &str,
        item_id: &str,
        message: impl Into<String>,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_lock(&library, LockMode::Exclusive)?;
        let mut document = self.load_unlocked(&library)?;
        let operation = document.operation_mut(journal_id)?;
        operation.require_manual_review(item_id, message)?;
        let result = operation.clone();
        self.persist_generation_unlocked(&mut document)?;
        drop(guard);
        Ok(result)
    }

    pub fn acknowledge_manual_review_item(
        &self,
        library_path: impl AsRef<Path>,
        journal_id: &str,
        item_id: &str,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_lock(&library, LockMode::Exclusive)?;
        let mut document = self.load_unlocked(&library)?;
        let operation = document.operation_mut(journal_id)?;
        operation.acknowledge_manual_review_item(item_id)?;
        let result = operation.clone();
        self.persist_generation_unlocked(&mut document)?;
        drop(guard);
        Ok(result)
    }

    pub fn acknowledge_manual_review(
        &self,
        library_path: impl AsRef<Path>,
        journal_id: &str,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_lock(&library, LockMode::Exclusive)?;
        let mut document = self.load_unlocked(&library)?;
        let operation = document.operation_mut(journal_id)?;
        operation.acknowledge_all_manual_review()?;
        let result = operation.clone();
        self.persist_generation_unlocked(&mut document)?;
        drop(guard);
        Ok(result)
    }

    pub fn list_pending(
        &self,
        library_path: impl AsRef<Path>,
    ) -> Result<Vec<MutationJournalOperation>, MutationJournalError> {
        Ok(self.load_library(library_path)?.pending_operations())
    }

    pub fn recovery_state(
        &self,
        library_path: impl AsRef<Path>,
    ) -> Result<MutationRecoveryState, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let pending = self.list_pending(&library.path)?;
        if pending.is_empty() {
            return Ok(MutationRecoveryState {
                status: MutationRecoveryStatus::Clean,
                library_key: library.key,
                recommended_action: None,
                allowed_actions: Vec::new(),
                entries: Vec::new(),
            });
        }

        let entries: Vec<MutationRecoveryEntry> = pending
            .into_iter()
            .map(MutationRecoveryEntry::from)
            .collect();
        let recommended_action = aggregate_recommendation(&entries);
        let allowed_actions = intersect_allowed_actions(&entries);
        Ok(MutationRecoveryState {
            status: MutationRecoveryStatus::PendingRecovery,
            library_key: library.key,
            recommended_action,
            allowed_actions,
            entries,
        })
    }

    fn plan_operation_inner(
        &self,
        library_path: impl AsRef<Path>,
        operation_kind: MutationOperationKind,
        items: Vec<MutationJournalItem>,
        recovery_override: bool,
    ) -> Result<MutationJournalOperation, MutationJournalError> {
        let library = MutationJournalLibrary::from_path(library_path)?;
        let guard = self.acquire_lock(&library, LockMode::Exclusive)?;
        let mut document = self.load_unlocked(&library)?;
        if !recovery_override {
            if let Some(blocking) = document.operations.iter().find(|entry| entry.is_pending()) {
                return Err(MutationJournalError::PendingRecoveryBlocksMutation {
                    library_key: library.key,
                    journal_id: blocking.journal_id.clone(),
                });
            }
        }

        let operation = MutationJournalOperation::new_with_items(operation_kind, items);
        operation.validate()?;
        document.operations.push(operation.clone());
        self.persist_generation_unlocked(&mut document)?;
        drop(guard);
        Ok(operation)
    }

    fn acquire_lock(
        &self,
        library: &MutationJournalLibrary,
        mode: LockMode,
    ) -> Result<LibraryLock, MutationJournalError> {
        self.acquire_named_lock(library, LOCK_FILE_NAME, mode)
    }

    fn acquire_mutation_lock(
        &self,
        library: &MutationJournalLibrary,
    ) -> Result<LibraryLock, MutationJournalError> {
        self.acquire_named_lock(library, MUTATION_LOCK_FILE_NAME, LockMode::Exclusive)
    }

    fn acquire_named_lock(
        &self,
        library: &MutationJournalLibrary,
        file_name: &str,
        mode: LockMode,
    ) -> Result<LibraryLock, MutationJournalError> {
        let directory = self.directory_for_key(&library.key);
        fs::create_dir_all(&directory).map_err(|source| MutationJournalError::Io {
            context: "crear directorio del journal",
            path: directory.clone(),
            source,
        })?;
        let lock_path = directory.join(file_name);
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(&lock_path)
            .map_err(|source| MutationJournalError::Io {
                context: "abrir lock del journal",
                path: lock_path.clone(),
                source,
            })?;
        let lock_result = match mode {
            LockMode::Shared => FileExt::lock_shared(&file),
            LockMode::Exclusive => FileExt::lock_exclusive(&file),
        };
        lock_result.map_err(|source| MutationJournalError::Io {
            context: "adquirir lock del journal",
            path: lock_path,
            source,
        })?;
        Ok(LibraryLock { file })
    }

    fn load_unlocked(
        &self,
        library: &MutationJournalLibrary,
    ) -> Result<MutationJournalDocument, MutationJournalError> {
        let directory = self.directory_for_key(&library.key);
        let revisions = revision_files(&directory)?;
        if revisions.is_empty() {
            return Ok(MutationJournalDocument {
                schema_version: JOURNAL_SCHEMA_VERSION,
                revision: 0,
                library: library.clone(),
                operations: Vec::new(),
            });
        }

        let mut errors = Vec::new();
        for (revision, path) in revisions.iter().rev() {
            match load_generation(path, *revision, library) {
                Ok(document) => {
                    // If a newer generation is torn, falling back to a clean
                    // document would erase the recovery signal. A pending
                    // previous generation is safe to expose; a clean one must
                    // remain an explicit corruption/recovery error.
                    if !errors.is_empty() && document.pending_operations().is_empty() {
                        errors.push(format!(
                            "{}: la última generación válida está clean pero existen generaciones posteriores inválidas",
                            path.display()
                        ));
                        return Err(MutationJournalError::NoValidGeneration {
                            library_key: library.key.clone(),
                            details: errors.join(" | "),
                        });
                    }
                    return Ok(document);
                }
                Err(error) => errors.push(format!("{}: {error}", path.display())),
            }
        }

        Err(MutationJournalError::NoValidGeneration {
            library_key: library.key.clone(),
            details: errors.join(" | "),
        })
    }

    fn persist_generation_unlocked(
        &self,
        document: &mut MutationJournalDocument,
    ) -> Result<u64, MutationJournalError> {
        let directory = self.directory_for_key(&document.library.key);
        fs::create_dir_all(&directory).map_err(|source| MutationJournalError::Io {
            context: "crear directorio del journal",
            path: directory.clone(),
            source,
        })?;

        let max_revision = revision_files(&directory)?
            .last()
            .map(|(revision, _)| *revision)
            .unwrap_or(0);
        let next_revision = max_revision
            .checked_add(1)
            .ok_or(MutationJournalError::RevisionOverflow)?;
        document.revision = next_revision;
        document.validate()?;
        let payload = serde_json::to_vec_pretty(document)?;
        let path = directory.join(revision_file_name(next_revision));

        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
            .map_err(|source| MutationJournalError::Io {
                context: "crear generación del journal",
                path: path.clone(),
                source,
            })?;
        file.write_all(&payload)
            .and_then(|()| file.sync_all())
            .map_err(|source| MutationJournalError::Io {
                context: "persistir generación del journal",
                path: path.clone(),
                source,
            })?;
        drop(file);
        sync_directory(&directory)?;
        Ok(next_revision)
    }

    fn directory_for_key(&self, key: &str) -> PathBuf {
        self.journal_directory()
            .join(format!("{:x}", Sha256::digest(key.as_bytes())))
    }
}

#[derive(Debug, Clone, Copy)]
enum LockMode {
    Shared,
    Exclusive,
}

struct LibraryLock {
    file: File,
}

impl Drop for LibraryLock {
    fn drop(&mut self) {
        let _ = FileExt::unlock(&self.file);
    }
}

pub fn library_key(path: impl AsRef<Path>) -> Result<String, MutationJournalError> {
    normalize_windows_absolute_path(path.as_ref())
}

pub fn same_library(
    first: impl AsRef<Path>,
    second: impl AsRef<Path>,
) -> Result<bool, MutationJournalError> {
    Ok(library_key(first)? == library_key(second)?)
}

pub fn validate_phase_transition(
    current: MutationJournalPhase,
    next: MutationJournalPhase,
) -> Result<(), MutationJournalError> {
    if current == next {
        return Ok(());
    }
    let valid = match current {
        MutationJournalPhase::Planned => matches!(
            next,
            MutationJournalPhase::FsApplied
                | MutationJournalPhase::RolledBack
                | MutationJournalPhase::ManualReviewRequired
        ),
        MutationJournalPhase::FsApplied => matches!(
            next,
            MutationJournalPhase::Completed
                | MutationJournalPhase::RolledBack
                | MutationJournalPhase::ManualReviewRequired
        ),
        MutationJournalPhase::ManualReviewRequired => {
            matches!(next, MutationJournalPhase::RolledBack)
        }
        MutationJournalPhase::Completed | MutationJournalPhase::RolledBack => false,
    };
    if valid {
        Ok(())
    } else {
        Err(MutationJournalError::InvalidTransition { current, next })
    }
}

pub fn allowed_recovery_actions(phase: MutationJournalPhase) -> Vec<MutationRecoveryAction> {
    match phase {
        MutationJournalPhase::Planned | MutationJournalPhase::FsApplied => vec![
            MutationRecoveryAction::Resume,
            MutationRecoveryAction::Rollback,
        ],
        MutationJournalPhase::ManualReviewRequired => vec![
            MutationRecoveryAction::Rollback,
            MutationRecoveryAction::ManualReviewAcknowledged,
        ],
        MutationJournalPhase::Completed | MutationJournalPhase::RolledBack => Vec::new(),
    }
}

pub fn recommended_recovery_action(phase: MutationJournalPhase) -> Option<MutationRecoveryAction> {
    match phase {
        MutationJournalPhase::Planned | MutationJournalPhase::FsApplied => {
            Some(MutationRecoveryAction::Resume)
        }
        MutationJournalPhase::ManualReviewRequired => {
            Some(MutationRecoveryAction::ManualReviewAcknowledged)
        }
        MutationJournalPhase::Completed | MutationJournalPhase::RolledBack => None,
    }
}

#[derive(Debug)]
pub enum MutationJournalError {
    InvalidLibraryPath(String),
    InvalidItemPath {
        item_id: String,
        message: String,
    },
    InvalidJournal(String),
    UnsupportedSchema(u32),
    LibraryMismatch {
        expected: String,
        actual: String,
    },
    OperationNotFound(String),
    ItemNotFound(String),
    InvalidTransition {
        current: MutationJournalPhase,
        next: MutationJournalPhase,
    },
    ActionNotAllowed {
        action: MutationRecoveryAction,
        phase: MutationJournalPhase,
    },
    MixedAcknowledgementNotAllowed(String),
    PendingRecoveryBlocksMutation {
        library_key: String,
        journal_id: String,
    },
    ConcurrentModification {
        expected_revision: u64,
        actual_revision: u64,
    },
    NoValidGeneration {
        library_key: String,
        details: String,
    },
    RevisionOverflow,
    Io {
        context: &'static str,
        path: PathBuf,
        source: std::io::Error,
    },
    Serialization(serde_json::Error),
}

impl fmt::Display for MutationJournalError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidLibraryPath(message) => {
                write!(formatter, "ruta de biblioteca inválida: {message}")
            }
            Self::InvalidItemPath { item_id, message } => {
                write!(formatter, "ruta inválida en ítem {item_id}: {message}")
            }
            Self::InvalidJournal(message) => write!(formatter, "journal inválido: {message}"),
            Self::UnsupportedSchema(version) => {
                write!(formatter, "schema de journal no soportado: {version}")
            }
            Self::LibraryMismatch { expected, actual } => write!(
                formatter,
                "el journal pertenece a otra biblioteca (esperada {expected}, actual {actual})"
            ),
            Self::OperationNotFound(id) => {
                write!(formatter, "operación de journal no encontrada: {id}")
            }
            Self::ItemNotFound(id) => write!(formatter, "ítem de journal no encontrado: {id}"),
            Self::InvalidTransition { current, next } => {
                write!(formatter, "transición inválida: {current:?} -> {next:?}")
            }
            Self::ActionNotAllowed { action, phase } => {
                write!(formatter, "acción {action:?} no permitida para {phase:?}")
            }
            Self::MixedAcknowledgementNotAllowed(id) => write!(
                formatter,
                "el journal {id} mezcla revisión manual con otros pendientes; use acknowledgement por ítem"
            ),
            Self::PendingRecoveryBlocksMutation {
                library_key,
                journal_id,
            } => write!(
                formatter,
                "la biblioteca {library_key} tiene recovery pendiente en {journal_id}"
            ),
            Self::ConcurrentModification {
                expected_revision,
                actual_revision,
            } => write!(
                formatter,
                "revisión desactualizada: esperada {expected_revision}, actual {actual_revision}"
            ),
            Self::NoValidGeneration {
                library_key,
                details,
            } => write!(
                formatter,
                "no existe una generación válida para {library_key}: {details}"
            ),
            Self::RevisionOverflow => write!(formatter, "se agotaron las revisiones del journal"),
            Self::Io {
                context,
                path,
                source,
            } => write!(formatter, "no se pudo {context} {}: {source}", path.display()),
            Self::Serialization(error) => {
                write!(formatter, "journal no se pudo serializar: {error}")
            }
        }
    }
}

impl std::error::Error for MutationJournalError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Io { source, .. } => Some(source),
            Self::Serialization(error) => Some(error),
            _ => None,
        }
    }
}

impl From<serde_json::Error> for MutationJournalError {
    fn from(error: serde_json::Error) -> Self {
        Self::Serialization(error)
    }
}

fn validate_item(
    operation: MutationOperationKind,
    item: &MutationJournalItem,
) -> Result<(), MutationJournalError> {
    if item.item_id.trim().is_empty() {
        return Err(MutationJournalError::InvalidJournal(
            "itemId no puede estar vacío".to_string(),
        ));
    }
    let original =
        normalize_windows_absolute_path(Path::new(&item.original_file_path)).map_err(|error| {
            MutationJournalError::InvalidItemPath {
                item_id: item.item_id.clone(),
                message: error.to_string(),
            }
        })?;

    if matches!(
        operation,
        MutationOperationKind::Rename | MutationOperationKind::Move
    ) {
        let target = item
            .target_file_path
            .as_deref()
            .filter(|path| !path.trim().is_empty())
            .ok_or_else(|| MutationJournalError::InvalidItemPath {
                item_id: item.item_id.clone(),
                message: "rename/move requiere targetFilePath".to_string(),
            })?;
        let target = normalize_windows_absolute_path(Path::new(target)).map_err(|error| {
            MutationJournalError::InvalidItemPath {
                item_id: item.item_id.clone(),
                message: error.to_string(),
            }
        })?;
        if original == target {
            return Err(MutationJournalError::InvalidItemPath {
                item_id: item.item_id.clone(),
                message: "targetFilePath debe ser distinto de originalFilePath".to_string(),
            });
        }
        if operation == MutationOperationKind::Rename
            && normalized_windows_parent(&original) != normalized_windows_parent(&target)
        {
            return Err(MutationJournalError::InvalidItemPath {
                item_id: item.item_id.clone(),
                message: "rename debe conservar el mismo directorio padre; use move para cambiar de carpeta"
                    .to_string(),
            });
        }
    }
    Ok(())
}

fn normalized_windows_parent(path: &str) -> Option<&str> {
    path.rsplit_once('/').map(|(parent, _)| parent)
}

fn normalize_windows_absolute_path(path: &Path) -> Result<String, MutationJournalError> {
    let mut raw = path.to_string_lossy().replace('\\', "/");
    if raw.trim().is_empty() {
        return Err(MutationJournalError::InvalidLibraryPath(
            "la ruta no puede estar vacía".to_string(),
        ));
    }

    let lower = raw.to_ascii_lowercase();
    if lower.starts_with("//?/unc/") {
        raw = format!("//{}", &raw[8..]);
    } else if lower.starts_with("//?/") {
        raw = raw[4..].to_string();
    } else if lower.starts_with("//./") {
        return Err(MutationJournalError::InvalidLibraryPath(
            "los device paths de Windows no son una biblioteca válida".to_string(),
        ));
    }

    let (prefix, rest) = if raw.starts_with("//") {
        let mut components = raw[2..].split('/').filter(|part| !part.is_empty());
        let server = components.next().ok_or_else(|| {
            MutationJournalError::InvalidLibraryPath(
                "una ruta UNC requiere servidor y share".to_string(),
            )
        })?;
        let share = components.next().ok_or_else(|| {
            MutationJournalError::InvalidLibraryPath(
                "una ruta UNC requiere servidor y share".to_string(),
            )
        })?;
        let prefix_len = 2 + server.len() + 1 + share.len();
        (format!("//{server}/{share}"), &raw[prefix_len..])
    } else {
        let bytes = raw.as_bytes();
        if bytes.len() < 3
            || !bytes[0].is_ascii_alphabetic()
            || bytes[1] != b':'
            || bytes[2] != b'/'
        {
            return Err(MutationJournalError::InvalidLibraryPath(
                "se requiere ruta Windows absoluta; las rutas relativas y drive-relative no son válidas"
                    .to_string(),
            ));
        }
        (raw[..2].to_string(), &raw[3..])
    };

    let mut components: Vec<&str> = Vec::new();
    for component in rest.split('/') {
        if component.is_empty() || component == "." {
            continue;
        }
        if component == ".." {
            if components.pop().is_none() {
                return Err(MutationJournalError::InvalidLibraryPath(
                    "la ruta intenta escapar de su raíz".to_string(),
                ));
            }
        } else {
            components.push(component);
        }
    }

    let mut normalized = prefix;
    if !components.is_empty() {
        normalized.push('/');
        normalized.push_str(&components.join("/"));
    } else if normalized.len() == 2 && normalized.as_bytes()[1] == b':' {
        normalized.push('/');
    }
    Ok(normalized.to_lowercase())
}

fn aggregate_recommendation(entries: &[MutationRecoveryEntry]) -> Option<MutationRecoveryAction> {
    let first = entries.first()?.recommended_action;
    if entries
        .iter()
        .all(|entry| entry.recommended_action == first)
    {
        first
    } else {
        Some(MutationRecoveryAction::Rollback)
    }
}

fn intersect_allowed_actions(entries: &[MutationRecoveryEntry]) -> Vec<MutationRecoveryAction> {
    let Some(first) = entries.first() else {
        return Vec::new();
    };
    first
        .allowed_actions
        .iter()
        .copied()
        .filter(|action| {
            entries
                .iter()
                .all(|entry| entry.allowed_actions.contains(action))
        })
        .collect()
}

fn load_generation(
    path: &Path,
    expected_revision: u64,
    library: &MutationJournalLibrary,
) -> Result<MutationJournalDocument, MutationJournalError> {
    let payload = fs::read(path).map_err(|source| MutationJournalError::Io {
        context: "leer generación del journal",
        path: path.to_path_buf(),
        source,
    })?;
    let document: MutationJournalDocument = serde_json::from_slice(&payload)?;
    if document.revision != expected_revision {
        return Err(MutationJournalError::InvalidJournal(format!(
            "revision interna {} no coincide con archivo {expected_revision}",
            document.revision
        )));
    }
    if document.library.key != library.key {
        return Err(MutationJournalError::LibraryMismatch {
            expected: library.key.clone(),
            actual: document.library.key.clone(),
        });
    }
    document.validate()?;
    Ok(document)
}

fn revision_files(directory: &Path) -> Result<Vec<(u64, PathBuf)>, MutationJournalError> {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(source) if source.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(source) => {
            return Err(MutationJournalError::Io {
                context: "listar generaciones del journal",
                path: directory.to_path_buf(),
                source,
            })
        }
    };

    let mut revisions = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|source| MutationJournalError::Io {
            context: "leer entrada del journal",
            path: directory.to_path_buf(),
            source,
        })?;
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if let Some(revision) = parse_revision_file_name(&name) {
            revisions.push((revision, entry.path()));
        }
    }
    revisions.sort_by_key(|(revision, _)| *revision);
    Ok(revisions)
}

fn revision_file_name(revision: u64) -> String {
    format!("{REVISION_PREFIX}{revision:0REVISION_DIGITS$}{REVISION_SUFFIX}")
}

fn parse_revision_file_name(name: &str) -> Option<u64> {
    let digits = name
        .strip_prefix(REVISION_PREFIX)?
        .strip_suffix(REVISION_SUFFIX)?;
    if digits.len() != REVISION_DIGITS || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    digits.parse().ok()
}

fn sync_directory(directory: &Path) -> Result<(), MutationJournalError> {
    #[cfg(unix)]
    {
        let file = File::open(directory).map_err(|source| MutationJournalError::Io {
            context: "abrir directorio del journal",
            path: directory.to_path_buf(),
            source,
        })?;
        file.sync_all().map_err(|source| MutationJournalError::Io {
            context: "sincronizar directorio del journal",
            path: directory.to_path_buf(),
            source,
        })?;
    }
    #[cfg(not(unix))]
    {
        let _ = directory;
    }
    Ok(())
}

fn timestamp_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .min(u64::MAX as u128) as u64
}

fn new_id(prefix: &str) -> String {
    format!(
        "{prefix}-{}-{}-{}",
        timestamp_millis(),
        std::process::id(),
        ID_SEQUENCE.fetch_add(1, Ordering::Relaxed)
    )
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let file = File::open(path)
        .map_err(|error| format!("No se pudo abrir el archivo para identificarlo: {error}"))?;
    let mut reader = std::io::BufReader::new(file);
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = reader
            .read(&mut buffer)
            .map_err(|error| format!("No se pudo calcular identidad SHA-256: {error}"))?;
        if read == 0 {
            break;
        }
        digest.update(&buffer[..read]);
    }
    Ok(format!("{:x}", digest.finalize()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Barrier};
    use std::thread;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(label: &str) -> PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "vdj-manager-journal-{label}-{}-{stamp}",
            std::process::id()
        ))
    }

    fn cleanup(path: &Path) {
        let _ = fs::remove_dir_all(path);
    }

    fn rename_item(index: usize) -> MutationJournalItem {
        MutationJournalItem::with_id(
            format!("item-{index}"),
            format!(r"C:\Music\Track {index}.mp3"),
            Some(format!(r"C:\Music\Renamed {index}.mp3")),
        )
    }

    #[test]
    fn library_aliases_are_stable_and_relative_paths_are_rejected() {
        let normal = library_key(r"C:\Music\Library").expect("absolute path");
        let extended = library_key(r"\\?\c:\MUSIC\Library\.").expect("extended path");
        assert_eq!(normal, extended);
        assert!(same_library(
            r"\\Server\Share\VirtualDJ",
            r"\\?\UNC\server\share\VIRTUALDJ"
        )
        .expect("UNC aliases"));
        assert!(library_key(r"Music\Library").is_err());
        assert!(library_key(r"C:Music\Library").is_err());
    }

    #[test]
    fn library_directory_is_fixed_length_for_long_unicode_paths() {
        let root = temp_dir("long-key");
        let store = MutationJournalStore::new(&root);
        let long = format!(r"C:\{}\VirtualDJ", "音楽 colección ".repeat(200));
        let directory = store
            .library_journal_directory(&long)
            .expect("long absolute path should hash");
        let name = directory
            .file_name()
            .expect("digest directory")
            .to_string_lossy();
        assert_eq!(name.len(), 64);
        assert!(name.bytes().all(|byte| byte.is_ascii_hexdigit()));
        let isolated = store
            .library_journal_directory(format!(r"D:\{}\VirtualDJ", "音楽 colección ".repeat(200)))
            .expect("different library should hash independently");
        assert_ne!(directory, isolated);
        cleanup(&root);
    }

    #[test]
    fn concurrent_recovery_plans_keep_both_generations() {
        let root = temp_dir("concurrent");
        let store = Arc::new(MutationJournalStore::new(&root));
        let barrier = Arc::new(Barrier::new(3));
        let mut handles = Vec::new();
        for index in 0..2 {
            let store = Arc::clone(&store);
            let barrier = Arc::clone(&barrier);
            handles.push(thread::spawn(move || {
                barrier.wait();
                store.plan_operation_for_recovery(
                    r"C:\VirtualDJ",
                    MutationOperationKind::Rename,
                    vec![rename_item(index)],
                )
            }));
        }
        barrier.wait();
        for handle in handles {
            handle
                .join()
                .expect("thread should not panic")
                .expect("locked transaction should succeed");
        }

        let document = store
            .load_library(r"c:\virtualdj")
            .expect("latest generation should load");
        assert_eq!(document.operations.len(), 2);
        assert_eq!(document.revision, 2);
        cleanup(&root);
    }

    #[test]
    fn critical_mutation_guard_serializes_plan_check_and_write_window() {
        let root = temp_dir("critical-guard");
        let store = Arc::new(MutationJournalStore::new(&root));
        let guard = store
            .begin_critical_mutation(r"C:\VirtualDJ")
            .expect("clean library should lease mutation window");
        let (tx, rx) = std::sync::mpsc::channel();
        let worker_store = Arc::clone(&store);
        let worker = thread::spawn(move || {
            let _worker_guard = worker_store
                .begin_recovery_mutation(r"C:\VirtualDJ")
                .expect("planner should acquire choreography lease");
            let result = worker_store.plan_operation(
                r"C:\VirtualDJ",
                MutationOperationKind::Rename,
                vec![rename_item(99)],
            );
            tx.send(result).expect("result should be observed");
        });

        assert!(rx.recv_timeout(std::time::Duration::from_millis(100)).is_err());
        drop(guard);
        rx.recv_timeout(std::time::Duration::from_secs(2))
            .expect("planner should continue after the full mutation window")
            .expect("planner should persist");
        worker.join().expect("planner thread should finish");
        cleanup(&root);
    }

    #[test]
    fn torn_generation_falls_back_only_when_previous_generation_is_valid() {
        let root = temp_dir("torn");
        let store = MutationJournalStore::new(&root);
        let library = r"C:\VirtualDJ";
        let operation = store
            .plan_operation(library, MutationOperationKind::Rename, vec![rename_item(1)])
            .expect("first generation");
        let directory = store
            .library_journal_directory(library)
            .expect("library directory");
        fs::write(
            directory.join(revision_file_name(2)),
            b"{\"schemaVersion\":",
        )
        .expect("simulate torn generation");

        let reopened = store.load_library(library).expect("revision 1 fallback");
        assert_eq!(reopened.revision, 1);
        let transitioned = store
            .transition_item(
                library,
                &operation.journal_id,
                &operation.items[0].item_id,
                MutationJournalPhase::FsApplied,
            )
            .expect("new generation should skip torn revision number");
        assert_eq!(transitioned.phase, MutationJournalPhase::FsApplied);
        assert_eq!(store.load_library(library).expect("revision 3").revision, 3);

        store
            .transition_item(
                library,
                &operation.journal_id,
                &operation.items[0].item_id,
                MutationJournalPhase::Completed,
            )
            .expect("completed revision 4");
        fs::write(
            directory.join(revision_file_name(5)),
            b"{\"schemaVersion\":",
        )
        .expect("simulate torn generation after clean state");
        assert!(matches!(
            store.load_library(library),
            Err(MutationJournalError::NoValidGeneration { .. })
        ));

        let empty_root = temp_dir("only-torn");
        let empty_store = MutationJournalStore::new(&empty_root);
        let empty_directory = empty_store
            .library_journal_directory(library)
            .expect("library directory");
        fs::create_dir_all(&empty_directory).expect("create generation directory");
        fs::write(
            empty_directory.join(revision_file_name(1)),
            b"not-valid-json",
        )
        .expect("simulate first torn generation");
        assert!(matches!(
            empty_store.load_library(library),
            Err(MutationJournalError::NoValidGeneration { .. })
        ));

        cleanup(&root);
        cleanup(&empty_root);
    }

    #[test]
    fn pending_operation_blocks_normal_plan_but_not_another_library() {
        let root = temp_dir("gate");
        let store = MutationJournalStore::new(&root);
        store
            .plan_operation(
                r"C:\VirtualDJ",
                MutationOperationKind::Rename,
                vec![rename_item(1)],
            )
            .expect("first plan");
        assert!(matches!(
            store.plan_operation(
                r"c:\virtualdj",
                MutationOperationKind::Rename,
                vec![rename_item(2)]
            ),
            Err(MutationJournalError::PendingRecoveryBlocksMutation { .. })
        ));
        store
            .plan_operation(
                r"D:\VirtualDJ",
                MutationOperationKind::Rename,
                vec![MutationJournalItem::new(
                    r"D:\Music\Track.mp3",
                    Some(r"D:\Music\Renamed.mp3"),
                )],
            )
            .expect("other library remains independent");
        cleanup(&root);
    }

    #[test]
    fn acknowledgement_is_per_item_and_mixed_global_ack_stays_pending() {
        let root = temp_dir("mixed-ack");
        let store = MutationJournalStore::new(&root);
        let library = r"C:\VirtualDJ";
        let operation = store
            .plan_operation(
                library,
                MutationOperationKind::Rename,
                vec![rename_item(1), rename_item(2)],
            )
            .expect("plan");
        store
            .require_manual_review(
                library,
                &operation.journal_id,
                &operation.items[0].item_id,
                "rollback failed",
            )
            .expect("manual item");

        assert!(matches!(
            store.acknowledge_manual_review(library, &operation.journal_id),
            Err(MutationJournalError::MixedAcknowledgementNotAllowed(_))
        ));
        let item_ack = store
            .acknowledge_manual_review_item(
                library,
                &operation.journal_id,
                &operation.items[0].item_id,
            )
            .expect("per-item ack");
        assert!(item_ack.items[0].manual_review_acknowledged);
        assert!(item_ack.items[1].is_pending());
        assert_eq!(
            store.recovery_state(library).expect("state").status,
            MutationRecoveryStatus::PendingRecovery
        );
        cleanup(&root);
    }

    #[test]
    fn recovery_entries_expose_per_journal_recommendations_and_actions() {
        let root = temp_dir("entry-contract");
        let store = MutationJournalStore::new(&root);
        let library = r"C:\VirtualDJ";
        let first = store
            .plan_operation_for_recovery(
                library,
                MutationOperationKind::Rename,
                vec![rename_item(1)],
            )
            .expect("resumable");
        let second = store
            .plan_operation_for_recovery(
                library,
                MutationOperationKind::Rename,
                vec![rename_item(2)],
            )
            .expect("manual candidate");
        store
            .require_manual_review(
                library,
                &second.journal_id,
                &second.items[0].item_id,
                "needs review",
            )
            .expect("manual");

        let state = store.recovery_state(library).expect("recovery state");
        assert_eq!(state.entries.len(), 2);
        let resumable = state
            .entries
            .iter()
            .find(|entry| entry.journal.journal_id == first.journal_id)
            .expect("resumable entry");
        assert_eq!(
            resumable.recommended_action,
            Some(MutationRecoveryAction::Resume)
        );
        assert_eq!(
            resumable.allowed_actions,
            vec![
                MutationRecoveryAction::Resume,
                MutationRecoveryAction::Rollback
            ]
        );
        let manual = state
            .entries
            .iter()
            .find(|entry| entry.journal.journal_id == second.journal_id)
            .expect("manual entry");
        assert_eq!(
            manual.recommended_action,
            Some(MutationRecoveryAction::ManualReviewAcknowledged)
        );
        assert!(manual
            .allowed_actions
            .contains(&MutationRecoveryAction::ManualReviewAcknowledged));
        cleanup(&root);
    }

    #[test]
    fn mixed_terminal_outcomes_are_clean_and_reported_without_manual_review() {
        let mut operation = MutationJournalOperation::new_with_items(
            MutationOperationKind::Rename,
            vec![rename_item(1), rename_item(2)],
        );
        operation
            .transition_item("item-1", MutationJournalPhase::FsApplied)
            .expect("fs item 1");
        operation
            .transition_item("item-1", MutationJournalPhase::Completed)
            .expect("complete item 1");
        operation
            .transition_item("item-2", MutationJournalPhase::RolledBack)
            .expect("rollback item 2");

        assert!(!operation.is_pending());
        assert_eq!(
            operation.outcome_summary,
            MutationOutcomeSummary::MixedTerminal
        );
        assert_ne!(operation.phase, MutationJournalPhase::ManualReviewRequired);
        assert!(operation.allowed_actions().is_empty());
    }

    #[test]
    fn invalid_rename_move_payloads_are_rejected_before_persistence() {
        let root = temp_dir("invalid-payload");
        let store = MutationJournalStore::new(&root);
        for target in [None, Some("   "), Some(r"c:\music\TRACK.mp3")] {
            let item = MutationJournalItem::with_id(
                "bad-item",
                r"C:\Music\Track.mp3",
                target.map(str::to_string),
            );
            assert!(matches!(
                store.plan_operation(r"C:\VirtualDJ", MutationOperationKind::Rename, vec![item]),
                Err(MutationJournalError::InvalidItemPath { .. })
            ));
        }
        assert!(store
            .list_pending(r"C:\VirtualDJ")
            .expect("invalid payload did not create generation")
            .is_empty());
        cleanup(&root);
    }

    #[test]
    fn rename_requires_same_parent_while_move_allows_a_different_parent() {
        let cross_parent = MutationJournalItem::with_id(
            "cross-parent",
            r"C:\Music\Track.mp3",
            Some(r"C:\Archive\Track.mp3"),
        );
        assert!(matches!(
            MutationJournalOperation::new(MutationOperationKind::Rename, cross_parent.clone())
                .validate(),
            Err(MutationJournalError::InvalidItemPath { .. })
        ));
        MutationJournalOperation::new(MutationOperationKind::Move, cross_parent)
            .validate()
            .expect("move may change parent directory");

        MutationJournalOperation::new(
            MutationOperationKind::Rename,
            MutationJournalItem::with_id(
                "same-parent-alias",
                r"C:\Music\Track.mp3",
                Some(r"\\?\c:\MUSIC\Renamed.mp3"),
            ),
        )
        .validate()
        .expect("rename should compare normalized Windows parents");
    }
}
