# VDJ Manager — slices detallados de arquitectura y mutaciones críticas

> Documento de trabajo derivado de la sesión extensa de arquitectura del `2026-05-15`. Complementa `CONTEXT.md` y los ADRs `0001` / `0002`. Su objetivo no es redefinir el lenguaje del dominio, sino convertir las decisiones ya tomadas en slices ejecutables, demoables y compatibles con el código actual.

**Implementación lista para otra sesión:**

- task pack ejecutable: `docs/superpowers/plans/2026-05-15-vdj-manager-slices-implementation-tasks.md`
- handoff corto para otro agente: `docs/superpowers/plans/2026-05-15-vdj-manager-slices-agent-handoff.md`

## Propósito

El repo ya pasó una primera ronda de hardening técnico, pero todavía conserva varios puntos donde la arquitectura acordada y el código real no están alineados:

- navegación basada en páginas soberanas allí donde el producto ya decidió un **Browser de biblioteca** profundo;
- mutaciones críticas basadas en índices y `String` humanas;
- escritura de `database.xml` todavía demasiado dependiente del serializer global;
- ownership mezclado entre diagnóstico, corrección y operaciones destructivas.

Este plan documenta el siguiente tramo: convertir esas decisiones en slices verticales finos, verificables y con un orden de ataque realista.

## Resumen de arquitectura acordada

### Núcleo de biblioteca

- El seam principal del núcleo es el **Browser de biblioteca**.
- La sidebar objetivo expone una sola entrada principal de **Biblioteca**.
- `Songs`, `Playlists` e `History` dejan de ser módulos soberanos y pasan a ser vistas o fuentes internas del browser.
- La **Verificación de integridad** diagnostica; la **Reconciliación de rutas** corrige.
- Las **Entradas descubiertas** son first-class dentro del browser, pero solo entran en `database.xml` mediante **Catalogación explícita**.

### Estudio de recursos

- `Configs`, `Pads` y `Mappers` siguen separadas a nivel de producto.
- Comparten invariantes y pipeline backend de validación/guardado.
- La API pública debe decir la verdad del dominio: explícita por recurso.
- Política transversal: editor especializado por defecto, raw avanzado como escape hatch.

### Mutaciones críticas

- `database.xml` se escribe con **patch-in-place**.
- La identidad canónica es `originalFilePath` con chequeos optimistas cuando haga falta.
- El matching de rutas es Windows-friendly y case-insensitive.
- El resultado de mutación es tipado y legible por máquina.
- La atomicidad de batch es por ítem.
- No existe fallback automático al serializer legacy si la fidelidad no puede garantizarse.

### Recovery

- El journal persistido vive en app data, ligado a una Biblioteca VirtualDJ concreta.
- Si hay una operación incompleta, la app entra en modo lectura con mutaciones críticas bloqueadas.
- El motor recomienda la acción de recovery; el usuario confirma.
- La UX de recovery vive en el shell, no escondida solo en un inspector lateral.

## Orden recomendado de implementación

La secuencia recomendada minimiza riesgo y maximiza leverage:

1. **Slice 1 — Inline tag edit seguro con patch-in-place**
2. **Slice 2 — Reconciliación de rutas con identidad estable**
3. **Slice 3 — Renombrado de un solo ítem journaled**
4. **Slice 4 — Batch move con planner por ítem y reporte estructurado**
5. **Slice 5 — Remoción de biblioteca segura**
6. **Slice 6 — Recuperación de mutación al arranque**

Dependencias prácticas:

- `Slice 1` habilita el write-path seguro y el contrato tipado.
- `Slice 2` depende de `Slice 1` para reaprovechar identidad y reporte.
- `Slice 3` depende de `Slice 1` y abre la puerta a journal + rollback físico.
- `Slice 4` depende de `Slice 3` porque escala el engine FS+DB a múltiples ítems.
- `Slice 5` depende de `Slice 1` y reutiliza el mismo contrato de remoción por ítem.
- `Slice 6` depende de `Slice 3` porque necesita un journal real que recuperar.

## Slice 1 — Inline tag edit seguro con patch-in-place

> Este slice ya fue detallado durante la sesión y queda aquí resumido para mantener el plan completo.

### Slice 1 — objetivo

Probar el primer write-path crítico que toca solo `database.xml`, sin filesystem rollback todavía, pero ya con:

- identidad por `originalFilePath`;
- matching Windows-friendly;
- patch-in-place;
- resultado tipado;
- fail-safe si no se puede garantizar fidelidad XML.

### Slice 1 — touchpoints actuales

- `src-tauri/src/commands/database.rs`
- `src-tauri/src/database/parser.rs`
- `src-tauri/src/database/models.rs`
- `src/components/SongTable.tsx`
- `src/lib/api.ts`

### Slice 1 — qué debe demostrar

- que el write-path nuevo preserva XML desconocido;
- que la UI real puede adoptar identidad por `FilePath` sin mover todavía todo el sistema;
- que el frontend deja de “parchear a ciegas” y solo actualiza tras éxito confirmado.

### Slice 1 — criterios de aceptación

- request/respuesta tipados para edición inline;
- comparación de rutas normalizada y case-insensitive;
- patcher de un solo `Song` existente;
- aborto con error tipado si la forma del XML no es segura;
- `SongTable` usa el request nuevo y solo aplica patch local tras éxito;
- tests backend/frontend del flujo.

### Slice 1 — fuera de scope

- journal persistido;
- rollback de filesystem;
- rename/move/delete;
- recovery al arranque.

## Slice 2 — Reconciliación de rutas con identidad estable

### Slice 2 — objetivo

Separar definitivamente la **Verificación de integridad** de la **Reconciliación de rutas**, dejando a `RelinkTracks` como dueño del flujo correctivo y a `MissingFiles` como diagnóstico y puerta de entrada.

### Slice 2 — problema actual

- `MissingFiles.tsx` verifica, sugiere y corrige rutas.
- `RelinkTracks.tsx` ya ofrece una UX más profunda del mismo problema.
- `relocate_file` usa una semántica demasiado simple para el nivel de ownership que queremos.

El resultado es duplicación de UI, de expectativas y de autoridad sobre el mismo concepto del dominio.

### Slice 2 — touchpoints actuales

- `src/pages/MissingFiles.tsx`
- `src/pages/RelinkTracks.tsx`
- `src-tauri/src/commands/files.rs::find_similar_files`
- `src-tauri/src/commands/files.rs::relocate_file`
- `src/lib/api.ts::relocateFile`

### Slice 2 — decisiones ya cerradas

- `RelinkTracks` es el dueño del flujo de **Reconciliación de rutas**.
- `MissingFiles` sigue existiendo, pero como pantalla de **Verificación de integridad**.
- El primer corte debe ser **single-item con confirmación explícita**, no auto-lote como verdad del dominio.
- La reconciliación solo puede cambiar:
  - ruta;
  - metadata física derivable del archivo real (por ejemplo `file_size`).
- No debe reinterpretar ni reescribir metadata musical del track.
- El ranking de candidatos vive en backend y se devuelve estructurado; el frontend no inventa la verdad del score.
- Si la ruta elegida ya pertenece a otra entrada catalogada, se aborta con error tipado de **Colisión de referencia** y se deriva a revisión manual/duplicados.

### Slice 2 — qué debe demostrar

- que el repo puede distinguir nítidamente entre diagnosticar y corregir;
- que la corrección usa identidad estable y contrato tipado;
- que el candidato “mejor” deja de ser heurística dispersa entre pantallas.

### Slice 2 — criterios de aceptación

- `MissingFiles` deja de ejecutar la corrección como flujo principal y se limita a diagnóstico + salto al owner correcto.
- `RelinkTracks` concentra el flujo de selección, confirmación y corrección.
- `relocate_file` deja de sentirse como parche ad hoc y adopta identidad por `FilePath` + resultado tipado.
- El backend puede reportar al menos:
  - `completed`
  - `failed_validation`
  - `reference_collision`
  - `manual_review_required`
- El ranking de candidatos viene del backend y la UI no necesita reimplementar la verdad del scoring.
- Tests backend cubren match, colisiones y actualización de tamaño físico.

### Slice 2 — fuera de scope

- recovery por journal;
- reconciliación batch automática como comportamiento principal;
- catalogación de Entradas descubiertas;
- cambios de metadata musical más allá de la ruta y metadata física.

## Slice 3 — Renombrado de un solo ítem journaled

### Slice 3 — objetivo

Crear el primer caso pequeño pero real de mutación `filesystem + database.xml` con journal persistido, rollback físico y contrato tipado.

### Slice 3 — problema actual

- `rename_file_op` sigue indexado por posición.
- Renombra el archivo, luego reescribe `database.xml`.
- Si falla el commit de la BD, la biblioteca puede quedar desalineada.
- La primera UI real está escondida dentro del loop de `BatchOperations`.

### Slice 3 — touchpoints actuales

- `src-tauri/src/commands/files.rs::rename_file_op`
- `src/pages/BatchOperations.tsx`
- `src/lib/api.ts::renameFileOp`

### Slice 3 — decisiones ya cerradas

- **Renombrado** = cambio de nombre dentro de la misma carpeta.
- Si el nombre propuesto es inválido, el motor **rechaza con error tipado**; no sanitiza silenciosamente.
- Si el nombre destino ya existe, se aborta con `target_conflict`.
- Este slice inaugura el **journal persistido mínimo**.
- La primera demo vertical usa `BatchOperations` con selección de un solo ítem.
- Coreografía por ítem:
  1. preflight y journal `planned`;
  2. cambio físico en filesystem;
  3. patch-in-place de `database.xml`;
  4. `completed`;
  5. si falla la BD, rollback físico y estado explícito.

### Slice 3 — qué debe demostrar

- que la primera mutación `FS + DB` ya nace con el contrato correcto;
- que el journal no es una fase futura abstracta, sino una pieza real desde el primer caso pequeño;
- que el resultado tipado puede expresarse sin depender de logs de texto.

### Slice 3 — criterios de aceptación

- request de rename basado en `originalFilePath` + nombre nuevo;
- validación tipada de nombre inválido, no-op y `target_conflict`;
- journal mínimo persistido para el ítem;
- rollback físico si falla el patch de `database.xml`;
- resultado tipado con al menos:
  - `completed`
  - `failed_validation`
  - `rolled_back`
  - `manual_review_required`
- `BatchOperations` puede ejecutar el flujo con un solo ítem y mostrar el resultado correcto.

### Slice 3 — fuera de scope

- batch rename completo;
- auto-rename con sufijos;
- overwrite/replace;
- recovery al arranque (eso vive en el slice 6).

## Slice 4 — Batch move con planner por ítem y reporte estructurado

### Slice 4 — objetivo

Escalar el engine del rename a movimientos por lote manteniendo atomicidad por ítem, preflight claro y resultados mixtos verificables.

### Slice 4 — problema actual

- `move_files_op` mezcla validación y ejecución en un loop simple.
- Devuelve `Vec<String>`.
- `BatchOperations` y `Duplicates` dependen de ese output textual.
- Los conflictos de destino solo terminan en mensajes de texto, no en estados reales de máquina.

### Slice 4 — touchpoints actuales

- `src-tauri/src/commands/files.rs::move_files_op`
- `src/pages/BatchOperations.tsx`
- `src/pages/Duplicates.tsx`
- `src/lib/api.ts::moveFilesOp`

### Slice 4 — decisiones ya cerradas

- El planner hace preflight global del lote.
- El batch ejecuta **solo** los ítems `ready`.
- La atomicidad es por ítem, no del lote completo.
- Si el destino ya existe, ese ítem queda en `target_conflict`; no se auto-renombra ni se sobreescribe.
- El reporte por ítem debe incluir fase + motivo, no solo `success/error`.
- `BatchOperations` es la primera UI rica para este reporte.
- `Duplicates` puede consumir el mismo engine con una UX más compacta inicialmente.

### Slice 4 — qué debe demostrar

- que la arquitectura batch no sacrifica seguridad por throughput;
- que el planner y el reporte concentran la complejidad y devuelven leverage real a la UI;
- que el engine sirve a más de un caller sin obligar a los callers a reinterpretar logs.

### Slice 4 — criterios de aceptación

- preflight estructurado por ítem;
- ejecución solo de ítems `ready`;
- estados por ítem como mínimo del estilo:
  - `ready`
  - `failed_validation`
  - `fs_moved`
  - `db_committed`
  - `rolled_back`
  - `manual_review_required`
- conflictos de destino expresados como `target_conflict`;
- `BatchOperations` puede mostrar resumen y detalle del lote sin depender de strings heredadas.

### Slice 4 — fuera de scope

- política all-or-nothing del lote;
- overwrite interactivo por conflicto;
- auto-rename de colisiones;
- recovery al arranque (slice 6).

## Slice 5 — Remoción de biblioteca segura

### Slice 5 — objetivo

Unificar la remoción `db_only` y `trash_then_unindex` bajo una sola familia de mutación con modos explícitos, identidad estable y resultado tipado.

### Slice 5 — problema actual

- `delete_songs` mezcla basura física y descatalogación en un flujo por índice.
- Si `trash::delete(...)` falla, igual puede terminar borrando la entrada de la BD.
- El caller principal (`Duplicates`) solo ve un `Vec<String>` y no un contrato seguro.

### Slice 5 — touchpoints actuales

- `src-tauri/src/commands/database.rs::delete_songs`
- `src/pages/Duplicates.tsx`
- `src/lib/api.ts::deleteSongs`

### Slice 5 — decisiones ya cerradas

- `db_only` y `trash_then_unindex` pertenecen a la misma familia de **Remoción de biblioteca**.
- Si falla el envío a papelera, ese ítem **no** sale de `database.xml`.
- El primer aterrizaje de UI vive en `Duplicates`.
- El engine debe compartir identidad por `FilePath`, validación y reporte por ítem entre ambos modos.

### Slice 5 — qué debe demostrar

- que una operación destructiva no puede “medio funcionar” y dejar al usuario con disco y biblioteca contando historias distintas;
- que el mismo engine puede servir modos distintos sin duplicar bugs;
- que `Duplicates` puede ser la primera demo vertical sin obligar a rediseñar todavía el Browser.

### Slice 5 — criterios de aceptación

- request de remoción basado en identidad estable, no solo en índices de UI;
- modos explícitos `db_only` y `trash_then_unindex`;
- si `trash` falla, el ítem reporta `trash_failed` (o equivalente tipado) y permanece catalogado;
- reporte por ítem con resultado legible por máquina;
- `Duplicates` puede mostrar la diferencia entre éxito, fallo y revisión manual.

### Slice 5 — fuera de scope

- borrado desde el Browser de biblioteca;
- delete batch genérico fuera de `Duplicates`;
- recovery al arranque;
- recycle bin UI avanzada por plataforma.

## Slice 6 — Recuperación de mutación al arranque

### Slice 6 — objetivo

Convertir el journal persistido en una capacidad real de recuperación, visible en el shell y acotada por biblioteca.

### Slice 6 — problema actual

- `safety.rs` aporta backups y atomic writes, pero no memoria operacional.
- Si la app cae a mitad de una mutación multi-paso, hoy no hay un flujo explícito de recuperación.
- `Layout.tsx` y `SafetyInspector` no representan todavía un gate operativo de recovery.

### Slice 6 — touchpoints actuales

- `src-tauri/src/safety.rs`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/SafetyInspector.tsx`

### Slice 6 — decisiones ya cerradas

- El journal persistido vive en app data, ligado a la biblioteca afectada.
- Si existe una operación incompleta, la app entra en modo lectura/diagnóstico y bloquea nuevas mutaciones críticas.
- El motor calcula la acción recomendada; el usuario confirma.
- La UX principal debe vivir en el shell (banner + recovery center), no solo en `SafetyInspector`.

### Slice 6 — qué debe demostrar

- que el journal no es solo una auditoría post mortem, sino una pieza operativa del producto;
- que el usuario puede entender y resolver la incidencia sin que la app se vuelva opaca o hostil;
- que el bloqueo se aplica con precisión a la biblioteca afectada y no como castigo global a toda la app.

### Slice 6 — criterios de aceptación

- detección de journals incompletos al abrir una Biblioteca VirtualDJ;
- gate que permite lectura pero bloquea nuevas mutaciones críticas;
- UI visible en shell con acceso al detalle/recovery center;
- acciones disponibles al menos del estilo:
  - `resume`
  - `rollback`
  - `manual_review_acknowledged`
- recomendación calculada por el motor y confirmada por el usuario;
- tests backend del state machine del journal y tests frontend del gate visible.

### Slice 6 — fuera de scope

- auto-recovery silencioso universal;
- bloqueo global de la app independientemente de la biblioteca abierta;
- mover el journal dentro de la carpeta VirtualDJ.

## Riesgos que este plan intenta cortar de raíz

- **falsa seguridad del serializer**: que la app “guarde” mientras sigue perdiendo XML desconocido;
- **índices como identidad**: que un reorder o una vista mezclada haga que la mutación toque otra canción;
- **log bonito, estado feo**: que el backend reporte texto simpático y deje disco/BD desalineados;
- **ownership mezclado**: que `MissingFiles`, `RelinkTracks`, `Duplicates` y `BatchOperations` sigan arreglando el mismo concepto con semánticas distintas;
- **recovery invisible**: que la app bloquee mutaciones por una operación pendiente que el usuario ni siquiera puede ver.

## Qué queda explícitamente fuera de este plan

- rediseño visual completo del shell o de la sidebar;
- migración completa de `Songs`/`Playlists` al Browser en una sola fase;
- reescritura total de `SongTable` antes de cerrar mutaciones críticas;
- convertir todavía estas decisiones en veinte ADRs adicionales.

## Relación con la documentación viva

- El lenguaje del dominio vive en `CONTEXT.md`.
- Las decisiones más duras y sorprendentes viven en `docs/adr/`.
- Este documento vive un escalón más abajo: traduce esa base a slices, orden, acceptance criteria y límites explícitos.

Si una futura implementación contradice este plan, la prioridad de verdad es:

1. `CONTEXT.md`
2. ADRs
3. este documento

La idea es que el código termine alcanzando esa jerarquía, no al revés.
