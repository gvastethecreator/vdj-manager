# VDJ Database Manager

Aplicación de escritorio para analizar, gestionar y limpiar la base de datos XML de **VirtualDJ 8+**.

Construida con **Tauri 2** (Rust) + **React 19** + **Vite 8** + **Tailwind CSS 4**.

## Stack

| Capa | Tecnología |
| ---- | ---------- |
| Backend | Rust · Tauri 2 · quick-xml · serde · walkdir · md-5 · symphonia · realfft |
| Frontend | React 19 · TypeScript 5 · Vite 8 · Tailwind CSS 4 · GSAP 3 · lucide-react |
| Virtualización | @tanstack/react-virtual |
| Package manager | Bun |
| Lint | OXC (oxlint) |

## Requisitos

- [Bun](https://bun.sh/) ≥ 1.x
- [Rust](https://www.rust-lang.org/) ≥ 1.75 (con `cargo`)
- Sistema operativo: Windows (la app trabaja con rutas Windows de VirtualDJ)

## Inicio rápido

```bash
# Instalar dependencias frontend
bun install

# Desarrollo con Tauri (abre la ventana nativa)
bun run tauri dev

# Solo frontend (sin backend Rust)
bun run dev
```

## Scripts disponibles

| Script               | Descripción                                  |
| -------------------- | -------------------------------------------- |
| `bun run dev`        | Servidor de desarrollo Vite (puerto 3000)    |
| `bun run build`      | TypeScript check + build producción          |
| `bun run typecheck`  | Solo verificación de tipos (`tsc --noEmit`)  |
| `bun run lint`       | Lint + autofix con OXC (oxlint)              |
| `bun run check`      | Typecheck + lint sin fix (CI-friendly)       |
| `bun run tauri dev`  | Desarrollo Tauri completo                    |
| `bun run tauri build`| Build del binario nativo                     |

## Estructura del proyecto

```text
src/                        # Frontend React
├── components/             # Componentes reutilizables
│   ├── ErrorBoundary.tsx   # Captura errores de render
│   ├── FolderTree.tsx      # Árbol de carpetas lazy-load
│   ├── Layout.tsx          # Shell principal (sidebar + content)
│   ├── Sidebar.tsx         # Navegación + selector de tema
│   ├── SongTable.tsx       # Tabla virtualizada (30 columnas)
│   ├── SongDetailsCard.tsx # Ficha detallada de la canción seleccionada
│   ├── StatsCard.tsx       # Card compacta de estadística
│   ├── TreeFileNavigator.tsx # Árbol reutilizable para playlists/pads/mappers
│   └── WaveformPreview.tsx # Miniatura SVG de forma de onda
├── pages/                  # Vistas/páginas principales
│   ├── Home.tsx            # Landing: selección de carpeta
│   ├── Dashboard.tsx       # Estadísticas y gráficos
│   ├── Songs.tsx           # Biblioteca con filtros
│   ├── Playlists.tsx       # Playlists e historial en árbol
│   ├── Duplicates.tsx      # Detección duplicados
│   ├── MissingFiles.tsx    # Verificación y relocación
│   ├── OrphanFiles.tsx     # Archivos no registrados
│   ├── BatchOperations.tsx # Operaciones en lote
│   ├── Configs.tsx         # Editor curado de settings.xml
│   ├── Pads.tsx            # Editor estructurado de pads (.vdjpad)
│   └── Mappers.tsx         # Editor estructurado de mappers (.vdjmap)
├── lib/                    # Utilidades
│   ├── api.ts              # Wrappers IPC Tauri
│   ├── animations.ts       # Presets GSAP
│   └── logger.ts           # Logger con prefijo [VDJ]
├── types/database.ts       # Interfaces TypeScript
├── App.tsx                 # Root + contexto global
├── main.tsx                # Entry point React
└── index.css               # Tailwind + design tokens + temas

src-tauri/                  # Backend Rust
└── src/
    ├── lib.rs              # Tauri builder + command registry
    ├── database/           # XML models + parser (quick-xml)
    └── commands/           # Handlers IPC
        ├── database.rs     # Load, save, update, delete
        ├── files.rs        # Verify, scan, rename, move, orphans
        ├── duplicates.rs   # Detección por nombre/tamaño/hash
        ├── playlists.rs    # Parsing M3U/M3U8/VDJ playlists
        ├── configs.rs      # Settings.xml + recursos VDJ editables
        └── waveforms.rs    # Extracción peaks + FFT, cache 3 niveles
```

## Funcionalidades

- **Dashboard** — 8 cards de estadísticas, top géneros/artistas, distribución por año, calidad
- **Canciones** — Tabla virtualizada con 30+ columnas configurables, carpetas externas, waveform con cue markers y ficha detallada de la canción seleccionada
- **Playlists** — Navegación en árbol por `Playlists/`, incluyendo historial y soporte para `.m3u`, `.m3u8`, `.vdjplaylist` y `.vdjlist`
- **Duplicados** — Detección por nombre normalizado, tamaño exacto y hash parcial MD5 (64 KB)
- **Archivos Faltantes** — Verificación existencia/tamaño, búsqueda fuzzy, relocación
- **Archivos Huérfanos** — Comparación disco vs BD para encontrar archivos no registrados
- **Operaciones en Lote** — Mover, renombrar con patrón y editar tags con dry-run; las ediciones batch escriben `database.xml` una sola vez
- **Configuración** — Vista curada de `settings.xml` basada en opciones relevantes de VirtualDJ
- **Pads** — Editor estructurado de documentos `.vdjpad` con árbol XML editable
- **Mappers** — Editor estructurado de `.vdjmap` con metadata y bindings editables
- **Waveform** — Extracción de peaks + FFT con cache de 3 niveles (memoria → disco → decode) y límite de concurrencia para no bloquear otras tareas
- **7 Temas** — dark, light, blue, teal, green, amber, red (Catppuccin-inspired)

## Notas técnicas

### BPM

VirtualDJ almacena el BPM como período (`1/bpm`) en `Scan/@Bpm`. La conversión es:

```text
BPM_real = 60 / Scan_Bpm_value
```

### Backups

Las escrituras sobre `database.xml` crean un backup timestamped `database_<millis>.xml.bak` y además validan integridad antes y después del guardado.

Los recursos editables de VirtualDJ (por ejemplo `settings.xml`, `.vdjmap`, `.vdjpad`) también generan backup antes de sobreescribirse.

### CSP (Content Security Policy)

El WebView está protegido con una política restrictiva que solo permite recursos propios y `data:`/`asset:`/`tauri:` para imágenes.

### Error Boundaries

Un `<ErrorBoundary>` envuelve la app a nivel global y por página, previniendo que un error de render tumbe toda la aplicación.

### Movimiento cross-drive

Cuando un `rename()` falla (diferente unidad), la app hace `copy()` + `remove_file()` como fallback.

## Tareas VS Code

El workspace incluye tareas predefinidas (`.vscode/tasks.json`):

- `🚀 dev (Tauri)` — Desarrollo completo
- `🔨 build (Tauri)` — Build binario
- `🌐 dev (Vite only)` — Solo frontend
- `🧹 lint` — Linting OXC
- `🔍 typecheck` — Verificación de tipos
- `✅ check` — Typecheck + lint (CI-friendly)
- `🦀 cargo check` — Check Rust

## Licencia

Proyecto privado.
