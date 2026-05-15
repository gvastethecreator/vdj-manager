# VDJ Manager Hardening Implementation Plan

**Nota de continuidad (2026-05-15):** este plan documenta la primera ronda de hardening ya ejecutada. La arquitectura objetivo y los slices siguientes quedaron detallados en `docs/superpowers/plans/2026-05-15-vdj-manager-slices-criticos.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make VirtualDJ database/resource writes safer, testable, and easier to evolve before adding more product features.

**Architecture:** Keep the existing Tauri command boundary, but move risky filesystem behavior into small backend utilities with tests. Database mutations should use structured payloads, atomic writes, verified backups, and reparse checks.

**Tech Stack:** Rust 2021, Tauri 2, quick-xml, xmltree, React 19, TypeScript, Bun, OXC, Cargo.

---

## File Structure

- Modify: `src-tauri/src/database/parser.rs` - atomic database writes and recovery behavior.
- Create: `src-tauri/src/safety.rs` - shared backup and atomic file write helpers.
- Modify: `src-tauri/src/lib.rs` - register the new `safety` module.
- Modify: `src-tauri/src/commands/database.rs` - structured tag update payload and shared backup helper.
- Modify: `src-tauri/src/commands/files.rs` - shared backup helper, explicit cross-drive failure handling.
- Modify: `src-tauri/src/commands/configs.rs` - shared backup/atomic write for settings, mapper, pad, generic config writes.
- Modify: `src-tauri/src/commands/waveforms.rs` - Clippy-clean loops.
- Create: `src-tauri/tests/fixtures/database_minimal.xml`
- Create: `src-tauri/tests/fixtures/database_unknown_attrs.xml`
- Create: `src-tauri/tests/database_write.rs`
- Create: `src-tauri/tests/resource_write.rs`
- Modify: `src/lib/api.ts` - migrate single tag update wrapper to structured payload after Rust command changes.
- Modify: `src/components/SongTable.tsx` - surface inline edit failures through app error state.
- Create: `.github/workflows/ci.yml` - CI for TS, Rust, Clippy and build.
- Modify: `package.json` - split lint/check/format naming if needed.

---

### Task 1: Backend Safety Helpers

**Files:**

- Create: `src-tauri/src/safety.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/resource_write.rs`

- [x] **Step 1: Add failing tests for backup and atomic write**

Create `src-tauri/tests/resource_write.rs` with tests that:

- write `original` to a temp file;
- call `create_timestamped_backup`;
- verify backup exists and contains `original`;
- call `atomic_write_bytes`;
- verify target contains only the replacement payload.

Run:

```powershell
cargo test --test resource_write
```

Expected before implementation: compile failure because `vdj_manager_lib::safety` does not exist.

- [x] **Step 2: Implement `src-tauri/src/safety.rs`**

Implement:

- `create_timestamped_backup(target: &Path, label: &str) -> Result<Option<PathBuf>, String>`
- `atomic_write_bytes(target: &Path, payload: &[u8]) -> Result<(), String>`
- `atomic_write_string(target: &Path, payload: &str) -> Result<(), String>`

Required behavior:

- backup returns `Ok(None)` if target does not exist;
- backup fails if copy fails;
- atomic write creates temp file in same directory;
- temp file is flushed with `sync_all`;
- final replace uses `std::fs::rename`;
- temp file is removed on failure when possible.

- [x] **Step 3: Expose module**

Modify `src-tauri/src/lib.rs`:

```rust
pub mod safety;
```

- [x] **Step 4: Verify**

Run:

```powershell
cargo test --test resource_write
cargo check
```

Expected: both pass.

---

### Task 2: Atomic Database Writes

**Files:**

- Modify: `src-tauri/src/database/parser.rs`
- Test: `src-tauri/tests/database_write.rs`
- Create: `src-tauri/tests/fixtures/database_minimal.xml`
- Create: `src-tauri/tests/fixtures/database_unknown_attrs.xml`

- [x] **Step 1: Add fixtures**

`database_minimal.xml` should contain a small valid `VirtualDJ_Database` with two songs, `Tags`, `Infos`, `Scan`, `Poi`, `Comment`, `CustomMix`, and `Link`.

`database_unknown_attrs.xml` should include at least one unknown attribute on `Song`, `Tags`, `Infos`, and `Poi`; this test documents current behavior and should initially fail if preservation is not implemented yet.

- [x] **Step 2: Add tests**

Create tests for:

- parse minimal DB;
- write checked DB and reparse;
- preserve core fields after write;
- document whether unknown attributes are preserved.

Run:

```powershell
cargo test --test database_write
```

- [x] **Step 3: Use atomic write in parser**

Change `write_database()` to call `safety::atomic_write_string` instead of `fs::write`.

- [x] **Step 4: Verify**

Run:

```powershell
cargo test --test database_write
cargo check
```

Expected: core parse/write tests pass. If unknown attributes still fail, keep that as a named follow-up and do not hide it.

---

### Task 3: Remove Silent Backup Failures

**Files:**

- Modify: `src-tauri/src/commands/database.rs`
- Modify: `src-tauri/src/commands/files.rs`
- Modify: `src-tauri/src/commands/configs.rs`
- Test: `src-tauri/tests/resource_write.rs`

- [x] **Step 1: Replace local backup helpers**

Use `safety::create_timestamped_backup` in:

- `save_database`
- `update_song_tags`
- `delete_songs`
- `rename_file_op`
- `move_files_op`
- `relocate_file`
- `write_vdj_config_file`
- `update_vdj_mapper`
- `update_vdj_pad_document`
- `update_vdj_settings`

- [x] **Step 2: Remove `.ok()` from critical backups**

Every backup failure in DB/resource mutation paths must return `Err(...)`.

- [x] **Step 3: Preserve quick backup only if explicitly useful**

If keeping `database.xml.bak`, create it through the same helper or return a clear error when it fails.

- [x] **Step 4: Verify**

Run:

```powershell
cargo test
cargo check
```

Expected: pass.

---

### Task 4: Structured Tag Update API

**Files:**

- Modify: `src-tauri/src/commands/database.rs`
- Modify: `src/lib/api.ts`
- Modify: `src/components/SongTable.tsx`
- Modify: `src/pages/BatchOperations.tsx`

- [x] **Step 1: Add Rust payload structs**

Add:

```rust
#[derive(serde::Deserialize)]
pub struct UpdateSongTagsRequest {
    pub vdj_folder: String,
    pub index: usize,
    pub update: SongUpdate,
}
```

Then refactor command arguments so `update_song_tags` receives one payload object.

- [x] **Step 2: Adjust TypeScript wrapper**

Change `updateSongTags(vdjFolder, index, tags)` to invoke:

```ts
return invoke<void>("update_song_tags", {
  request: { vdjFolder, index, update: { index, ...tags } },
});
```

Use the actual Tauri argument shape required by the Rust command after implementation.

- [x] **Step 3: Verify current callers**

Check:

- inline edit;
- stars;
- color;
- batch tag;
- any future direct caller found by `Select-String`.

- [x] **Step 4: Verify**

Run:

```powershell
bun run check
cargo clippy --all-targets --all-features -- -D warnings
```

Expected: the `too_many_arguments` Clippy failure is gone.

---

### Task 5: Clippy-Clean Waveform Loops

**Files:**

- Modify: `src-tauri/src/commands/waveforms.rs`

- [x] **Step 1: Refactor `input` fill loop**

Use `input.iter_mut().enumerate().take(FFT_SIZE)` and write through the mutable item instead of indexing `input[sample_index]`.

- [x] **Step 2: Refactor band loop**

Use `bands.iter_mut().enumerate().take(band_count)` and write through the mutable band item.

- [x] **Step 3: Refactor spectrum range loop**

Use `spectrum.iter().take(end_bin).skip(start_bin)` and avoid indexing.

- [x] **Step 4: Verify**

Run:

```powershell
cargo clippy --all-targets --all-features -- -D warnings
cargo check
```

Expected: no Clippy warnings.

---

### Task 6: Inline Edit Error UX

**Files:**

- Modify: `src/components/SongTable.tsx`

- [x] **Step 1: Use app error state**

Destructure `setError` from `useApp()`.

- [x] **Step 2: Replace silent console-only catches**

In tag, stars and color update catches:

- keep a concise `console.error` only if useful during dev;
- call `setError(String(err))`;
- do not patch local state on failure;
- keep or restore edit state so the user can retry.

- [x] **Step 3: Verify**

Run:

```powershell
bun run check
bun run build
```

Expected: pass.

---

### Task 7: CI

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

- [x] **Step 1: Add workflow**

Workflow should run on pull requests and pushes:

```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  check:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - uses: dtolnay/rust-toolchain@stable
      - run: bun install --frozen-lockfile
      - run: bun run check
      - run: bun run build
      - run: cargo check
        working-directory: src-tauri
      - run: cargo test
        working-directory: src-tauri
      - run: cargo clippy --all-targets --all-features -- -D warnings
        working-directory: src-tauri
```

- [x] **Step 2: Verify locally**

Run:

```powershell
bun run check
bun run build
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

Expected: all pass before relying on CI.

---

## Stop Rule

The hardening slice is done when:

- `bun run check` passes;
- `bun run build` passes;
- `cargo check` passes;
- `cargo test` passes;
- `cargo clippy --all-targets --all-features -- -D warnings` passes;
- `bun run tauri build` passes;
- `docs/audit-2026-04-25.md` remains aligned with actual behavior.
