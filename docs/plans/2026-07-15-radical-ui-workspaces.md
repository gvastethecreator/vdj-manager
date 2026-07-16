# Rediseño radical de workspaces — plan de implementación

Fecha: 2026-07-15  
Estado: cerrado y verificado
Dirección: **Centro operativo**

## Resultado buscado

VDJ Manager pasa de una colección de páginas y cards a un centro operativo de escritorio. La primera lectura debe responder qué requiere atención, por qué y cuál es la próxima acción segura. La tabla de biblioteca y el recurso editado son los artefactos dominantes de sus workspaces; navegación, diagnósticos y metadata quedan subordinados.

Se preservan los contratos Rust, formatos XML, identidad por `originalFilePath`, backups, journal y bloqueo de mutaciones durante recovery.

## Contrato de misión

| Campo | Valor |
| --- | --- |
| Artefacto y resultado | App Tauri/React operable por teclado, legible y verificable en escritorio |
| Modo | `change` |
| Dentro de alcance | Fundaciones accesibles, shell, navegación, Dashboard, Biblioteca, Integridad, Batch, Recursos, demo, tests y docs |
| Fuera de alcance | Comandos Rust nuevos, cambios XML, mutaciones, producción, rutas reales de música y móvil |
| Baseline | `docs/design/screenshots/radical-ui/baseline/` + contratos aprobados |
| Stop | Diez loops válidos, Loop 10=`stop`, cero blocker/P1 y gates finales honestos |

## Decisiones de producto

- Registro: `product`.
- Arquetipo primario: centro de operaciones; Biblioteca y Recursos son regiones `workbench` delimitadas.
- Firma: **cola de atención con estado, evidencia y próxima acción**.
- Shell: rail de 72 px; expansión temporal como overlay, no columna permanente.
- Navegación: Dashboard, Biblioteca, Resolver problemas, Operaciones y Recursos.
- Paleta: violeta oscuro/claro. El violeta identifica selección/foco; estados semánticos conservan colores propios.
- Movimiento: sólo feedback funcional; contenido esencial nunca parte invisible. `prefers-reduced-motion` elimina desplazamiento y giro no esencial.
- Viewports: 1180×720 mínimo, 1280×800 estándar, 1440×900 amplio. Móvil no soportado.

## Interfaces internas

### `NavigationState`

```ts
type Workspace = "home" | "dashboard" | "library" | "integrity" | "operations" | "resources";
type NavigationState = { workspace: Workspace; section?: string };
```

Los aliases históricos `?demo&page=` se traducen en el borde y permanecen válidos para evidencia. La UI deja de acoplarse a `page/setPage`.

### `UiError`

```ts
interface UiError {
  scope: string;
  summary: string;
  detail?: string;
}
```

El error se presenta junto al trabajo que falló, con detalle desplegable y una recuperación útil. Cambiar de scope limpia errores obsoletos.

### `RuntimeServices`

El adaptador real encapsula IPC/dialog/asset URLs de Tauri. El adaptador demo devuelve fixtures deterministas y nunca importa ni invoca capacidades Tauri en su ruta de ejecución.

### `PaneLayout`

`vdj-layout-v2` guarda versión y anchos. La lectura valida números finitos, aplica límites y vuelve al default ante payload inválido. Separadores soportan flechas, Home/End y reset.

## Fases y commits

1. Documentación, baseline, contratos y dirección.  
   Commit: `docs: define radical UI workspace overhaul`
2. Dialog/ConfirmDialog, UiError, RuntimeServices, tema, motion y harness DOM.  
   Commit: `feat: add accessible UI foundations`
3. Rail/sidebar, header, Home, Dashboard y Recovery.  
   Commit: `feat: redesign shell and operational dashboard`
4. Biblioteca unificada con paneles y drawer.  
   Commit: `feat: unify library browser workspace`
5. Integridad + Batch y luego Estudio de recursos.  
   Commits: `feat: consolidate integrity and batch workflows`, `feat: redesign VirtualDJ resource studio`
6. Autopsia, revisión independiente, gates finales y docs cerradas.  
   Commit: `docs: close UI overhaul verification`

## Gate manifest

| Gate | Aplicación | Evidencia requerida | Estado final |
| --- | --- | --- | --- |
| Scope | requerida | diff contra interfaces y backend fuera de alcance | passed; comandos Rust/XML sin cambios |
| Baseline | requerida | capturas comparables | passed |
| Regresión | requerida | tests DOM/helpers + suites existentes | passed; 49 frontend + gates Rust finales |
| Runtime | requerida | navegador real sobre demo determinista | passed; Chromium sin errores de página/consola en matriz final |
| Estados | requerida | healthy/problem/recovery/error/dirty/empty/dense/long | passed; evidencia en `.scratch/evidence/radical-ui/phase6-final/` |
| Viewport | requerida | 1180×720, 1280×800, 1440×900 | passed; se añadió límite exacto 1200×800 |
| Teclado/foco | requerida | diálogo, rail, tabs, splitters, drawer | passed; DOM + browser |
| Tema | requerida | dark/light + migración | passed; contraste normal mínimo >4.5:1 |
| Seguridad | requerida | fixtures/temp; sin rutas reales | passed; sólo demo/fixtures/temporales |
| Dirección | requerida | tres tesis + elección + firma/substracción | passed; lectura ciega eligió A y se corrigió la ambigüedad entre seguridad de mutación e integridad sin verificar |
| Revisión independiente | requerida | reviewer fresco sobre evidencia final | passed; veredicto 0 blocker / 0 P1 |
| Autopsia adversarial | requerida | objeción fuerte reparada o severidad explícita | passed; carreras, retry, teclado, clamping y estados reparados |

## Verificación

Checks focalizados cierran cada slice. Al final se ejecutan una sola vez:

```powershell
bun test
bun run check
bun run build

# Desde src-tauri y con toolchain MSVC inicializado
cargo test
cargo check
bun run tauri build
```

Las pruebas y capturas usan exclusivamente `?demo` y carpetas temporales. Ningún gate autoriza acceder a una Biblioteca VirtualDJ real.
