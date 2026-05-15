# VirtualDJ Library Management

Este contexto cubre los recursos persistidos de VirtualDJ que la aplicación lee, valida y modifica para mantener coherente la biblioteca del usuario.

## Language

**Biblioteca VirtualDJ**:
El conjunto persistido de recursos de VirtualDJ que describen y acompañan la colección del usuario.
_Avoid_: proyecto, datos, instalación

**Recurso VirtualDJ**:
Un archivo persistido de VirtualDJ administrado por la app, como `database.xml`, `settings.xml`, playlists, mappers o pads.
_Avoid_: config genérica, asset, documento cualquiera

**Mutación crítica**:
Una operación que modifica uno o más Recursos VirtualDJ y solo se considera exitosa cuando la Biblioteca VirtualDJ queda coherente tras el cambio.
_Avoid_: write, save, best effort

**Núcleo de biblioteca**:
La superficie del producto centrada en explorar, verificar y corregir la colección musical y sus referencias.
_Avoid_: modo normal, app principal, dashboard general

**Estudio de recursos**:
La superficie avanzada del producto dedicada a inspeccionar y editar Recursos VirtualDJ específicos fuera del flujo principal de biblioteca.
_Avoid_: extras, utilidades varias, cajón de sastre

**Browser VirtualDJ**:
La superficie de navegación de VirtualDJ que organiza Folder List, File List, Sideview y File Info.
_Avoid_: biblioteca, base de datos, colección

**Playlist VirtualDJ**:
Una lista tratada por VirtualDJ como concepto de Database, aunque se visualice dentro del Folder List del Browser.
_Avoid_: carpeta normal, simple filtro de navegación

**History VirtualDJ**:
El registro organizado por fechas de pistas reproducidas, tratado por VirtualDJ como concepto de Database y mostrado en el Folder List.
_Avoid_: log técnico, carpeta cualquiera

**Browser de biblioteca**:
El módulo principal del Núcleo de biblioteca que presenta y navega la Biblioteca VirtualDJ mediante vistas como Biblioteca, Playlists e History.
_Avoid_: página Songs, pestaña accidental, router por inercia

**Entrada descubierta**:
Un archivo encontrado por el Browser de biblioteca en almacenamiento local que aún no forma parte de `database.xml`.
_Avoid_: song sintética, archivo externo genérico, fake SongSummary

**Catalogación explícita**:
El flujo controlado que convierte una Entrada descubierta en información persistida dentro de `database.xml` mediante validación y commit deliberado.
_Avoid_: autoimport, save casual, promoción implícita

**Verificación de integridad**:
El diagnóstico de la Biblioteca VirtualDJ que detecta referencias rotas, archivos faltantes y otras inconsistencias sin ser dueño del flujo de corrección.
_Avoid_: relink, reparación, fixer

**Reconciliación de rutas**:
El flujo especializado que corrige una referencia rota de la Biblioteca VirtualDJ para volver a alinearla con la ubicación real del archivo sin reinterpretar su metadata musical.
_Avoid_: verify, scan genérico, parche casual

**Colisión de referencia**:
La situación en la que una ruta elegida para reconciliación ya pertenece a otra entrada de la Biblioteca VirtualDJ.
_Avoid_: relink exitoso, merge implícito, duplicado inocente

**Renombrado**:
La mutación crítica que cambia el nombre de un archivo sin cambiar la carpeta en la que vive.
_Avoid_: move, relocate, cambio de ubicación

**Remoción de biblioteca**:
La mutación crítica que quita una entrada catalogada de la Biblioteca VirtualDJ, ya sea retirando solo su referencia o además su archivo físico según la política elegida.
_Avoid_: delete genérico, purge, cleanup ambiguo

**Recuperación de mutación**:
El flujo que resuelve una Mutación crítica interrumpida antes de permitir nuevas Mutaciones críticas sobre esa Biblioteca VirtualDJ.
_Avoid_: warning técnico, retry casual, autoarreglo invisible

## Relationships

- La **Biblioteca VirtualDJ** contiene uno o más **Recursos VirtualDJ**
- Una **Mutación crítica** cambia uno o más **Recursos VirtualDJ**
- Una **Mutación crítica** falla si deja la **Biblioteca VirtualDJ** desalineada
- El **Núcleo de biblioteca** trabaja sobre la **Biblioteca VirtualDJ** como colección
- El **Estudio de recursos** trabaja sobre **Recursos VirtualDJ** individuales o especializados
- El **Browser VirtualDJ** presenta y navega conceptos de la **Biblioteca VirtualDJ**
- Una **Playlist VirtualDJ** y un **History VirtualDJ** pertenecen al dominio de la **Biblioteca VirtualDJ**, aunque aparezcan dentro del **Browser VirtualDJ**
- El **Browser de biblioteca** pertenece al **Núcleo de biblioteca**
- El **Browser de biblioteca** expone la colección general, las **Playlist VirtualDJ** y el **History VirtualDJ** sin cambiar su pertenencia al dominio de la **Biblioteca VirtualDJ**
- Una **Entrada descubierta** puede aparecer en el **Browser de biblioteca** sin pertenecer todavía a la **Biblioteca VirtualDJ** catalogada en `database.xml`
- La **Catalogación explícita** es la vía para que una **Entrada descubierta** pase a formar parte de la **Biblioteca VirtualDJ** catalogada en `database.xml`
- La **Verificación de integridad** detecta problemas dentro de la **Biblioteca VirtualDJ**
- La **Reconciliación de rutas** corrige referencias rotas detectadas durante la **Verificación de integridad**
- Una **Colisión de referencia** bloquea la **Reconciliación de rutas** y requiere revisión fuera de ese flujo
- El **Renombrado** conserva la ubicación del archivo y solo cambia su nombre
- La **Remoción de biblioteca** quita una entrada catalogada de la **Biblioteca VirtualDJ** sin reinterpretar su metadata musical
- La **Recuperación de mutación** resuelve una **Mutación crítica** interrumpida antes de habilitar nuevas **Mutaciones críticas** sobre la misma **Biblioteca VirtualDJ**

## Example dialogue

> **Dev:** "Si una **Mutación crítica** renombra un archivo y luego falla `database.xml`, ¿contamos éxito?"
> **Experto:** "No. La **Biblioteca VirtualDJ** debe quedar coherente o la mutación falla."

## Flagged ambiguities

- "base de datos" se usaba para referirse tanto a `database.xml` como al conjunto completo; resolución: `database.xml` es un **Recurso VirtualDJ**, mientras que el conjunto completo es la **Biblioteca VirtualDJ**.
- "la app" se usaba para mezclar el flujo central de colección con editores especializados; resolución: distinguir entre **Núcleo de biblioteca** y **Estudio de recursos**.
- "browser" se estaba usando como si fuera dueño del dominio de playlists e historial; resolución: el **Browser VirtualDJ** es la superficie de navegación, mientras que **Playlist VirtualDJ** y **History VirtualDJ** son conceptos de Database dentro de la **Biblioteca VirtualDJ**.
- "Songs" se estaba usando como si fuera el contenedor natural de toda la exploración de colección; resolución: el seam principal del núcleo será el **Browser de biblioteca**, no una página aislada.
- "archivo externo" se estaba usando para varias cosas distintas; resolución: una **Entrada descubierta** es un archivo visible en el Browser de biblioteca que todavía no está catalogado en `database.xml`.
- "importar" se estaba usando tanto para leer como para persistir; resolución: usar **Catalogación explícita** cuando una **Entrada descubierta** vaya a convertirse en información persistida dentro de `database.xml`.
- "missing files" y "relink" se estaban usando como si fueran el mismo flujo; resolución: **Verificación de integridad** diagnostica, mientras **Reconciliación de rutas** es dueña de la corrección.
- "delete" se estaba usando tanto para quitar de `database.xml` como para enviar a papelera; resolución: **Remoción de biblioteca** nombra la familia de mutación y explicita su modo.
- "recovery" se estaba usando como warning técnico o arreglo automático; resolución: **Recuperación de mutación** es un flujo explícito y acotado a una **Biblioteca VirtualDJ** concreta.
