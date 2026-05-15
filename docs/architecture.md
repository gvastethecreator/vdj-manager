# Arquitectura — VDJ Database Manager

## Visión general

La aplicación sigue un modelo **Tauri 2**: un backend Rust que expone comandos IPC
y un frontend React que los invoca via `@tauri-apps/api/core`.

## Estado actual y dirección acordada

Este documento ahora registra dos cosas distintas y complementarias:

- el **estado actual** del código que existe hoy en el repo;
- la **dirección acordada** en la sesión de arquitectura del `2026-05-15`.

Los documentos maestros de esa dirección son:

- `CONTEXT.md`
- `docs/adr/0001-browser-de-biblioteca-como-seam-principal.md`
- `docs/adr/0002-patch-in-place-para-mutaciones-criticas-de-database.md`
- `docs/superpowers/plans/2026-05-15-vdj-manager-slices-criticos.md`

### Dirección acordada del producto

#### Núcleo de biblioteca

- El seam principal del núcleo deja de ser una suma de páginas soberanas y pasa a ser un **Browser de biblioteca**.
- La navegación objetivo del shell debe reflejar una sola entrada principal de **Biblioteca**, con vistas/fuentes internas para:
  - colección general;
  - `Playlists`;
  - `History`.
- `MissingFiles` deja de ser dueño de la corrección: la **Verificación de integridad** diagnostica y la **Reconciliación de rutas** vive en `RelinkTracks`.
- Las **Entradas descubiertas** siguen siendo first-class dentro del browser, pero con tipo propio y **Catalogación explícita** para entrar en `database.xml`.

#### Estudio de recursos

- `Configs`, `Pads` y `Mappers` siguen siendo páginas separadas a nivel de producto.
- Debajo de esa separación comparten invariantes de guardado, backup, validación y contratos backend.
- La API pública debe ser explícita por recurso; los helpers genéricos quedan como implementación interna.
- La política general del estudio es: **editor especializado por defecto + modo raw avanzado como fallback**.

#### Motor de mutaciones críticas

- Las mutaciones críticas sobre `database.xml` deben usar **patch-in-place** sobre el XML original.
- La identidad canónica de escritura es `originalFilePath`, no el índice posicional.
- El matching de rutas debe ser Windows-friendly (normalizado y case-insensitive) sin depender de `canonicalize()` como identidad principal.
- El contrato IPC deja de basarse en `String` humanas y pasa a un **reporte tipado** por operación/ítem.
- La atomicidad acordada para operaciones batch es **por ítem**, no all-or-nothing del lote.
- Si el writer no puede garantizar fidelidad estructural, debe **abortar sin escribir**; no hay fallback automático al serializer legacy.
- El journal persistido vive en app data y queda ligado a una **Biblioteca VirtualDJ** concreta.
- Si existe una **Recuperación de mutación** pendiente, la app permite lectura/diagnóstico, pero bloquea nuevas mutaciones críticas hasta resolverla.

### Qué sigue siendo “estado actual”

- El routing real todavía es state-based por `page: Page`.
- La sidebar todavía expone varias páginas top-level (`Songs`, `Playlists`, `Duplicates`, etc.).
- Muchas mutaciones críticas todavía usan índices posicionales y respuestas stringly-typed.
- `MissingFiles` y `RelinkTracks` todavía comparten parte del territorio funcional.
- `delete_songs`, `rename_file_op` y `move_files_op` todavía no representan el contrato objetivo acordado.

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

La dirección acordada no elimina esta técnica de routing inmediatamente, pero sí cambia su semántica: el shell debe converger hacia una entrada principal de **Biblioteca** que hospede al **Browser de biblioteca**, dejando `Songs` y `Playlists` como vistas transitorias o adaptadores mientras dure la migración.

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

Dirección acordada:

- `Dashboard` permanece como superficie de resumen/observabilidad.
- `Songs` + `Playlists` deben converger hacia el **Browser de biblioteca**.
- `MissingFiles` permanece como diagnóstico; `RelinkTracks` absorbe el ownership de la **Reconciliación de rutas**.
- `Duplicates` y `BatchOperations` siguen como herramientas del núcleo mientras el Browser madura.
- `Configs`, `Pads` y `Mappers` siguen agrupadas bajo el **Estudio de recursos**.

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
