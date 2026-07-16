# Evidencia visual del rediseño radical

## Baseline

Capturada el 2026-07-15 sobre `http://127.0.0.1:3000/?demo=1&page=<alias>`, Chromium headless, tema oscuro y `prefers-reduced-motion: reduce`.

- `baseline/home-dark-1440x900.png`
- `baseline/dashboard-dark-{1180x720,1280x800,1440x900}.png`
- `baseline/songs-dark-{1180x720,1280x800,1440x900}.png`
- `baseline/batch-dark-1440x900.png`
- `baseline/configs-dark-1440x900.png`

Hallazgos visibles:

- Dashboard prioriza ocho métricas equivalentes y deja el resto del viewport sin decisión ni acción.
- Sidebar permanente consume 220 px y duplica la arquitectura en doce destinos.
- Songs subordina la tabla a un detalle permanente grande; paths y metadata densa sufren.
- Batch mantiene la tabla en una región angosta y la configuración se presenta como cards apiladas.
- Configs en demo muestra `TypeError ... invoke` como error global: el modo demo todavía cruza el borde Tauri.

El detector estático registró 213 leads (1 P1 del propio harness y 156 P2, principalmente tiny text, scrollbars, motion y `transition-all`). El runtime del harness quedó bloqueado por un `ReferenceError: text is not defined` dentro de su `page.evaluate`; las capturas se repitieron con Playwright directo y fueron inspeccionadas. Ese error pertenece al harness, no a la app.

## Final

Se completará con capturas comparables en `final/`, ledger de finish y rutas/estados exactos tras los gates.

