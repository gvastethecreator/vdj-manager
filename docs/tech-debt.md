# Technical debt

Updated: 2026-08-14.

There are no known blocker or P1 issues from the workspace redesign. These are follow-up improvements, not hidden release requirements.

## High priority

### Split large surfaces

`SongTable.tsx` still combines virtualization, columns, audio, inline editing, ratings, and colors. `Songs.tsx`, `Pads.tsx`, and `Mappers.tsx` combine loading, navigation, and editing. Extract behavior only behind focused tests and preserve identity by `originalFilePath`.

### Add browser checks to CI

DOM tests cover dialogs, errors, navigation, themes, panels, and keyboard interaction. Real-browser review exists locally, but CI does not yet run a representative matrix for desktop widths, themes, and reduced motion.

### Add safe backend observability

Rust does not yet provide structured logging for load, parse, and mutation operations. Adopt `tracing` or `log` without recording private paths or full XML content.

### Continue mutation hardening

- Isolate the historical full serializer that remains only for fidelity-loss tests.
- Define safe support for inserting tags into self-closing `<Song .../>` entries; the writer currently stops instead.
- Evaluate extreme Windows aliases such as junctions and 8.3 names beyond lexical normalization.
- Decide whether settings, mappers, and pads should use the same recovery gate as `database.xml`.

## Medium priority

- Share request-token handling across integrity, playlists, library load, and batch previews.
- Reduce full reloads after mutations without losing metrics, partial reports, or recovery evidence.
- Add semantic mapper validation and a more specialized pad editor.
- Implement playlist content editing; the browser currently lists, imports, and reads playlists.
- Add automated semantic and contrast checks, then test virtual tables with screen readers.

## Low priority

- Review Rust and JavaScript dependencies and bundle size regularly.
- Consider local opt-in scan timing that never records private paths.
- Evaluate a persistent waveform/result cache with physical-identity invalidation.
