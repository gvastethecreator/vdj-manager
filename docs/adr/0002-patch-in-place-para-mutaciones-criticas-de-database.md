# Patch-in-place para mutaciones críticas de `database.xml`

Las mutaciones críticas sobre `database.xml` usarán escritura **patch-in-place** sobre el XML original, identificarán canciones por `FilePath` original con chequeos optimistas, y mantendrán un journal persistido para operaciones multi-paso de alto riesgo. Elegimos esta estrategia porque el serializer actual basado en structs pierde XML desconocido y porque las operaciones que combinan filesystem + base de datos necesitan consistencia recuperable sin depender de índices posicionales frágiles.
