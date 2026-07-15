# Estado de implementación de mutaciones críticas

Actualizado: 2026-07-15.

Los seis slices definidos en `docs/superpowers/plans/2026-05-15-vdj-manager-slices-implementation-tasks.md` están implementados:

1. Tags patch-in-place por `originalFilePath`, preservando XML desconocido.
2. Reconciliación de rutas con candidatos tipados y detección de colisiones.
3. Rename literal de un archivo con journal, no-clobber y rollback.
4. Batch move con planner y resultado por ítem, incluido cross-drive copy/delete.
5. Remoción explícita `db_only` o `trash_then_unindex`; un fallo de papelera conserva la entrada catalogada.
6. Recuperación visible al abrir la biblioteca, con lectura habilitada, mutaciones pausadas y acciones confirmadas por journal.

## Invariantes de seguridad

- No existe un comando frontend que serialice `database.xml` completo.
- Los writers abortan si no pueden conservar estructura, validar el XML o comprobar que la fuente no cambió.
- Rename/move no reemplazan destinos y mantienen un lease OS-backed por biblioteca durante toda la coreografía.
- El journal vive en app-data, nunca dentro de la carpeta de VirtualDJ o de música.
- Recovery valida la referencia de BD y la identidad física (tamaño + SHA-256) antes de mover.
- Las pruebas de escritura usan únicamente fixtures y directorios temporales.

## Verificación de mantenimiento

```powershell
bun test
bun run check
bun run build

& $env:ComSpec /d /c 'call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul && cargo test && cargo check'
```

La verificación visual puede abrir `http://127.0.0.1:3000/?demo&page=batch&recovery`; ese estado es sintético y no consulta rutas reales.
