# Contratos de vistas

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
| Evidencia | dark/light, last/first-run/error |

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
| Evidencia | healthy/problem/recovery en 1180, 1280, 1440; dark/light |

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
| Evidencia | 1180 drawer, 1280/1440 tres paneles, overflow y reload persistido |

## Resolver problemas

| Contrato | Definición |
| --- | --- |
| Propósito | Diagnosticar y corregir integridad sin confundir diagnóstico con mutación |
| Secciones | Faltantes, Tracks movidos, Duplicados, Huérfanos |
| Jerarquía | alcance/última verificación → resultados → evidencia/candidatos → acción |
| Estados | antes/durante/después/error, empty explicado, recovery bloqueando mutación |
| Acción crítica | resultado faltante abre candidatos de Reconciliación con selección compartida |
| Teclado | tabs semánticos, lista/evidencia y confirmaciones destructivas accesibles |
| Evidencia | cada estado; duplicados conserva modos seguros y confirmación única |

## Operaciones

| Contrato | Definición |
| --- | --- |
| Propósito | Preparar, revisar y ejecutar cambios batch con resultado por ítem |
| Jerarquía | alcance/selección → intención → preview → ejecución → reporte |
| Estados | sin selección, ready, preview, running, parcial, error, recovery bloqueado |
| Acción crítica | `Vista previa`; Ejecutar sólo después de preview válido |
| Teclado | árbol colapsable, tabla seleccionable y diálogo de confirmación |
| Viewport | full-bleed; tabla mantiene ancho útil y scroll propio |
| Evidencia | movimiento, rename, tags, parcial y error |

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
| Evidencia | fixture dirty para cada tab, save/revert y error demo determinista |

## Recovery

| Contrato | Definición |
| --- | --- |
| Propósito | Resolver una mutación interrumpida antes de habilitar nuevas escrituras |
| Jerarquía | estado/severidad → efecto → acción recomendada → detalle/journal |
| Presencia | ancho completo sólo en `pending`, `manual_review` o error; clean queda en cápsula |
| Confirmación | Dialog accesible; Cancelar recibe foco; busy bloquea repetición |
| Evidencia | pending, rollback/resume, manual review, error y clean posterior |
