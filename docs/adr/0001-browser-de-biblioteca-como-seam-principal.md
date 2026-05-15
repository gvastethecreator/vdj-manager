# Browser de biblioteca como seam principal del núcleo

El núcleo de la aplicación se organiza alrededor de un **Browser de biblioteca** en lugar de tratar `Songs`, `Playlists` e `History` como páginas soberanas. Elegimos esta forma porque alinea la arquitectura con la terminología oficial de VirtualDJ —donde el Browser es la superficie de navegación y Playlists/History son conceptos de Database— y porque concentra la exploración de colección en un seam más profundo, testeable y menos propenso a duplicación.
