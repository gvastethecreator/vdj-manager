# Arquitectura — VDJ Database Manager

Actualizado: 2026-07-15.

## Visión general

VDJ Manager es una aplicación de escritorio **Tauri 2**. El backend Rust conserva la autoridad sobre lectura, validación y mutaciones de Recursos VirtualDJ; el frontend React organiza esas capacidades en workspaces operativos.

```text
React 19 / Vite 8 / Tailwind 4
  NavigationState + AppContext
  workspaces + feedback accesible
              │
              │ RuntimeServices
              ▼
  Tauri adapter                 Demo adapter
  IPC/dialog/asset URLs         fixtures deterministas in-memory
              │
              ▼
Rust / Tauri commands
  parser patch-in-place + journal + recovery + recursos
```

El rediseño de workspaces cambió sólo la organización frontend. No modificó comandos Rust, formatos XML ni contratos de mutación.

## Navegación y shell

`App.tsx` mantiene un `NavigationState` con `workspace` y `section`:

- `dashboard`
- `library`: Canciones, Playlists e History dentro del Browser
- `integrity`: Faltantes, Tracks movidos, Duplicados y Huérfanos
- `operations`: Batch
- `resources`: Configuración, Pads y Mappers
- `home`: entrada sin shell cuando aún no corresponde operar una biblioteca

Los valores legacy de `Page` existen sólo como adaptadores para aliases visuales `?demo&page=`. Las vistas trabajan con `NavigationState`; no existe `page/setPage` como contrato UI.

El shell usa un rail de 72 px. La expansión es overlay y no cambia la geometría del workspace. El header muestra biblioteca, tracks, recarga y seguridad de escritura. Integridad de archivos y seguridad de mutaciones son estados separados.

## Borde de runtime

`RuntimeServices` es la única interfaz consumida por las vistas para operaciones Tauri:

- el adaptador real delega en `lib/api.ts`, diálogos y URLs de assets;
- el adaptador demo no invoca Tauri ni toca archivos;
- el demo conserva escrituras de settings, mapper, pad y raw dentro de su instancia para que save/reload sea verificable sin I/O real;
- los fixtures `healthy`, `problem`, `unverified`, `loading`, `error`, `empty`, `dense` y `first-run`, más `recovery`, `recovery=manual` y `recovery=error`, producen estados reproducibles;
- recovery demo vive dentro de la instancia del adaptador, por lo que resume/rollback puede terminar en `clean` sin reaparecer al recargar.

Los imports `@tauri-apps/*` quedan restringidos a `lib/api.ts` y `lib/runtimeServices.ts`.

## Estado frontend

`AppContext` conserva:

- biblioteca activa, canciones, stats y loading;
- `NavigationState` y scope de error actual;
- `RuntimeServices`;
- `UiError` contextual con resumen, detalle opt-in y una recuperación separada ligada al mismo scope;
- tema `dark | light`;
- carpetas externas de música;
- recovery, bloqueo de mutaciones y resultados;
- snapshot de integridad (`null | 0 | >0`) y resultados compartidos por biblioteca activa, para no convertir “sin verificar” en cero ni perder scans al cambiar de tab;
- handoff de ruta entre Faltantes y Reconciliación.

Un blocker temporal protege drafts del Estudio de recursos antes de navegar, recargar o cambiar biblioteca. Los editores también protegen el cambio de archivo o modo cuando corresponde.

## Workspaces frontend

### Dashboard

La cola de atención deriva de `IntegritySnapshot`. Recovery y referencias rotas tienen prioridad; scans no ejecutados muestran `Sin verificar`. Las métricas son secundarias y no disparan I/O al renderizar.

### Browser de Biblioteca

`Songs.tsx` es el owner del Browser unificado. Presenta árbol, `SongTable` virtualizada y detalle contextual:

- `@tanstack/react-virtual` mantiene el DOM acotado;
- `PaneLayout` persiste en `vdj-layout-v2`, valida payload y aplica clamping;
- los splitters soportan pointer, flechas, Home/End y reset con Enter; sus límites ARIA son los límites efectivos disponibles;
- desde 1200 px se muestran tres paneles; bajo 1200 el detalle pasa a drawer;
- inline edit, rating, color, waveform y backend tipado se preservan.

### Resolver problemas

`IntegrityWorkspace` agrupa diagnóstico sin cambiar ownership:

- `MissingFiles` verifica y transfiere una ruta exacta;
- `RelinkTracks` busca candidatos y confirma reconciliación;
- `Duplicates` conserva remoción `db_only` / `trash_then_unindex` y movimiento seguro;
- `OrphanFiles` compara disco y catálogo.

### Operaciones

`BatchOperations` mantiene selección, preview y reporte por ítem. Cada preview queda ligado a una firma de acción, selección y parámetros, y las respuestas asíncronas obsoletas se descartan. Ejecutar permanece deshabilitado sin una firma vigente. El árbol de destino es colapsable y toda ejecución pasa por `ConfirmDialog` y respeta recovery.

### Estudio de recursos

`ResourceStudio` agrupa `Configs`, `Pads` y `Mappers` con tabs, feedback local y action bar dirty/save/revert. Cada editor conserva su API pública especializada; raw queda como fallback avanzado.

## Feedback y accesibilidad

- `Dialog`/`ConfirmDialog`: Cancelar recibe foco, Tab/Shift+Tab quedan contenidos, Escape cierra cuando no está busy, el fondo queda inert y el foco vuelve al origen.
- `UiError`: scope por sección, resumen accionable, detalle desplegable y retry que repite la operación fallida; respuestas tardías de otro scope se descartan.
- Tipografía base 14 px; 13 px para tablas y 12 px para metadata.
- Targets densos interactivos miden al menos 24×24 px y tienen nombre accesible.
- Contenido esencial no parte invisible. `prefers-reduced-motion` reduce animación a 1 ms/una iteración.
- Los únicos temas son oscuro y claro; valores heredados distintos de `light` migran a `dark`.

La ventana Tauri tiene mínimo 1180×720. El documento no hace scroll horizontal; tablas/workbenches son dueños de su scroll interno.

## Backend Rust

### Módulos

- `database/models.rs`: structs serde del schema VirtualDJ.
- `database/parser.rs`: parser y writers patch-in-place/atómicos.
- `commands/database.rs`: load/stats, tags y remoción explícita.
- `commands/files.rs`: verify, scan, relink, rename, move, orphans y planners.
- `commands/recovery.rs`: estado y acciones de recovery.
- `mutation_journal.rs`: generaciones append-only, leases y state machine.
- `commands/duplicates.rs`: detección por nombre/tamaño/hash.
- `commands/playlists.rs`: M3U/M3U8/formatos VirtualDJ.
- `commands/configs.rs`: settings, mappers y pads.
- `commands/waveforms.rs`: peaks + FFT y cache.

### Invariantes de seguridad

- `database.xml` se modifica patch-in-place con backup, validación, relectura optimista y commit atómico.
- La identidad de escritura es `originalFilePath`, no el índice renderizado.
- Rename/move no reemplazan destinos y usan journal/lease por biblioteca.
- Cross-drive es copy + delete por ítem y deja revisión manual ante incertidumbre.
- Recovery pendiente permite lectura/diagnóstico y pausa nuevas mutaciones críticas.
- CSP limita recursos del WebView a orígenes propios y esquemas autorizados.

## Persistencia local

- `vdj-theme`: `dark | light` con migración.
- `vdj-layout-v2`: anchos versionados del Browser.
- preferencias de columnas versionadas por tabla.
- última biblioteca y carpetas de música.

El journal de mutaciones vive en app-data; nunca se escribe dentro de música ni de la carpeta VirtualDJ como parte de la UI.

## Verificación

El harness DOM usa Bun + Happy DOM + Testing Library. El browser demo cubre los viewports 1180×720, 1280×800 y 1440×900. Las suites Rust usan fixtures y directorios temporales. Ver `docs/ui/view-contracts.md` y `docs/implementation-status.md` para aceptación y evidencia.
