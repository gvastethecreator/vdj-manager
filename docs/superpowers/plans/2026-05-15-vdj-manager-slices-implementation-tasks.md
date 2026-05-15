# VDJ Manager — task pack ejecutable para los slices críticos

> Este documento traduce el plan de slices a tareas implementables por otro agente sin tener que reabrir toda la conversación original. Su fuente de verdad es operativa, no histórica.

## Punto de entrada

Si un agente nuevo toma este trabajo, el orden mínimo de lectura es:

1. este archivo;
2. `CONTEXT.md`;
3. `docs/adr/0001-browser-de-biblioteca-como-seam-principal.md`;
4. `docs/adr/0002-patch-in-place-para-mutaciones-criticas-de-database.md`.

El resto de los documentos (`docs/architecture.md` y `docs/superpowers/plans/2026-05-15-vdj-manager-slices-criticos.md`) sirven como contexto ampliado, pero este archivo ya contiene las instrucciones necesarias para implementar.

## Reglas compartidas que no deben relitigarse

- Usar el vocabulario de `CONTEXT.md`.
- Las mutaciones críticas sobre `database.xml` no pueden depender de índices de UI como identidad canónica.
- La identidad de escritura y matching debe converger a `originalFilePath` con matching Windows-friendly y case-insensitive.
- No introducir fallback automático al serializer legacy si el nuevo writer no puede garantizar fidelidad estructural.
- Las respuestas IPC deben converger a resultados tipados; evitar `Vec<String>` y `Result<T, String>` como contrato final de producto cuando el slice toca mutaciones críticas.
- La atomicidad batch acordada es por ítem.
- Mientras el Browser de biblioteca no exista como seam completo, el routing state-based actual se conserva; no introducir `react-router` para resolver estos slices.
- Cuando una pantalla actual no sea el owner correcto del flujo, migrar el ownership sin intentar rediseñar todo el shell en el mismo slice.
- Si un slice obliga a crear tipos/helpers compartidos nuevos, hacerlo; pero no abrir una “gran arquitectura genérica” antes de demostrar el primer caso vertical.

## Estado actual confirmado del código

### Backend

- `src-tauri/src/database/parser.rs` todavía serializa el documento completo con `quick_xml::se::to_string`; hoy eso sigue perdiendo atributos XML desconocidos.
- `src-tauri/src/commands/database.rs::update_song_tags` recibe `UpdateSongTagsRequest`, pero todavía escribe por `index`.
- `src-tauri/src/commands/database.rs::delete_songs` también trabaja por índices y devuelve `Vec<String>`.
- `src-tauri/src/commands/files.rs::rename_file_op`, `move_files_op` y `relocate_file` trabajan con índices o strings ad hoc y devuelven strings humanas.
- `src-tauri/src/safety.rs` ya ofrece backups y writes atómicos, pero no un journal persistido para mutaciones multi-paso.

### Frontend

- `src/types/database.ts` sigue describiendo `SongSummary.index` como identidad visible primaria.
- `src/lib/api.ts` expone wrappers stringly-typed para rename/move/delete/relocate.
- `src/pages/MissingFiles.tsx` y `src/pages/RelinkTracks.tsx` comparten ownership de la corrección de rutas.
- `src/pages/BatchOperations.tsx` hace rename item por item con un loop del lado cliente.
- `src/pages/Duplicates.tsx` usa `moveFilesOp` y `deleteSongs` como acciones destructivas principales.
- `src/App.tsx` y `src/components/Layout.tsx` son el mejor seam actual para un gate de recovery a nivel shell.
- `src/components/Sidebar.tsx` todavía refleja páginas soberanas; no intentar resolver eso completo en estos tasks.

## Dependencias entre tareas

- **Task 1 / Slice 1** — AFK — bloqueada por: nada.
- **Task 2 / Slice 2** — AFK — bloqueada por: Task 1.
- **Task 3 / Slice 3** — AFK — bloqueada por: Task 1.
- **Task 4 / Slice 4** — AFK — bloqueada por: Task 3.
- **Task 5 / Slice 5** — AFK — bloqueada por: Task 1.
- **Task 6 / Slice 6** — AFK — bloqueada por: Task 3.

## Verificación base esperada al cerrar cualquier task

- `cargo check`
- `bun run typecheck`
- `bun run lint`

Además, cada task lista sus pruebas y verificaciones focalizadas.

## Task 1 — Slice 1: inline tag edit seguro con patch-in-place

### Task 1 — metadata

- Tipo: AFK
- Bloqueada por: ninguna
- Superficie demo inicial: `SongTable` inline edit
- Objetivo del slice: demostrar el primer write-path crítico seguro sobre `database.xml` sin tocar filesystem

### Task 1 — no volver a investigar esto

- `parser::write_database_checked()` hoy serializa todo el documento; eso está documentado por `src-tauri/tests/database_write.rs::current_serializer_drops_unknown_virtualdj_attributes_documented_gap`.
- `update_song_tags()` sigue buscando la canción por `request.index`.
- `SongSummary.index` sigue siendo posicional y útil para render, pero no debe seguir siendo la identidad de escritura.
- El matching Windows-friendly ya existe del lado frontend en `src/lib/pathUtils.ts`; puede usarse como referencia de comportamiento, no como implementación backend.

### Task 1 — qué construir

Construir un flujo vertical donde la edición inline de una canción:

- seleccione el target por `originalFilePath`;
- aplique una mutación acotada a un solo `<Song>` existente dentro de `database.xml`;
- preserve XML desconocido fuera y dentro de ese nodo afectado tanto como el patcher lo permita;
- devuelva un resultado tipado y machine-readable;
- actualice la UI solo después de confirmación de éxito.

No hace falta construir todavía un patcher genérico para cualquier mutación del documento. Un patcher estrecho para “editar tags/infos/comment de un Song existente” es válido para este slice.

### Task 1 — decisiones cerradas

- La identidad canónica es `originalFilePath`, no el índice.
- El writer seguro debe abortar si no puede encontrar o actualizar el `<Song>` objetivo sin degradar la estructura.
- No se permite “fallback silencioso” a reserializar todo el documento.
- El slice puede seguir dejando `save_database()` batch en el camino viejo si eso evita mezclar responsabilidades; lo importante aquí es el camino inline de un solo ítem.

### Task 1 — touchpoints obligatorios

- `src-tauri/src/commands/database.rs`
- `src-tauri/src/database/parser.rs`
- `src-tauri/src/database/models.rs`
- `src/lib/api.ts`
- `src/types/database.ts`
- `src/components/SongTable.tsx`
- `src-tauri/tests/database_write.rs`

### Task 1 — forma mínima recomendada del contrato

No hace falta usar exactamente estos nombres, pero la semántica mínima debe existir.

- Request:
  - `vdjFolder: string`
  - `originalFilePath: string`
  - `update: { ...campos editables... }`
- Result:
  - `status: "completed" | "failed_validation" | "not_found" | "unsafe_to_patch"`
  - `originalFilePath: string`
  - `currentFilePath: string`
  - `updatedFields: string[]`

Si el backend necesita mantener el `index` como hint temporal para encontrar el registro UI correcto, debe ser optativo y no la identidad real de escritura.

### Task 1 — checklist de implementación

1. Crear o extraer un helper backend de normalización/comparación de rutas Windows-friendly.
2. Cambiar el request de update inline para que llegue por `originalFilePath`.
3. Implementar un write-path nuevo para un solo `Song` que trabaje sobre el XML original en modo patch-in-place.
4. Mantener `write_database_checked()` solo como guardrail donde todavía sea honesto usarlo; no reutilizarlo como fallback silencioso de este slice.
5. Hacer que el comando devuelva un resultado tipado y no solo `Result<(), String>`.
6. Ajustar `api.ts` y `SongTable.tsx` para consumir el contrato nuevo.
7. Mantener el parche optimista de UI solo después de éxito confirmado.
8. Actualizar o agregar tests Rust para preservar el XML desconocido y validar el patch por ruta.

### Task 1 — tests mínimos esperados

- En `src-tauri/tests/database_write.rs` o en una suite nueva equivalente:
  - localizar un `Song` por `FilePath` normalizado/case-insensitive;
  - cambiar `Tags/@Title`, `Tags/@Author`, `Infos/@Color` o `Comment`;
  - reparsear el XML resultante;
  - verificar que el campo objetivo cambió;
  - verificar que atributos XML desconocidos documentados por la fixture siguen presentes.
- Del lado TypeScript, si no hay harness DOM cómodo para `SongTable`, al menos cubrir helpers puros extraídos del matching/request mapping.

### Task 1 — verificación focalizada

- `cargo test --test database_write`
- `cargo check`
- `bun run typecheck`
- `bun run lint`

### Task 1 — definition of done

- Inline edit ya no escribe por `index`.
- El path target se resuelve por `originalFilePath` normalizado.
- El writer preserva la fixture de atributos desconocidos para este caso de uso.
- No hay fallback legacy escondido.
- `SongTable` refleja éxito/fallo usando el contrato tipado.

### Task 1 — no hacer en este slice

- journal persistido;
- rollback de filesystem;
- rename/move/delete;
- recovery al arranque.

### Task 1 — trampas conocidas

- No intentar modelar todo el XML en serde para “resolver” la preservación; el problema del slice existe precisamente porque ese enfoque ya se mostró insuficiente.
- No mezclar `||` y `??` sin paréntesis al tocar TypeScript/TSX.
- Si `get_errors` no muestra nada pero TypeScript huele raro, correr `bun run typecheck` igual.

## Task 2 — Slice 2: reconciliación de rutas con identidad estable

### Task 2 — metadata

- Tipo: AFK
- Bloqueada por: Task 1
- Superficie demo inicial: `RelinkTracks`
- Objetivo del slice: separar diagnóstico de corrección y dejar a `RelinkTracks` como owner real del flujo

### Task 2 — no volver a investigar esto

- `MissingFiles.tsx` hoy verifica, busca y corrige.
- `RelinkTracks.tsx` ya tiene la UX más rica y debe ser el owner correcto.
- `find_similar_files()` ya concentra bastante scoring backend, pero la UI vuelve a reordenar candidatos con `scoreCandidate()`.
- `relocate_file()` hoy actualiza por `old_path == song.file_path` exacto y devuelve `Result<(), String>`.

### Task 2 — qué construir

Construir un flujo donde:

- `MissingFiles` se quede como **Verificación de integridad**;
- `RelinkTracks` sea dueño de la **Reconciliación de rutas**;
- el scoring de candidatos viva en backend y llegue estructurado;
- la confirmación inicial del slice sea single-item, explícita y tipada.

### Task 2 — decisiones cerradas

- El flujo de corrección debe identificar la entrada por `originalFilePath`.
- La reconciliación solo cambia ruta y metadata física derivable del archivo real, por ejemplo `file_size`.
- Si el path destino ya pertenece a otra entrada catalogada, se aborta con una **Colisión de referencia** tipada.
- `Auto lote` no es la verdad del dominio en este slice; puede quedar como helper secundario o posponerse.

### Task 2 — touchpoints obligatorios

- `src/pages/MissingFiles.tsx`
- `src/pages/RelinkTracks.tsx`
- `src/lib/api.ts`
- `src/types/database.ts`
- `src-tauri/src/commands/files.rs`
- `src/App.tsx` si hace falta pasar estado mínimo entre páginas

### Task 2 — forma mínima recomendada del contrato

- Query de candidatos:
  - `originalFilePath`
  - `candidates: Array<{ path: string; score: number; reasons: string[]; sameExtension: boolean; sameStem: boolean; sameName: boolean; sizeMatch: boolean }>`
- Commit de reconciliación:
  - request por `originalFilePath` + `newFilePath`
  - result con `status: "completed" | "failed_validation" | "reference_collision" | "manual_review_required" | "not_found"`

El backend puede mantener un wrapper de compatibilidad temporal, pero `RelinkTracks` debe consumir la forma estructurada nueva.

### Task 2 — checklist de implementación

1. Introducir un tipo estructurado de candidato o un comando nuevo para candidatos ricos.
2. Mover la autoridad del orden de candidatos al backend; la UI puede decorar, no reescribir la verdad del score.
3. Cambiar `relocate_file()` a identidad por `originalFilePath` con matching Windows-friendly.
4. Validar colisión de referencia antes del commit.
5. Actualizar `RelinkTracks` para usar el contrato tipado nuevo.
6. Reducir `MissingFiles` a diagnóstico + CTA hacia `RelinkTracks`.
7. Si hace falta pasar foco/seed entre páginas, agregar un estado mínimo en `AppContext`; no introducir routing nuevo.
8. Ajustar la UI para que el flujo principal sea single-item y explícito.

### Task 2 — tests mínimos esperados

- Backend:
  - match por nombre/stem/extensión/tamaño;
  - colisión de referencia detectada;
  - actualización de `file_size` al confirmar una ruta nueva;
  - matching case-insensitive de `originalFilePath`.
- Frontend o helper puro:
  - merge/dedupe de candidatos sin perder el orden del backend;
  - navegación de `MissingFiles` al owner correcto sin volver a corregir desde la pantalla diagnóstica.

### Task 2 — verificación focalizada

- `cargo check`
- `bun run typecheck`
- `bun run lint`

### Task 2 — definition of done

- `MissingFiles` ya no es owner del flujo correctivo.
- `RelinkTracks` consume resultados tipados y candidatos estructurados.
- La reconciliación se identifica por `originalFilePath`.
- Existe error tipado para **Colisión de referencia**.

### Task 2 — no hacer en este slice

- catalogación explícita de entradas descubiertas;
- recovery por journal;
- batch auto-relink como comportamiento principal.

### Task 2 — trampas conocidas

- No conservar `scoreCandidate()` como orden final si el backend ya devuelve score rico.
- No dejar botones “Auto” en `MissingFiles` como owner residual del flujo.

## Task 3 — Slice 3: renombrado de un solo ítem journaled

### Task 3 — metadata

- Tipo: AFK
- Bloqueada por: Task 1
- Superficie demo inicial: `BatchOperations` con selección única
- Objetivo del slice: inaugurar la primera mutación `filesystem + database.xml` con journal persistido y rollback real

### Task 3 — no volver a investigar esto

- `rename_file_op()` trabaja por `song_index` y devuelve el path final como `String`.
- El orden actual es: rename físico primero, write de DB después.
- Si el write de DB falla después del rename físico, la biblioteca puede quedar desalineada.
- `BatchOperations.tsx` ejecuta rename en loop del lado cliente; eso hoy es utilitario, no un engine confiable.

### Task 3 — qué construir

Construir una operación de **Renombrado** de un solo ítem donde el sistema:

- valide el request;
- persista journal antes de tocar disco;
- renombre el archivo;
- commitee el patch seguro de `database.xml`;
- complete o haga rollback físico con estado explícito.

### Task 3 — decisiones cerradas

- Renombrado es cambiar nombre dentro de la misma carpeta; si cambia carpeta, ya no es este slice.
- Si el nombre destino ya existe, devolver `target_conflict`.
- Si el nombre propuesto es inválido, rechazar con error tipado; no sanitizar silenciosamente el input del usuario.
- La primera demo vertical debe restringirse a un solo ítem seleccionado, aunque la pantalla soporte más cosas.

### Task 3 — touchpoints obligatorios

- `src-tauri/src/commands/files.rs`
- `src-tauri/src/safety.rs`
- `src-tauri/src/lib.rs`
- `src/lib/api.ts`
- `src/types/database.ts`
- `src/pages/BatchOperations.tsx`
- `src-tauri/tests/resource_write.rs` o una suite nueva equivalente

### Task 3 — forma mínima recomendada del contrato

- Request:
  - `vdjFolder`
  - `originalFilePath`
  - `newFileName`
- Result:
  - `status: "completed" | "failed_validation" | "target_conflict" | "rolled_back" | "manual_review_required"`
  - `originalFilePath`
  - `newFilePath`
  - `journalId`
  - `phase`

El journal puede empezar como un archivo JSON pequeño en app data. No hace falta resolver todo el recovery al arranque todavía, pero sí persistir el estado suficiente para ese futuro slice.

### Task 3 — checklist de implementación

1. Diseñar y persistir un journal mínimo por biblioteca y por operación.
2. Refactorizar el core del rename para que sea testeable sin depender solo del comando Tauri.
3. Cambiar la identidad del request a `originalFilePath`.
4. Validar nombre inválido, no-op y `target_conflict` antes de tocar disco.
5. Persistir journal `planned`.
6. Ejecutar rename físico.
7. Actualizar `database.xml` con el write-path seguro heredado del Task 1.
8. Si el commit de DB falla, intentar rollback físico y dejar estado explícito.
9. Ajustar `BatchOperations` para que el modo rename exija exactamente un ítem seleccionado en este slice.

### Task 3 — tests mínimos esperados

- rename feliz;
- `target_conflict`;
- nombre inválido;
- rollback físico cuando falla el commit de `database.xml`;
- journal `planned -> completed` o `planned -> rolled_back/manual_review_required`.

Si para forzar el fallo del commit hace falta inyectar un writer o closure testeable, hacerlo. Es mejor esa costura que un test que nunca reproduce la condición importante.

### Task 3 — verificación focalizada

- `cargo check`
- `bun run typecheck`
- `bun run lint`

### Task 3 — definition of done

- Ya existe journal persistido mínimo.
- Rename no trabaja por índice.
- Un fallo del commit de DB no deja un “éxito parcial silencioso”.
- `BatchOperations` puede demostrar el flujo de un solo ítem con resultado tipado.

### Task 3 — no hacer en este slice

- batch rename real;
- políticas de auto-sufijo;
- recovery al arranque.

### Task 3 — trampas conocidas

- No esconder rollback fallido detrás de un `Err(String)` genérico; ese caso debe distinguirse.
- No dejar el loop cliente de `BatchOperations` como motor real de rename si el backend ya tiene journal/rollback.

## Task 4 — Slice 4: batch move con planner por ítem y reporte estructurado

### Task 4 — metadata

- Tipo: AFK
- Bloqueada por: Task 3
- Superficie demo inicial: `BatchOperations`
- Superficie consumidora secundaria: `Duplicates`
- Objetivo del slice: escalar la mutación `filesystem + database.xml` a un batch seguro por ítem

### Task 4 — no volver a investigar esto

- `move_files_op()` hoy mezcla preflight y ejecución.
- Devuelve `Vec<String>`.
- `BatchOperations` y `Duplicates` consumen ese output textual.
- El fallback cross-drive ya existe, pero no está encapsulado como una fase reportable por ítem.

### Task 4 — qué construir

Construir un planner y un ejecutor batch donde:

- cada ítem del lote reciba un estado claro antes y después;
- solo se ejecuten los ítems `ready`;
- el resultado final sea estructurado por ítem y no por log humano;
- `BatchOperations` pueda mostrar resumen + detalle sin reinterpretar strings.

### Task 4 — decisiones cerradas

- La atomicidad es por ítem.
- Si el destino ya existe, ese ítem queda en `target_conflict`.
- No se sobreescribe ni auto-renombra en este slice.
- `Duplicates` puede consumir una versión compacta del reporte, pero debe provenir del mismo engine.

### Task 4 — touchpoints obligatorios

- `src-tauri/src/commands/files.rs`
- `src/lib/api.ts`
- `src/types/database.ts`
- `src/pages/BatchOperations.tsx`
- `src/pages/Duplicates.tsx`

### Task 4 — forma mínima recomendada del contrato

- Planner/result item:
  - `originalFilePath`
  - `targetFilePath`
  - `status: "ready" | "failed_validation" | "target_conflict" | "fs_moved" | "db_committed" | "rolled_back" | "manual_review_required"`
  - `message`
  - `journalId?`
- Reporte batch:
  - `summary`
  - `items[]`

Si resulta más simple, `dry_run_move()` puede evolucionar hacia el planner estructurado en vez de mantener dos conceptos paralelos.

### Task 4 — checklist de implementación

1. Extraer o reaprovechar helpers del Task 3 para journal, rollback y update seguro de DB.
2. Reemplazar `move_files_op()` por un flujo planner + execute, o envolverlo hasta que la UI deje de depender de strings.
3. Marcar por ítem qué está `ready` y qué quedó bloqueado antes del commit.
4. Ejecutar solo los ítems `ready`.
5. Reportar por fase el resultado final.
6. Ajustar `BatchOperations` para consumir el reporte estructurado como primera UI rica.
7. Ajustar `Duplicates` para reutilizar el mismo engine aunque su presentación sea más compacta.

### Task 4 — tests mínimos esperados

- preflight con mezcla de `ready`, `missing`, `target_conflict`;
- ejecución parcial solo de `ready`;
- rollback por ítem si falla el commit de DB;
- fallback cross-drive reportado como fase concreta y no solo como texto.

### Task 4 — verificación focalizada

- `cargo check`
- `bun run typecheck`
- `bun run lint`

### Task 4 — definition of done

- Ya no hay `Vec<String>` como contrato principal del batch move.
- `BatchOperations` muestra un resumen y detalle por ítem.
- `Duplicates` puede reutilizar el mismo engine sin reinterpretar strings.

### Task 4 — no hacer en este slice

- overwrite interactivo;
- auto-rename de conflictos;
- all-or-nothing del lote;
- recovery al arranque.

### Task 4 — trampas conocidas

- No dejar el preflight y el commit mezclados otra vez “porque el diff es menor”. Ese es exactamente el problema actual.

## Task 5 — Slice 5: remoción de biblioteca segura

### Task 5 — metadata

- Tipo: AFK
- Bloqueada por: Task 1
- Superficie demo inicial: `Duplicates`
- Objetivo del slice: unificar remoción lógica y remoción con papelera bajo un mismo contrato seguro

### Task 5 — no volver a investigar esto

- `delete_songs()` trabaja por índices.
- Si `trash::delete()` falla, la operación igual puede terminar removiendo la entrada de la BD.
- `Duplicates.tsx` diferencia “Eliminar de BD” vs “Eliminar de BD + Papelera”, pero ambas cuelgan del mismo contrato débil.

### Task 5 — qué construir

Construir una familia de **Remoción de biblioteca** con dos modos explícitos:

- `db_only`
- `trash_then_unindex`

Cada ítem debe informar claramente si quedó:

- removido de la biblioteca;
- rechazado por validación;
- bloqueado porque el `trash` falló;
- pendiente de revisión manual.

### Task 5 — decisiones cerradas

- Si falla el envío a papelera, ese ítem no sale de `database.xml`.
- La identidad es `originalFilePath`.
- `Duplicates` es la primera demo vertical; no hace falta mover todavía el delete al Browser.

### Task 5 — touchpoints obligatorios

- `src-tauri/src/commands/database.rs`
- `src/lib/api.ts`
- `src/types/database.ts`
- `src/pages/Duplicates.tsx`

### Task 5 — forma mínima recomendada del contrato

- Request:
  - `vdjFolder`
  - `items: string[]` o array tipado por `originalFilePath`
  - `mode: "db_only" | "trash_then_unindex"`
- Result item:
  - `originalFilePath`
  - `status: "completed" | "failed_validation" | "trash_failed" | "manual_review_required" | "not_found"`
  - `mode`
  - `message`

El nombre público del wrapper TypeScript debería reflejar el dominio, por ejemplo `removeLibraryEntries`; el nombre interno del comando Tauri puede migrarse ahora o en un follow-up muy corto, pero la UI/documentación ya no debería tratarlo como “delete genérico”.

### Task 5 — checklist de implementación

1. Cambiar la identidad del request a `originalFilePath`.
2. Separar semánticamente los modos `db_only` y `trash_then_unindex` dentro de un único engine.
3. Validar todos los ítems antes de removerlos de la BD.
4. Si `trash` falla, mantener la entrada catalogada.
5. Ajustar `Duplicates` para mostrar resultados tipados por modo y estado.
6. Actualizar `api.ts` y `types/database.ts` para dejar de depender de `string[]` de log.

### Task 5 — tests mínimos esperados

- remoción `db_only` exitosa;
- remoción `trash_then_unindex` exitosa;
- fallo de `trash` que no elimina de la BD;
- identidad case-insensitive por path;
- dedupe de selección repetida si el caller envía paths duplicados.

### Task 5 — verificación focalizada

- `cargo check`
- `bun run typecheck`
- `bun run lint`

### Task 5 — definition of done

- No existe el caso “se borró de la BD aunque no fue a papelera”.
- `Duplicates` ya presenta resultados estructurados y distingue modos.
- La identidad del delete dejó de depender de índices.

### Task 5 — no hacer en este slice

- delete desde el Browser de biblioteca;
- recycle bin UI avanzada por plataforma;
- recovery al arranque.

### Task 5 — trampas conocidas

- No conservar `Vec<String>` como salida final “porque la UI la parsea fácil”. Esa deuda vuelve a aparecer en el slice 6.

## Task 6 — Slice 6: recuperación de mutación al arranque

### Task 6 — metadata

- Tipo: AFK
- Bloqueada por: Task 3
- Superficie demo inicial: shell (`App.tsx` + `Layout.tsx`)
- Objetivo del slice: convertir el journal persistido en un flujo visible de recovery y bloqueo de nuevas mutaciones críticas

### Task 6 — no volver a investigar esto

- `SafetyInspector.tsx` hoy solo comunica “guard rails”, no recovery real.
- `Layout.tsx` ya es el mejor lugar para un banner o panel persistente a nivel shell.
- `App.tsx` concentra la carga de biblioteca y el routing state-based; es el seam natural para consultar estado de recovery al abrir una biblioteca.

### Task 6 — qué construir

Construir un flujo de **Recuperación de mutación** donde, al abrir una biblioteca con journal pendiente:

- la app detecte la incidencia;
- permita lectura/diagnóstico normal;
- bloquee nuevas mutaciones críticas;
- ofrezca un recovery center visible con acción recomendada;
- permita `resume`, `rollback` o acknowledgement de revisión manual según el caso.

### Task 6 — decisiones cerradas

- El bloqueo es por biblioteca, no global a toda la app.
- La recomendación la calcula el motor, pero la confirmación final es del usuario.
- La UX principal vive en shell, no solo en `SafetyInspector`.
- No hacer auto-recovery silencioso universal.

### Task 6 — touchpoints obligatorios

- `src-tauri/src/safety.rs` o el módulo donde quede el journal
- `src-tauri/src/lib.rs`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/SafetyInspector.tsx`
- `src/lib/api.ts`
- `src/types/database.ts`

### Task 6 — forma mínima recomendada del contrato

- Query estado recovery:
  - `status: "clean" | "pending_recovery"`
  - `libraryKey`
  - `recommendedAction: "resume" | "rollback" | "manual_review_acknowledged"`
  - `entries[]`
- Acciones:
  - `resume`
  - `rollback`
  - `manual_review_acknowledged`

El contrato puede entrar por comandos separados o por un command surface pequeño; lo importante es que la UI no tenga que inferir la lógica del journal.

### Task 6 — checklist de implementación

1. Exponer una consulta backend del journal pendiente por biblioteca.
2. Hacer que `App.tsx` consulte ese estado al abrir o recargar una biblioteca.
3. Agregar un gate en el contexto o en el shell para bloquear nuevas mutaciones críticas mientras haya recovery pendiente.
4. Renderizar un banner/center visible en `Layout.tsx`.
5. Usar `SafetyInspector` solo como apoyo secundario o deep link, no como owner.
6. Implementar las acciones `resume` / `rollback` / `manual_review_acknowledged`.
7. Garantizar que las páginas sigan pudiendo leer y diagnosticar la biblioteca afectada.

### Task 6 — tests mínimos esperados

- backend: state machine del journal y transición de acciones;
- backend: scoping correcto por biblioteca;
- frontend o helper puro: el gate bloquea mutaciones críticas pero no lectura/navegación.

### Task 6 — verificación focalizada

- `cargo check`
- `bun run typecheck`
- `bun run lint`

### Task 6 — definition of done

- Existe detección de recovery pendiente al abrir la biblioteca.
- Nuevas mutaciones críticas quedan bloqueadas con UI visible y entendible.
- El usuario tiene una acción recomendada y puede confirmarla.
- `SafetyInspector` deja de ser el único lugar que “insinúa” seguridad.

### Task 6 — no hacer en este slice

- auto-recovery global y silencioso;
- mover el journal dentro de la carpeta VirtualDJ;
- rediseñar toda la navegación del shell.

### Task 6 — trampas conocidas

- No bloquear toda la app con un overlay ciego si solo una biblioteca está afectada.
- No esconder el recovery en un panel lateral disponible solo en pantallas grandes.

## Cierre esperado que debe dejar cualquier agente al terminar un task

- Código compilando.
- Contratos tipados documentados en `src/types/database.ts` y `src/lib/api.ts`.
- Tests backend ajustados o agregados donde el slice toca persistencia crítica.
- La documentación de arquitectura solo se actualiza si el comportamiento visible realmente cambió; no reescribirla por deporte.

## Qué leer si el task se traba

- Glosario y decisiones de dominio: `CONTEXT.md`
- Seams de producto y dirección acordada: `docs/architecture.md`
- Motivación de los slices: `docs/superpowers/plans/2026-05-15-vdj-manager-slices-criticos.md`

La intención es que, desde este punto, el siguiente agente pueda escoger un task y empezar a implementar sin volver a desenterrar toda la conversación arqueológica.
