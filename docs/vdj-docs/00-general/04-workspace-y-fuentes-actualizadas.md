# Workspace y fuentes oficiales actualizadas

_Actualizado el 26 de marzo de 2026._

Este documento aterriza tres decisiones prácticas para trabajar mejor en `Luna`:

1. qué archivo manda hoy;
2. cómo debe quedar configurado el workspace;
3. qué documentación oficial conviene tomar como referencia viva.

## Estado real del proyecto

- `Luna.xml` es la fuente de verdad actual.
- En este workspace **no existe** hoy un flujo modular operativo (`src/`, scripts de build o tareas heredadas).
- El archivo principal **sí es XML bien formado**, así que el problema actual no es de sintaxis base sino de organización, cobertura funcional y mantenimiento.
- La carpeta `D:\Documents\VirtualDJ\Skins\Default` debe tratarse como referencia de implementación, especialmente:
  - `Pro.xml`
  - `Performance.xml`

## Configuración recomendada del workspace

Se añadió una carpeta `.vscode/` con cuatro piezas útiles:

- `settings.json`
  - fuerza un contexto consistente para editar XML y Markdown;
  - activa validación/formatting XML del editor;
  - excluye imágenes pesadas del buscador para que la navegación sea menos ruidosa.
- `extensions.json`
  - recomienda `Red Hat XML` para resaltado, plegado, símbolos y validación XML;
  - recomienda extensiones de Markdown para mantener la documentación limpia.
- `tasks.json`
  - `Validar Luna.xml`: comprueba que el XML sea bien formado;
  - `Auditar clases de Luna.xml`: lista clases referenciadas sin `define` y clases duplicadas.
- `vdj-skin.code-snippets`
  - añade snippets básicos para `define`, `button`, `panel`, `deck`, `visual` y `slider`.

## Qué dice hoy la documentación oficial

### Developers / Skin SDK

Fuentes revisadas:

- `https://www.virtualdj.com/wiki/Developers.html`
- `https://www.virtualdj.com/wiki/SkinSDK8.html`
- `https://www.virtualdj.com/wiki/modifyaskin.html`

Puntos confirmados:

- Los archivos XML del ecosistema de VirtualDJ deben guardarse en **UTF-8**.
- El flujo recomendado para partir del skin oficial sigue siendo:
  1. abrir `Settings > Interface`;
  2. seleccionar el skin por defecto;
  3. usar **Edit this skin** para extraerlo.
- Un skin sigue siendo, conceptualmente, un paquete con:
  - imagen PNG principal;
  - archivo XML del skin;
  - preview opcional.
- El `Skin SDK` sigue considerando que los `define` deben estar al principio del skin para ser reutilizados después.

### Atributos globales y contenedores

Fuentes revisadas:

- `https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html`
- `https://www.virtualdj.com/wiki/Skin%20SDK%20Panel.html`
- `https://www.virtualdj.com/wiki/Skin%20Define.html`
- `https://www.virtualdj.com/wiki/Skin%20Button.html`

Puntos prácticos para Luna:

- Conviene preferir `<deck>` y `<panel>` anidados por encima de repetir `deck="..."` o `panel="..."` en muchos elementos sueltos.
- Si muchas piezas comparten visibilidad, la documentación oficial recomienda agruparlas en `<panel>` o `<group>` para simplificar código y evitar duplicación.
- `<define>` sigue siendo el mecanismo principal para reutilizar patrones de UI y colores.
- `<button>` continúa soportando tanto gráficos desde atlas PNG como botones dibujados por código (`shape`, `color`, `border`, `radius`, `gradient`).

### Colores: referencia vieja vs referencia vigente

Fuentes revisadas:

- `https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html`
- `https://www.virtualdj.com/manuals/virtualdj/appendix/defaultcolors.html`

Conclusión:

- La tabla clásica de colores predefinidos del SDK sigue siendo útil para el markup del skin.
- La documentación del manual aporta contexto más nuevo sobre el sistema de `colorPicker` y sus modos:
  - `Auto`
  - `Gradient`
  - `Simple`
  - `System`
- También confirma que se pueden usar valores `Hex`, `RGB` y nombres comunes de color como entrada válida en varios flujos de VirtualDJ.

## Qué faltaba realmente tras cruzar las fuentes

Después de revisar `Developers`, `Skin SDK`, `VDJscript` y enlaces oficiales relacionados, el hueco principal no estaba en VDJScript ni en los elementos individuales del SDK, sino en la **referencia general de arquitectura**:

- el contrato del nodo raíz `<skin>`;
- la lista maestra de hijos directos reconocidos por el SDK;
- la distinción entre elementos normales y contenedores (`group`, `panel`, `deck`, `window`, `splitpanel`, `stack`);
- el papel de `breakline` y `breakline2` en skins redimensionables;
- la nota de empaquetado sobre `window_images.png` para `<window>`.

La mayor parte del resto ya estaba razonablemente cubierta en `docs/`:

- VDJScript base, ejemplos y verbos;
- `define`, propiedades globales y posicionamiento;
- iconos y colores por defecto;
- browser, custom browser, split panels, split windows y stack.

Para cerrar ese faltante se añadió:

- `docs/05-referencias-tecnicas/12-sdk-skin-raiz-y-estructura.md`

Ese archivo pasa a ser la referencia local para entender el SDK “desde arriba”, antes de bajar a cada elemento concreto.

## Cómo usar el skin por defecto como benchmark

El default skin muestra un patrón mucho más estable que Luna hoy:

1. gran bloque de `class_defines` al inicio;
2. topbar y layout separados con claridad;
3. áreas funcionales agrupadas por responsabilidad;
4. variaciones (`Pro`, `Performance`, etc.) con consistencia estructural.

Para Luna esto sugiere una regla simple:

- primero estabilizar `define` + layout base;
- luego cerrar paridad funcional por áreas;
- después recién pensar en modularizar en varios XML.

## Regla de trabajo recomendada

Hasta nuevo aviso:

- editar directamente `Luna.xml`;
- validar con la tarea del workspace;
- contrastar con `Default\Pro.xml` o `Default\Performance.xml` antes de introducir nuevas áreas grandes;
- documentar toda desviación deliberada respecto al skin oficial.

## Prioridades inmediatas

1. Mantener el workspace cómodo y repetible.
2. Convertir la auditoría en checklist operativo por áreas.
3. Resolver referencias de clases faltantes antes de sumar nuevas features.
4. Usar el default skin como baseline estructural, no como destino creativo.
