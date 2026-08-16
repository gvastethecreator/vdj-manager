# View contracts

Status: verified against the deterministic demo and a real Chromium browser on 2026-08-14.

These are product acceptance contracts, not a component inventory. Every view must preserve visible focus, logical order, English copy, local states, and explicit overflow ownership.

## Global contract

- The navigation rail is 72 px wide and keeps an accessible name while collapsed. It expands as an overlay after an explicit action.
- The header shows the active library, track count, reload action, and a disclosure for mutation safety. File integrity and write safety remain separate states.
- Body and controls use 14 px text, dense tables use 13 px, and 12 px is reserved for secondary metadata.
- Essential content is visible from the first frame.
- Dark and light are the only themes. Legacy values migrate to dark.
- Errors show an actionable summary, optional detail, and a recovery action. Raw exception text is never the headline.
- Destructive dialogs initially focus Cancel, contain Tab and Shift+Tab, close with Escape when safe, make the background inert, restore focus, and prevent repeated confirmation while busy.
- The supported native window minimum is 1180×720. Mobile is not a native product target.

## Home

| Contract | Definition |
| --- | --- |
| Purpose | Enter a known VirtualDJ library without overstating capabilities. |
| Hierarchy | Resume last library, choose folder, then concise safety context. |
| States | First run, last library available, loading, and recoverable error. |
| Primary action | `Resume library` or `Choose folder`. |
| Keyboard | Primary action, alternative, then help; recovery receives focus when required. |
| Viewport | One composition without document scrolling at 1180×720. |

## Dashboard

| Contract | Definition |
| --- | --- |
| Purpose | Decide what needs attention and open the next safe action. |
| Hierarchy | Attention queue, next action, compact metrics, then context. |
| States | Healthy, issues, recovery, local error, and checks not run. |
| Data | `Not checked` remains distinct from zero; no invented counts. |
| Keyboard | Each attention row is a stable destination; focused rows never reorder. |
| Viewport | The queue and next action fit in the first supported viewport. |

## Library

| Contract | Definition |
| --- | --- |
| Purpose | Explore the collection, playlists, and history without leaving the library browser. |
| Hierarchy | Track table first, source tree left, contextual detail right. |
| States | Empty, dense, long paths, playlist, discovered file, selection, and local error. |
| Keyboard | Sources, rows, inline editing, and splitters are operable; layout reset is accessible. |
| Viewport | Three panels at 1200 px and above; detail drawer below 1200 px; all limits clamp. |
| Persistence | `vdj-layout-v2`; invalid data returns to defaults. |

## Resolve issues

| Contract | Definition |
| --- | --- |
| Purpose | Diagnose and repair integrity without confusing diagnosis with mutation. |
| Sections | Missing files, moved tracks, duplicates, and orphans. |
| Hierarchy | Scope and last check, results, evidence or candidates, then action. |
| States | Before, running, complete, explained empty, error, and recovery-blocked. |
| Primary action | A missing result opens reconciliation with the same selected path. |
| Keyboard | Semantic tabs, result evidence, and destructive confirmations are accessible. |

## Operations

| Contract | Definition |
| --- | --- |
| Purpose | Prepare, review, and execute batch changes with per-item results. |
| Hierarchy | Scope and selection, intent, preview, execution, then report. |
| States | No selection, ready, preview, running, partial, error, and recovery-blocked. |
| Primary action | `Preview`; execution requires a current preview signature. |
| Viewport | Full-width workspace; the table owns its horizontal overflow. |

## Resource studio

| Contract | Definition |
| --- | --- |
| Purpose | Edit settings, pads, and mappers with explicit document state. |
| Hierarchy | Resource and file, specialized editor, then dirty/save/revert status. |
| States | Loading, empty, selected, dirty, saving, saved, local error, and advanced raw mode. |
| Primary action | Save or revert the active resource; tab changes protect dirty work. |
| Keyboard | Tabs, tree, editor, Save, and Revert follow a logical order. |

## Recovery

| Contract | Definition |
| --- | --- |
| Purpose | Resolve an interrupted mutation before enabling new writes. |
| Hierarchy | State and severity, effect, recommended action, then journal detail. |
| Presence | Full-width only for pending, manual-review, or error states; clean remains compact. |
| Confirmation | Accessible dialog, Cancel focused first, and repeat actions blocked while busy. |

All published README screenshots use `?demo`. No real VirtualDJ or music path is read to create repository evidence.
