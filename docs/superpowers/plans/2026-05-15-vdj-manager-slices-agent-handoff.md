# Handoff — slices críticos de VDJ Manager

## Para qué sirve este handoff

Este archivo está pensado para una sesión nueva con otro agente. No reemplaza el task pack; le dice al agente exactamente desde dónde arrancar y qué no necesita re-investigar.

## Leer en este orden

1. `docs/superpowers/plans/2026-05-15-vdj-manager-slices-implementation-tasks.md`
2. `CONTEXT.md`
3. `docs/adr/0001-browser-de-biblioteca-como-seam-principal.md`
4. `docs/adr/0002-patch-in-place-para-mutaciones-criticas-de-database.md`

Con eso debería bastar para implementar cualquiera de los slices sin releer la conversación completa.

## Contexto que ya está decidido

- El seam principal del núcleo será el **Browser de biblioteca**.
- `Songs`, `Playlists` e `History` no deben seguir tratándose como conceptos soberanos del núcleo.
- Las mutaciones críticas sobre `database.xml` deben converger a **patch-in-place**.
- La identidad canónica de mutación es `originalFilePath`.
- El matching de rutas debe ser Windows-friendly y case-insensitive.
- Los resultados IPC deben ser tipados.
- La atomicidad batch acordada es por ítem.
- El journal persistido vive en app data y se scopea por biblioteca.

## Estado actual del código que importa

- `src-tauri/src/database/parser.rs` todavía serializa el XML completo.
- `src-tauri/src/commands/database.rs` y `src-tauri/src/commands/files.rs` aún dependen mucho de índices y strings humanas.
- `src/pages/MissingFiles.tsx` y `src/pages/RelinkTracks.tsx` todavía comparten ownership de la corrección.
- `src/pages/BatchOperations.tsx` y `src/pages/Duplicates.tsx` son las primeras superficies demo de rename/move/delete.
- `src/App.tsx` + `src/components/Layout.tsx` son el mejor seam para recovery visible.

## Orden recomendado de ejecución

1. Task 1 — inline tag edit seguro
2. Task 2 — reconciliación de rutas
3. Task 3 — renombrado journaled
4. Task 4 — batch move planner
5. Task 5 — remoción de biblioteca
6. Task 6 — recovery al arranque

## Skills sugeridas para la siguiente sesión

- `diagnose` si al implementar un slice aparece un bug difícil o una regresión.
- No hace falta cargar `to-issues` otra vez para implementar; el task pack ya dejó ese trabajo hecho.

## Comandos de validación a mano

- `cargo check`
- `bun run typecheck`
- `bun run lint`

Además, cada task del pack lista verificaciones focalizadas.

## Resultado esperado de una buena siguiente sesión

- Elegir un task del pack.
- Implementarlo sin relitigar decisiones ya cerradas.
- Dejar el contrato tipado, los tests relevantes y la superficie UI demo funcionando.

En resumen: el archivo importante para trabajar es el task pack; este handoff solo evita que el próximo agente vuelva a recorrer toda la excavación previa.
