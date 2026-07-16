# Contratos de vistas

Estado: verificados el 2026-07-15 contra demo determinista y navegador Chromium real.

Estos contratos son aceptación de producto, no inventario de componentes. Toda vista debe conservar foco visible, orden lógico, copy en español, estados locales y scroll ownership explícito.

## Contrato global

- El rail mide 72 px y expone nombre accesible incluso colapsado; se expande como overlay por acción explícita.
- Header: biblioteca activa, cantidad de tracks y una cápsula de seguridad de mutaciones desplegable. La cápsula describe backup/journal/bloqueo de escritura; nunca resume la integridad de archivos. No existe inspector permanente.
- Tipografía: 14 px para cuerpo/controles; 13 px para densidad tabular; 12 px sólo metadata secundaria.
- Contenido esencial se pinta visible desde el primer frame.
- Dark/light son los únicos temas. `light` permanece; cualquier valor heredado migra a `dark`.
- Error: resumen accionable, detalle opt-in y recuperación. Nunca se vuelca `String(error)` como titular.
- Diálogo destructivo: foco inicial en Cancelar, trap Tab/Shift+Tab, Escape, background inert, restore focus y confirmación única mientras está busy.
- 1180×720 es el mínimo de ventana. No se declara soporte móvil.

## Home

| Contrato | Definición |
| --- | --- |
| Propósito | Entrar a una Biblioteca VirtualDJ conocida sin teatralizar capacidades |
| Jerarquía | Reanudar última biblioteca → seleccionar carpeta → seguridad breve |
| Estados | primera ejecución, última biblioteca disponible, loading, error recuperable |
| Acción crítica | `Reanudar biblioteca` o `Seleccionar carpeta` |
| Teclado | orden CTA principal, alternativa y ayuda; error enfoca recuperación si aplica |
| Viewport | una composición sin scroll a 1180×720 |
| Evidencia | `phase3/home-dark-1440x900.png`; `phase6-final/home-first-run-light-1180x720.png`; `phase6-final/home-error-light-1180x720.png` |

## Dashboard

| Contrato | Definición |
| --- | --- |
| Propósito | Decidir qué requiere atención y abrir la próxima acción segura |
| Jerarquía | cola de atención → próxima acción → métricas compactas → contexto |
| Estados | healthy, problemas, recovery, error local, scans no ejecutados |
| Acción crítica | abrir Biblioteca o sección exacta de Resolver problemas |
| Datos | `Sin verificar` distingue scan ausente de cero; no hay números inventados |
| Teclado | cada fila de atención es un destino estable; no hay auto-sort durante foco |
| Viewport | la cola y próxima acción caben en primer viewport del mínimo soportado |
| Evidencia | Matriz representativa: `phase3/dashboard-healthy-dark-1440x900.png`, `phase3/dashboard-problem-dark-1180x720.png`, `phase6-final/dashboard-problem-light-1180x720.png`, `phase6-final/dashboard-healthy-light-1280x800.png`, `phase6-final/dashboard-recovery-dark-1180x720.png` |

## Biblioteca

| Contrato | Definición |
| --- | --- |
| Propósito | Explorar colección, Playlists e History sin abandonar el Browser de biblioteca |
| Jerarquía | tabla soberana; árbol fuente a la izquierda; detalle contextual a la derecha |
| Estados | vacío, denso, paths largos, playlist, descubierto, selección, error local |
| Acción crítica | seleccionar/editar una pista manteniendo contexto de fuente y tabla |
| Teclado | tabs/fuentes, filas, edición inline y splitters; reset de layout accesible |
| Viewport | tres paneles a ≥1200; detalle como drawer a <1200; límites con clamping |
| Persistencia | `vdj-layout-v2`; payload inválido vuelve al default |
| Evidencia | `phase4/library-drawer-dark-1180x720.png`, `phase6-final/library-boundary-dark-1200x800.png`, `phase6-final/library-dense-light-1280x800.png`, `phase4/library-playlists-dark-1440x900.png`; DOM confirmó persistencia, 13 px, teclado y documento sin overflow |

## Resolver problemas

| Contrato | Definición |
| --- | --- |
| Propósito | Diagnosticar y corregir integridad sin confundir diagnóstico con mutación |
| Secciones | Faltantes, Tracks movidos, Duplicados, Huérfanos |
| Jerarquía | alcance/última verificación → resultados → evidencia/candidatos → acción |
| Estados | antes/durante/después/error, empty explicado, recovery bloqueando mutación |
| Acción crítica | resultado faltante abre candidatos de Reconciliación con selección compartida |
| Teclado | tabs semánticos, lista/evidencia y confirmaciones destructivas accesibles |
| Evidencia | `phase5-integrity/duplicates-before-dark-1440x900.png`, `duplicates-during-dark-1440x900.png`, `duplicates-after-dark-1440x900.png`, `duplicates-error-dark-1440x900.png`, `missing-to-candidates-dark-1440x900.png`; `phase6-final/integrity-missing-dark-1180x720.png` y `orphans-after-dark-1280x800.png`; DOM confirmó resultados persistidos entre tabs |

## Operaciones

| Contrato | Definición |
| --- | --- |
| Propósito | Preparar, revisar y ejecutar cambios batch con resultado por ítem |
| Jerarquía | alcance/selección → intención → preview → ejecución → reporte |
| Estados | sin selección, ready, preview, running, parcial, error, recovery bloqueado |
| Acción crítica | `Vista previa`; Ejecutar sólo después de preview válido |
| Teclado | árbol colapsable, tabla seleccionable y diálogo de confirmación |
| Viewport | full-bleed; tabla mantiene ancho útil y scroll propio |
| Evidencia | `phase6-final/batch-preview-dark-1180x720.png`, `batch-rename-preview-light-1280x800.png`, `batch-tags-preview-dark-1280x800.png`, `batch-error-dark-1180x720.png`, `batch-recovery-blocked-dark-1180x720.png`; los reportes parciales quedan cubiertos por resultados tipados Rust/frontend |

## Estudio de recursos

| Contrato | Definición |
| --- | --- |
| Propósito | Editar settings, pads y mappers con estado de documento explícito |
| Tabs | Configuración, Pads, Mappers; una superficie, no tres páginas soberanas |
| Jerarquía | recurso/archivo → editor especializado → estado dirty/save/revert |
| Estados | loading, empty, selected, dirty, saving, saved, error local, raw avanzado |
| Acción crítica | Guardar o Revertir el recurso activo; cambiar tab protege trabajo dirty |
| Teclado | tabs, árbol, editor, Save/Revert; aviso antes de perder cambios |
| Viewport | árbol colapsable; editor ocupa área principal |
| Evidencia | `phase5-resources/configs-dirty`, `configs-discard-dialog`, `configs-error-local`, `mappers-dirty`, `mappers-saved`, `pads-clean`; `phase6-final/configs-dirty-light`, `pads-dirty-dark`, `resources-dirty-library-guard-dark` |

## Recovery

| Contrato | Definición |
| --- | --- |
| Propósito | Resolver una mutación interrumpida antes de habilitar nuevas escrituras |
| Jerarquía | estado/severidad → efecto → acción recomendada → detalle/journal |
| Presencia | ancho completo sólo en `pending`, `manual_review` o error; clean queda en cápsula |
| Confirmación | Dialog accesible; Cancelar recibe foco; busy bloquea repetición |
| Evidencia | `phase6-final/dashboard-recovery-dark-1180x720.png`, `recovery-resume-dialog-dark-1280x800.png`, `recovery-manual-review-dark-1280x800.png`, `recovery-error-dark-1280x800.png`, `recovery-clean-after-resume-dark-1280x800.png`; rollback comparte el mismo Dialog destructivo y acción journalizada |

Todas las rutas de evidencia son relativas a `.scratch/evidence/radical-ui/`. Las capturas se generaron únicamente con `?demo`; no se consultaron rutas reales de VirtualDJ o música.
