# Arquitectura — VDJ Database Manager

## Visión general

La aplicación sigue un modelo **Tauri 2**: un backend Rust que expone comandos IPC
y un frontend React que los invoca via `@tauri-apps/api/core`.

```text
┌──────────────────────────────────────────┐
│              Frontend (WebView)          │
│  React 19 + Vite 8 + Tailwind CSS 4     │
│  ┌──────────┬──────────┬──────────┐     │
│  │ Pages    │Components│ Lib      │     │
│  │ (views)  │(reusable)│(api,anim)│     │
│  └──────────┴──────────┴──────────┘     │
│              invoke("cmd", args)         │
├──────────────────────────────────────────┤
│              Backend (Rust / Tauri)       │
│  ┌──────────┬──────────┬──────────┐     │
│  │ commands/│ database/│ models   │     │
│  │ handlers │ parser   │ (serde)  │     │
│  └──────────┴──────────┴──────────┘     │
│              quick-xml + walkdir         │
└──────────────────────────────────────────┘
```

## Flujo de datos

1. El usuario selecciona una carpeta de VirtualDJ.
2. El frontend llama `invoke("load_database", { vdjFolder })`.
3. Rust parsea `database.xml` con `quick-xml` y devuelve `Vec<SongSummary>`.
4. En paralelo, `get_database_stats` calcula estadísticas agregadas.
5. El estado global (`AppContext`) se actualiza y la UI se renderiza.

El mismo contexto también conserva:

- la página actual para recargas coherentes (`reload()` preserva vista)
- carpetas externas de música persistidas en `localStorage`
- parches locales de canciones para evitar recargas globales en ediciones inline

## Backend (Rust)

### Módulos

- **`database/models.rs`** — Structs serde que mapean el XML schema de VDJ.
- **`database/parser.rs`** — `parse_database()` y `write_database()` con `quick-xml`.
- **`commands/database.rs`** — Load, save, update tags, delete songs.
- **`commands/files.rs`** — Verify, scan, rename, move, find orphans, relocate, dry-run.
- **`commands/duplicates.rs`** — Detección de duplicados por nombre/tamaño/hash (MD5 64 KB).
- **`commands/playlists.rs`** — Parsing de playlists M3U/M3U8/VDJ (`.vdjplaylist`, `.vdjlist`).
- **`commands/configs.rs`** — Lectura/escritura curada de `settings.xml`, mappers `.vdjmap` y pads `.vdjpad`.
- **`commands/waveforms.rs`** — Extracción de peaks + FFT (symphonia + realfft), cache de 3 niveles (memoria → disco → decode).

### Seguridad

- Toda escritura crítica crea backup antes de modificar; `database.xml` además se reparsea y revalida tras el guardado.
- CSP habilitado en el WebView: solo recursos propios + `data:`/`asset:`/`tauri:` para imágenes.
- El movimiento cross-drive usa copy + delete como fallback.
- Los índices se validan contra el tamaño del vector.
- La extracción de waveforms limita la concurrencia en backend para no saturar CPU y dejar libres otros procesos de metadata/tagging.

## Frontend (React)

### Estado global

`App.tsx` mantiene un `AppContext` con:

- `vdjFolder`, `songs`, `stats`, `loading`, `error`, `page`
- Métodos: `setPage`, `selectFolder`, `loadFromFolder`, `reload`, `patchSong`, `setError`

### Error Boundaries

`<ErrorBoundary>` (class component) envuelve:

- La app completa en `main.tsx` (crash global)
- Cada página en `App.tsx` (degradación parcial con botón "Reintentar")

### Routing

Routing local por estado (`page: Page`), sin react-router.
En la página `home`, se renderiza sin `Layout`; el resto usa `Layout` (sidebar + main).

Páginas principales activas:

- `Dashboard`
- `Songs`
- `Playlists`
- `Duplicates`
- `MissingFiles`
- `OrphanFiles`
- `BatchOperations`
- `Configs`
- `Pads`
- `Mappers`

### Tabla virtualizada

`SongTable` usa `@tanstack/react-virtual` para renderizar eficientemente 30+ columnas con scroll virtualizado.

Las ediciones inline de texto, rating y color escriben en backend y luego parchean la canción en memoria para evitar un `reload()` global.

### Editores estructurados de recursos VirtualDJ

- `Configs.tsx` trabaja sobre un subconjunto curado de `settings.xml`.
- `Mappers.tsx` interpreta `.vdjmap` como documento estructurado (`<mapper>` + bindings `<map ... />`).
- `Pads.tsx` usa un árbol XML genérico para editar `.vdjpad` sin degradarlo a editor de texto plano.

### Playlists y biblioteca extendida

- `Songs.tsx` combina la base de datos con carpetas externas configuradas por el usuario.
- `Playlists.tsx` presenta playlists e historial como árbol de carpetas y resuelve entradas contra la librería o como canciones externas sintéticas.

### Animaciones

GSAP 3 con `gsap.context()` y cleanup automático en `useEffect`.
Presets compartidos en `lib/animations.ts`.

### Temas

7 temas definidos en `index.css` via CSS custom properties con selector `data-theme`:
dark, light, blue, teal, green, amber, red (paleta Catppuccin-inspired).

### Design tokens

Definidos en `index.css` via `@theme` de Tailwind CSS 4.
