# SDK base: raíz del `<skin>` y mapa de estructura

_Actualizado el 26 de marzo de 2026._

Fuentes oficiales principales:

- `https://www.virtualdj.com/wiki/Skin%20SDK%208.html`
- `https://www.virtualdj.com/wiki/Skin%20Define.html`
- `https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html`

Este documento cubre el hueco que quedaba en la documentación local: la **vista general del SDK** desde la página raíz oficial. La mayoría de los elementos concretos ya estaban documentados por separado; lo que faltaba era el mapa maestro de cómo se organiza un skin completo desde arriba.

## Qué es un skin según el SDK oficial

Un skin de VirtualDJ se distribuye como un `.zip` que normalmente contiene:

- `image_name.png`
- `skincode_name.xml`
- `preview_image.png` _(opcional)_
- `window_images.png` _(opcional, para elementos `<window>`)_

Notas prácticas:

- El PNG principal contiene tanto el fondo/base visual como los atlas de estados y gráficos auxiliares.
- El XML describe qué hace cada elemento, dónde se dibuja y qué recursos utiliza.
- Si el XML y la imagen principal comparten nombre base, el atributo `image` puede omitirse.

## Contrato del elemento raíz `<skin>`

La página oficial del SDK define este patrón general:

```xml
<skin name="" version="" width="" height="" nbdecks="" comment="" image="" author="" preview="" breakline="" breakline2="">
  <element />
</skin>
```

### Atributos del nodo raíz

| Atributo | Uso | Relevancia para Luna |
| --- | --- | --- |
| `name` | Nombre visible del skin. Puede diferir del nombre del `.zip`. | Conviene usarlo para distinguir variantes o builds de trabajo. |
| `version` | Versión del SDK; para VirtualDJ 8, el valor esperado es `8`. | Debe mantenerse explícito para evitar ambigüedad. |
| `width` | Ancho base del skin en píxeles. | Es la referencia geométrica del layout completo. |
| `height` | Alto base del skin en píxeles. | Igual de crítico que `width` para validar zonas y offsets. |
| `nbdecks` | Número de decks soportados por el skin. Opcional. | Útil para dejar clara la intención 2/4 decks. |
| `comment` | Comentario o información extra del skin. Opcional. | Bueno para anotar variante, stage o compatibilidad. |
| `author` | Autor del skin. Opcional. | Recomendable para trazabilidad. |
| `image` | Archivo gráfico principal. Opcional si coincide con el nombre del XML. | Ayuda si se separan nombres o variantes. |
| `preview` | Imagen de preview mostrada en configuración. | Recomendable para seleccionar la skin desde interfaz. |
| `breakline` | Primera línea de estirado del browser en skins redimensionables. | Importante si Luna quiere soportar resizing limpio. |
| `breakline2` | Segunda línea de estirado del browser. | Igual de importante que `breakline` cuando el browser es flexible. |

## Reglas importantes que salen de la portada del SDK

### 1. `<define>` debe ir al principio

La documentación oficial insiste en que los `define` deben declararse al comienzo del skin para que puedan reutilizarse después. Esto encaja con la decisión ya tomada para Luna: primero estabilizar definiciones/clases y luego el layout.

### 2. El browser estirable depende de `breakline`/`breakline2`

La página raíz del SDK aclara algo fácil de pasar por alto: las `breakline` controlan la zona vertical que se estira o comprime cuando el skin cambia de tamaño.

Consecuencias prácticas:

- no conviene que esas líneas atraviesen botones u otros widgets fijos;
- la zona elástica debería caer sobre el área del browser;
- una mala elección de `breakline` deforma el layout aunque el XML “parezca correcto”.

### 3. `<window>` añade una dependencia de assets

Si se usan elementos `<window>`, el paquete puede necesitar `window_images.png`. No es sólo una decisión estructural: también afecta empaquetado y recursos gráficos.

## Hijos directos reconocidos por la página raíz del SDK

La portada oficial del SDK enumera qué elementos pueden ser hijos del nodo `<skin>`.

### Elementos funcionales y visuales

- `button`
- `slider`
- `rhythmzone`
- `scratchwave`
- `blockwave`
- `beattunnel`
- `equalizer`
- `songpos`
- `scratch`
- `textzone`
- `visual`
- `dropzone`
- `menu`
- `optionsmenu` _(video skins)_
- `browser`
- `coverflow`
- `browserinfo`
- `prelisten`
- `edit`
- `cover`
- `logo`
- `video`

### Elementos de soporte / infraestructura

- `define`
- `font`
- `customicons`
- `grabzone`
- `oninit`
- `resizezone`
- `draw` / formas simples (`square`, `circle`, `line`)

### Piezas del browser personalizado que el SDK también reconoce desde la raíz

Aunque su documentación detallada vive en la guía de Custom Browser, la página raíz del SDK lista también estos elementos como hijos válidos:

- `folderlist`
- `fileview`
- `sideview`
- `filelist`
- `browsertoolbar`
- `browsertoolbartree`

Esto es importante porque confirma que el browser personalizado no es un “apaño lateral”, sino parte del modelo oficial del SDK.

## Contenedores oficiales

La página raíz también distingue los **containers** que pueden anidar otros elementos:

- `group`
- `panel`
- `deck`
- `window`
- `splitpanel`
- `stack`

Lectura práctica para Luna:

- `group` sirve para mover bloques juntos y compartir contexto;
- `panel` sirve para visibilidad y agrupación funcional;
- `deck` limpia muchísimo el código cuando varias piezas pertenecen al mismo deck;
- `window` y `splitpanel` abren layouts más complejos, pero exigen diseño más disciplinado;
- `stack` sirve para alternar o superponer vistas de forma estructurada.

## Relación con la documentación local existente

Tras cruzar la portada oficial con `docs/**`, la cobertura quedó así:

### Ya cubierto localmente

- `define` → `docs/01-desarrollo-basico/01-definiciones-elementos.md`
- propiedades globales → `docs/01-desarrollo-basico/03-propiedades-elementos.md`
- posicionamiento → `docs/01-desarrollo-basico/02-posicionamiento-elementos.md`
- panel → `docs/05-referencias-tecnicas/08-sdk-panel.md`
- textzone → `docs/05-referencias-tecnicas/09-sdk-textzone.md`
- visual → `docs/05-referencias-tecnicas/10-sdk-visual.md`
- dropzone → `docs/05-referencias-tecnicas/07-sdk-dropzone.md`
- browser / custom browser / browser window →
  - `docs/03-componentes-visuales/13-navegador.md`
  - `docs/03-componentes-visuales/15-navegador-personalizado.md`
  - `docs/03-componentes-visuales/16-navegador-ventana.md`
- split panel / split window / stack →
  - `docs/04-scripting-avanzado/05-paneles-divididos.md`
  - `docs/04-scripting-avanzado/06-ventanas-divididas.md`
  - `docs/03-componentes-visuales/11-stack.md`

### Lo que faltaba y cubre este archivo

- el contrato del nodo raíz `<skin>`;
- la lista maestra de hijos directos del SDK;
- la distinción oficial entre elementos y contenedores;
- el papel de `breakline` / `breakline2` en skins redimensionables;
- la nota de empaquetado sobre `window_images.png` para `<window>`.

## Recomendaciones concretas para Luna

1. Tratar el nodo `<skin>` como contrato de arquitectura, no sólo como cabecera.
2. Mantener los `define` al inicio y revisar si toda clase crítica está declarada antes de usarse.
3. Si Luna quiere layout flexible con browser estirable, planificar explícitamente `breakline` y `breakline2`.
4. Seguir prefiriendo contenedores (`deck`, `panel`, `group`) sobre atributos repetidos por elemento.
5. Si se introducen `window` o layouts partidos más agresivos, reservar desde el principio la estrategia de recursos gráficos asociada.

## Resumen corto

La documentación local ya cubría bastante bien los elementos individuales del SDK. Lo que faltaba era la **vista aérea**: qué es exactamente un skin para el SDK, cómo se declara su raíz y qué piezas son oficialmente válidas desde ese nivel. Este archivo cierra ese hueco para que Luna tenga tanto el detalle como el mapa general.
