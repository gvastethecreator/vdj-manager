# Implementation status

Updated: 2026-08-14.

## Current product surface

The operations-center workspace is active without a feature flag:

- compact shell with separate write-safety and library-integrity status;
- dashboard with a prioritized attention queue and `Not checked` for missing scans;
- unified songs and playlists browser with three panels, detail drawer, and persisted layout;
- shared integrity results with a missing-file to reconciliation handoff;
- full-width batch operations with a required current preview and per-item report;
- settings, pads, and mappers studio with dirty/save/revert protection;
- dark and light themes, scoped errors, accessible dialogs, and an in-memory demo.

The review completed with no known blocker or P1 issue. Earlier race, retry, keyboard, layout-clamping, result-loss, and technical error-boundary defects were repaired before that closeout.

## Preserved mutation contracts

1. Patch-in-place tag changes use `originalFilePath` and preserve unknown XML.
2. Path reconciliation uses typed candidates and collision detection.
3. Literal rename uses a journal, no-clobber behavior, and rollback.
4. Batch move uses a planner and per-item results, including cross-drive copy/delete.
5. Removal is explicit: `db_only` or `trash_then_unindex`.
6. Recovery remains visible; reads stay available while mutations pause.

## Verification snapshot

This maintenance pass verifies the current checkout with the commands below. Historical evidence from previous release builds is not treated as proof of the current tree.

```powershell
bun run verify
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

The deterministic demo supports real-browser review at 1180×720, 1280×800, and 1440×900. GitHub Pages uses the same in-memory adapter and never accesses local files.

## Invariants

- The demo never invokes Tauri or touches local files.
- The frontend cannot serialize the complete `database.xml` document.
- Writers stop if structure cannot be preserved, XML cannot be validated, or the source changed concurrently.
- Rename and move do not replace destinations and hold a per-library lease.
- The journal lives outside the VirtualDJ and music folders.
- Rust write tests use fixtures and temporary directories.

Visual states can be opened with URLs such as:

```text
http://127.0.0.1:3000/?demo&page=dashboard&state=problem
http://127.0.0.1:3000/?demo&page=songs&state=dense
http://127.0.0.1:3000/?demo&page=dashboard&recovery=manual
```
