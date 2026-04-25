# Deuda técnica y mejoras pendientes

Listado priorizado de mejoras que quedan fuera del alcance de la puesta a punto
inicial pero que conviene abordar a medio plazo.

## Prioridad alta

### Refactor de componentes monolíticos

- `src/components/SongTable.tsx` concentra demasiadas responsabilidades: virtualización, inline edit, rating, color picker, audio preview, columnas y estado UI.
- `src/pages/Songs.tsx`, `src/pages/Pads.tsx` y `src/pages/Mappers.tsx` también están creciendo hacia pantallas “todoterreno”.
- Prioridad: partir por hooks/helpers/subcomponentes antes de seguir agregando features.

### Escrituras y recálculos demasiado globales

- Ya se corrigió la recarga de página en `reload()` y el batch tag ahora escribe una sola vez.
- Sigue pendiente reducir más operaciones globales en flujos como rename/move/delete y separar refresco de `songs` frente a recálculo de `stats` cuando no haga falta.

### Documentación viva del producto

- `README.md` y `docs/architecture.md` deben mantenerse alineados con nuevas vistas y capacidades.
- Conviene institucionalizar esto en PR checklist o CI para que no vuelvan a quedarse atrás.

### Tests unitarios y de integración

- No hay tests actualmente (ni frontend ni Rust).
- **Frontend**: añadir Vitest + Testing Library para componentes y hooks.
- **Rust**: añadir tests con `#[cfg(test)]` para el parser XML y las
  funciones de duplicados/verificación.

### Logging en Rust (backend)

- El backend no emite logs estructurados.
- Integrar `tracing` o `log` + `env_logger` para registrar operaciones
  (cargas, escrituras, errores de parsing).

## Prioridad media

### Validaciones semánticas de recursos VirtualDJ

- `Mappers.tsx` ya edita `.vdjmap` de forma estructurada, pero aún faltan validaciones de negocio sobre bindings, acciones vacías o atributos inconsistentes.
- `Pads.tsx` ya no es solo texto, pero todavía usa un editor XML genérico; falta subirlo a editor semántico de pads.

### CRUD de playlists

- La app ya lista y lee playlists/History en árbol.
- Falta crear, renombrar, mover y borrar playlists desde la UI, además de editar su contenido.

### CI / CD

- No hay pipeline.
- Configurar GitHub Actions con:
  - `cargo check` + `cargo clippy`
  - `bun run typecheck` + `bun run lint`
  - `bun run build`
  - (Opcional) `tauri-action` para builds multiplataforma.

### Internacionalización (i18n)

- Todo el UI está en español hardcoded.
- Si se necesita soporte multiidioma, extraer cadenas a archivos de
  traducción con `react-i18next` u otra librería ligera.

### Accesibilidad (a11y)

- Revisar contraste de la paleta sobre fondos oscuros (especialmente temas claros).
- Añadir `aria-label` / `role` donde falten (sidebar, modales, tablas).
- Asegurar navegación completa por teclado.

## Prioridad baja

### Caché de resultados IPC

- `AppState` ya cachea `songs` y `stats`, y las ediciones inline ya parchean canciones en memoria.
- Aún falta definir invalidación más fina para stats/duplicados/verificaciones sin depender tanto de recargas completas.

### Animaciones en páginas secundarias

- GSAP solo anima Home y Dashboard actualmente.
- Se podrían añadir transiciones de entrada sutiles a Songs, Duplicates,
  etc., reutilizando los presets de `animations.ts`.

### Bundle size

- GSAP (~50 KB gzip) es el paquete más pesado del frontend.
- Si las animaciones se mantienen simples, valorar reemplazarlo por
  CSS animations o la Web Animations API.

### Actualización de dependencias Rust

- `quick-xml 0.37` funciona bien pero no es la última major.
- Revisar periódicamente actualizaciones de quick-xml, serde, tokio y
  las dependencias de Tauri.
