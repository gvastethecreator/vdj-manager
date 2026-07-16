# Estado de implementación

Actualizado: 2026-07-15.

## Rediseño de workspaces

El rediseño **Centro operativo** está implementado sin feature flag:

- shell con rail de 72 px, header mínimo y estado de seguridad separado de integridad;
- Dashboard con cola de atención y `Sin verificar` para scans ausentes;
- Browser unificado Canciones/Playlists con tres paneles, drawer y `vdj-layout-v2`;
- Integridad agrupada con resultados compartidos y salto Faltantes → candidatos;
- Operaciones full-bleed con preview firmado obligatorio y reporte por ítem;
- Estudio de recursos con Configuración, Pads y Mappers, dirty/save/revert y guards de descarte;
- temas oscuro/claro, errores contextualizados, diálogos accesibles y demo en memoria.

La autopsia y revisión independiente terminaron con **0 blockers y 0 P1**. Los P1 descubiertos durante la revisión —carreras asíncronas, retry falso, teclado de tabla/splitters, clamping, pérdida de resultados y ErrorBoundary técnico— fueron reparados antes del cierre.

## Mutaciones críticas preservadas

Los seis slices de seguridad siguen implementados y sus contratos Rust/IPC no cambiaron:

1. Tags patch-in-place por `originalFilePath`, preservando XML desconocido.
2. Reconciliación de rutas con candidatos tipados y detección de colisiones.
3. Rename literal con journal, no-clobber y rollback.
4. Batch move con planner y resultado por ítem, incluido cross-drive copy/delete.
5. Remoción explícita `db_only` o `trash_then_unindex`.
6. Recovery visible con lectura habilitada y mutaciones pausadas.

## Evidencia frontend y browser

- `bun test`: 49 pruebas pasaron, 0 fallaron.
- `bun run check`: 0 errores y 0 warnings.
- `bun run build`: build Vite de producción correcto.
- Browser real: 1180×720, 1200×800, 1280×800 y 1440×900; dark/light; reduced motion; sin overflow de documento en la matriz final.
- Accesibilidad: Dialog con foco/trap/Escape/inert/restore/busy; tabla y edición inline por teclado; splitters con flechas/Home/End/Enter; controles auditados con nombre accesible.
- Contraste medido: mínimo 7.76:1 en oscuro y 5.65:1 en claro para tokens normales sobre superficie.
- Evidencia local: `.scratch/evidence/radical-ui/phase6-final/`.

## Gates nativos

- `cargo test`: 85 pruebas pasaron, 0 fallaron (54 unitarias + 17 database write + 11 mutation journal + 3 resource write).
- `cargo check`: correcto; sólo warnings `dead_code` del target histórico de tests.
- `bun run tauri build`: correcto en 7m14s, incluyendo build frontend y perfil Rust release.
- Binario: `src-tauri/target/release/vdj-manager.exe`.
- MSI: `src-tauri/target/release/bundle/msi/VDJ Database Manager_0.1.0_x64_en-US.msi`.
- NSIS: `src-tauri/target/release/bundle/nsis/VDJ Database Manager_0.1.0_x64-setup.exe`.

## Invariantes

- Demo nunca invoca Tauri ni toca archivos.
- No existe un comando frontend que serialice `database.xml` completo.
- Los writers abortan si no pueden conservar estructura, validar XML o comprobar que la fuente no cambió.
- Rename/move no reemplazan destinos y mantienen lease por biblioteca.
- El journal vive en app-data, fuera de VirtualDJ y de la música.
- Tests Rust de escritura usan fixtures y directorios temporales.

## Reproducción

```powershell
bun test
bun run check
bun run build

& $env:ComSpec /d /c 'call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul && cargo test && cargo check'
```

Para estados visuales: `http://127.0.0.1:3000/?demo&page=dashboard&state=problem`.
