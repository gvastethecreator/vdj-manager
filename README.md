# VDJ Manager

Centro operativo de escritorio para explorar, verificar y mantener una biblioteca de **VirtualDJ 8+** sin debilitar sus contratos de escritura.

Construido con **Tauri 2 + Rust**, **React 19**, **TypeScript 5**, **Vite 8** y **Tailwind CSS 4**. La ventana mínima soportada es 1180×720; móvil queda fuera de alcance.

## Workspaces

- **Dashboard**: cola de atención priorizada, próxima acción y métricas secundarias. Un análisis no ejecutado dice `Sin verificar`, nunca cero.
- **Biblioteca**: Browser unificado de Canciones y Playlists con árbol, tabla virtualizada y detalle. Usa tres paneles desde 1200 px y drawer por debajo.
- **Resolver problemas**: Faltantes, Tracks movidos, Duplicados y Huérfanos comparten resultados dentro de la biblioteca activa.
- **Operaciones**: move, rename literal y edición de tags por lote. Ejecutar exige una vista previa vigente para la selección y parámetros actuales.
- **Recursos**: Configuración, Pads y Mappers en un estudio común con dirty/save/revert y protección frente a pérdida de cambios.

La identidad visual conserva el violeta en dos temas: oscuro y claro.

## Inicio rápido

Requisitos: Bun 1.x, Rust con toolchain MSVC y Windows.

```powershell
bun install
bun run tauri dev
```

Para trabajar sólo con el frontend:

```powershell
bun run dev
```

El modo visual determinista se abre con URLs como:

```text
http://127.0.0.1:3000/?demo&page=dashboard&state=problem
http://127.0.0.1:3000/?demo&page=songs&state=dense
http://127.0.0.1:3000/?demo&page=dashboard&recovery=manual
```

`?demo` usa un adaptador en memoria: no invoca Tauri ni consulta archivos reales.

## Comandos

| Comando | Uso |
| --- | --- |
| `bun test` | Pruebas DOM y unitarias con Bun + Happy DOM |
| `bun run check` | Typecheck y lint sin modificar archivos |
| `bun run build` | Build frontend de producción |
| `bun run tauri dev` | App nativa en desarrollo |
| `bun run tauri build` | Binario e instaladores Tauri |

Gates Rust desde `src-tauri` y con MSVC inicializado:

```powershell
cargo test
cargo check
```

## Arquitectura

```text
src/
├── App.tsx                    # estado raíz, navegación, scope de errores y caches
├── components/
│   ├── Dialog.tsx             # Dialog/ConfirmDialog accesible
│   ├── Layout.tsx             # rail de 72 px, header y feedback contextual
│   ├── IntegrityWorkspace.tsx # shell de diagnóstico
│   ├── ResourceStudio.tsx     # shell del estudio de recursos
│   └── SongTable.tsx          # tabla virtualizada y edición inline
├── pages/                     # superficies por tarea
├── lib/
│   ├── navigation.ts          # NavigationState y aliases demo
│   ├── runtimeServices.ts     # adaptadores Tauri/demo
│   ├── paneLayout.ts          # vdj-layout-v2, clamping y breakpoint
│   └── uiError.ts             # UiError contextual
└── types/database.ts          # contratos TypeScript compartidos

src-tauri/src/
├── commands/                  # handlers IPC existentes
├── database/                  # parser/modelo XML
└── mutation/                  # backup, journal, lease y recovery
```

La explicación completa está en [docs/architecture.md](docs/architecture.md), los contratos de producto en [docs/ui/view-contracts.md](docs/ui/view-contracts.md) y el estado verificado en [docs/implementation-status.md](docs/implementation-status.md).

## Seguridad de escritura

- `database.xml` nunca se serializa completo desde el frontend.
- Tags, relink, rename, move y remoción identifican entradas por `originalFilePath`.
- Los writers crean backup, validan el XML, comprueban cambios concurrentes y hacen commit atómico.
- Rename/move usan journal por biblioteca, no reemplazan destinos y bloquean nuevas mutaciones durante recovery.
- Cross-drive usa copy/delete journalizado; una ambigüedad queda en revisión manual.
- Recursos VirtualDJ editables también crean backup antes de escribir.
- Las pruebas de mutación usan fixtures y carpetas temporales.

## Documentación útil

- [Arquitectura](docs/architecture.md)
- [Contratos de vistas](docs/ui/view-contracts.md)
- [Estado de implementación](docs/implementation-status.md)
- [Deuda técnica](docs/tech-debt.md)

Proyecto privado.
