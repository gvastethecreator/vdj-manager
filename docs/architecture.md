# VDJ Manager architecture

Updated: 2026-08-14.

## Overview

VDJ Manager is a Tauri 2 desktop application. Rust owns all VirtualDJ parsing, validation, filesystem access, and mutations. React organizes those capabilities into task-focused workspaces.

```text
React 19 / Vite 8 / Tailwind CSS 4
  navigation + app state + accessible feedback
                 │
                 │ RuntimeServices
                 ▼
  Tauri adapter                 In-memory demo adapter
  IPC/dialog/asset URLs         deterministic fixtures, no local I/O
                 │
                 ▼
Rust / Tauri commands
  patch-in-place XML + journal + recovery + resources
```

The workspace redesign changed frontend organization only. It did not change the Rust command boundary, XML formats, or mutation contracts.

## Navigation and shell

`App.tsx` owns a `NavigationState` with these workspaces:

- `dashboard`: prioritized attention queue and library metrics.
- `library`: songs, playlists, and history in one browser.
- `integrity`: missing files, moved tracks, duplicates, and orphans.
- `operations`: preview-gated batch work.
- `resources`: settings, pads, and mappers.
- `home`: entry screen before a library is active.

Legacy `Page` values remain only as adapters for visual demo URLs. Product views use `NavigationState`.

## Runtime boundary

`RuntimeServices` is the only interface views use for Tauri operations:

- the native adapter delegates to typed IPC, dialogs, and asset URLs;
- the demo adapter never invokes Tauri or accesses local files;
- demo writes remain in memory so save and reload behavior can be tested safely;
- deterministic scenarios cover healthy, problem, unverified, loading, error, empty, dense, first-run, and recovery states.

Imports from `@tauri-apps/*` are restricted to `lib/api.ts` and `lib/runtimeServices.ts`.

## Frontend state

`AppContext` owns the active library, songs, metrics, navigation, scoped errors, runtime services, theme, external music folders, recovery state, mutation locks, and integrity results. It keeps “not checked” distinct from zero and prevents stale asynchronous responses from replacing current state.

A navigation blocker protects dirty resource drafts before navigation, reload, or library changes.

## Workspaces

### Dashboard

The attention queue derives from the integrity snapshot. Recovery and broken references are prioritized. Checks that have not run show `Not checked` instead of zero.

### Library browser

`Songs.tsx` owns the unified browser. `@tanstack/react-virtual` keeps the table DOM bounded. `PaneLayout` validates and clamps persisted panel widths. Splitters support pointer, arrow, Home, End, and Enter controls. At the desktop minimum width, the interface uses three panels; below that width, detail becomes a drawer for the web demo.

### Resolve issues

`IntegrityWorkspace` groups diagnosis without changing ownership. Missing files can hand an exact path to reconciliation, duplicate removal keeps its explicit mode, and orphan checks compare disk and catalog state.

### Operations

`BatchOperations` binds every preview to the current action, selection, and parameters. Execution stays disabled when that signature is stale. Results are reported per item and every destructive action uses confirmation and recovery gates.

### Resource studio

`ResourceStudio` groups settings, pads, and mappers with local feedback and dirty/save/revert controls. Each editor keeps its specialized API; raw XML remains an advanced fallback.

## Accessibility

- Dialogs contain focus, close with Escape when safe, make the background inert, and restore focus.
- Scoped errors expose a short summary, optional details, and a retry for the same operation.
- Dense interactive targets have accessible names and visible focus.
- Essential content is never revealed only on hover.
- Reduced-motion mode removes nonessential animation.
- Dark and light are the only themes.

The Tauri window has a supported minimum of 1180×720. Internal tables and workbenches own their overflow instead of the document.

## Rust backend

- `database/models.rs`: Serde types for the VirtualDJ schema.
- `database/parser.rs`: parser and patch-in-place/atomic writers.
- `commands/database.rs`: load, metrics, tags, and explicit removal.
- `commands/files.rs`: verification, scan, relink, rename, move, orphan checks, and planners.
- `commands/recovery.rs`: recovery state and actions.
- `mutation_journal.rs`: append-only generations, leases, and state machine.
- `commands/duplicates.rs`: name, size, and hash detection.
- `commands/playlists.rs`: M3U, M3U8, and VirtualDJ formats.
- `commands/configs.rs`: settings, mappers, and pads.
- `commands/waveforms.rs`: peaks, FFT, and cache.

## Write-safety invariants

- `database.xml` is patched in place with backup, validation, optimistic reread, and atomic commit.
- Write identity is `originalFilePath`, never a rendered row index.
- Rename and move never replace a destination and use a per-library journal and lease.
- Cross-drive moves are journaled copy/delete operations and stop for manual review when uncertain.
- Pending recovery allows reading and diagnosis but blocks new critical mutations.
- The WebView CSP limits content to application-owned sources and approved schemes.

The mutation journal lives in application data. VDJ Manager never stores it in the VirtualDJ or music folders.
