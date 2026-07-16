# Deuda técnica

Actualizado: 2026-07-15, después del rediseño de workspaces.

No quedan blockers ni P1 conocidos del rediseño. Esta lista contiene mejoras posteriores que no invalidan los contratos actuales.

## Prioridad alta

### Descomponer superficies grandes

- `SongTable.tsx` todavía reúne virtualización, columnas, audio, edición, rating y color.
- `Songs.tsx`, `Pads.tsx` y `Mappers.tsx` combinan carga, navegación y editor.
- Extraer hooks y subcomponentes sólo con pruebas de comportamiento; no duplicar estado ni romper la identidad por `originalFilePath`.

### Automatizar navegador en CI

- El harness DOM cubre Dialog, errores, navegación, tema, paneles y teclado de tabla.
- La verificación browser real existe como misión local y evidencia PNG, pero aún no corre en CI.
- Añadir una matriz representativa 1180/1280/1440, dark/light y reduced motion sin convertir cada combinación en una captura redundante.

### Observabilidad del backend

- Rust todavía carece de logging estructurado de cargas, parsing y mutaciones.
- Adoptar `tracing` o `log` sin registrar rutas sensibles ni contenido XML completo.

### Hardening residual de mutaciones

- Aislar el serializer histórico completo, mantenido sólo para pruebas de pérdida de fidelidad.
- Definir soporte controlado para insertar tags en entradas `<Song .../>` autocerradas; hoy se aborta de forma segura.
- Evaluar aliases físicos extremos de Windows (junctions y nombres 8.3) más allá de la normalización léxica.
- Decidir si settings, mappers y pads deben compartir el mismo gate de recovery que `database.xml`.

## Prioridad media

### Invalidación y tareas asíncronas

- Integridad conserva resultados por biblioteca activa y los invalida al recargar o cambiar alcance.
- Playlists, carga de biblioteca y previews Batch descartan respuestas tardías, pero conviene extraer un helper común de request tokens y ampliar pruebas de carrera con servicios controlados.
- Reducir recargas globales después de mutaciones sin perder stats, reportes parciales ni evidencia de recovery.

### Recursos y playlists

- Añadir validaciones semánticas de bindings de Mappers y un editor de Pads más específico que el árbol XML genérico.
- Implementar CRUD de playlists y edición de contenido; hoy el Browser sólo lista, importa y lee.

### Accesibilidad continua

- La base actual incluye foco visible, diálogos con trap/restauración, filas y edición inline por teclado, splitters Home/End y contraste ≥4.5:1.
- Siguiente paso: automatizar auditoría semántica/contraste en CI y probar screen readers sobre las tablas virtualizadas.

### Internacionalización

- El producto está en español hardcoded. Extraer strings sólo si aparece un requisito real de segundo idioma.

## Prioridad baja

- Revisar periódicamente dependencias Rust/JS y presupuesto de bundle.
- Añadir telemetría local opt-in para tiempos de scans si puede hacerse sin exponer rutas.
- Evaluar una caché persistente de waveforms/resultados con invalidación por identidad física.
