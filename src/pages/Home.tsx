import { FolderOpen, Disc3, Music, X, BarChart3, Copy, FileWarning, Folder, Wrench, ShieldCheck, History } from "lucide-react";
import { useApp } from "../App";
import { UiErrorNotice } from "../components/UiErrorNotice";

/** Landing page — clean folder selection and quick-start with GSAP entrance. */
export function Home() {
    const {
        selectFolder,
        selectMusicFolder,
        loadFromFolder,
        loading,
        uiError,
        clearUiError,
        musicFolders,
        removeMusicFolder,
        lastVdjFolder,
    } = useApp();

    const FEATURES = [
        { icon: BarChart3, title: "Dashboard", desc: "Estadísticas y análisis de tu colección" },
        { icon: Music, title: "Canciones", desc: "Navega, filtra y edita tags inline" },
        { icon: Copy, title: "Duplicados", desc: "Detecta duplicados por nombre, tamaño o hash" },
        { icon: FileWarning, title: "Archivos", desc: "Encuentra faltantes y huérfanos" },
        { icon: Wrench, title: "Operaciones", desc: "Renombra y mueve archivos en lote" },
    ];

    return (
        <div className="flex min-h-full items-center justify-center bg-background p-6">
            <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.05fr_.95fr]">
                {/* Hero */}
                <section className="home-hero card p-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/14 ring-1 ring-primary/25">
                            <Disc3 className="h-8 w-8 text-primary-light" />
                        </div>
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase text-primary-light">VirtualDJ database toolkit</p>
                            <h1 className="text-3xl font-bold leading-tight text-text">VDJ Database Manager</h1>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
                                Gestiona tu base de datos de VirtualDJ: analiza, edita tags, detecta duplicados y organiza tu colección con backups antes de escribir.
                            </p>
                        </div>
                    </div>

                    <div className="home-actions mt-7 space-y-3">
                        <button
                            onClick={selectFolder}
                            disabled={loading}
                            className="btn btn-primary btn-lg w-full justify-center"
                        >
                            <FolderOpen className="h-5 w-5" />
                            Seleccionar Carpeta VirtualDJ
                        </button>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <button
                                onClick={() => loadFromFolder("D:\\Documents\\VirtualDJ")}
                                disabled={loading}
                                className="btn btn-ghost justify-start text-[12px]"
                            >
                                <Folder className="h-3.5 w-3.5" />
                                Ruta por defecto
                            </button>

                            {lastVdjFolder && lastVdjFolder !== "D:\\Documents\\VirtualDJ" && (
                                <button
                                    onClick={() => loadFromFolder(lastVdjFolder)}
                                    disabled={loading}
                                    className="btn btn-ghost justify-start text-[12px]"
                                    title={lastVdjFolder}
                                >
                                    <History className="h-3.5 w-3.5" />
                                    Última sesión
                                </button>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
                            <div className="spinner" />
                            Cargando base de datos...
                        </div>
                    )}

                    {uiError ? <div className="mt-4"><UiErrorNotice error={uiError} onDismiss={clearUiError} /></div> : null}

                    <div className="mt-6 rounded-lg border border-success/20 bg-success/8 p-3">
                        <div className="flex items-center gap-2 text-success">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[12px] font-semibold">Cambios protegidos por backup</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                            Las escrituras de database.xml y recursos de VirtualDJ crean copia previa y usan escritura atómica.
                        </p>
                    </div>
                </section>

                <section className="space-y-5">
                    <div className="home-features grid gap-2 sm:grid-cols-2">
                        {FEATURES.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="card flex items-start gap-3 p-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/70 text-primary-light ring-1 ring-border">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[12px] font-semibold text-text">{title}</span>
                                    <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Music folders configuration */}
                    <div className="home-extra card p-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-text">Carpetas de música</h3>
                            <p className="mt-0.5 text-[10px] text-text-muted">
                                Carpetas adicionales para búsqueda de faltantes, huérfanos y navegación.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={selectMusicFolder}
                            disabled={loading}
                            className="btn btn-ghost btn-sm shrink-0"
                        >
                            <Music className="h-3.5 w-3.5" />
                            Agregar
                        </button>
                    </div>

                    {musicFolders.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {musicFolders.map((folder) => (
                                <div
                                    key={folder}
                                    className="flex items-center gap-2 rounded-md border border-border/60 bg-background/45 px-2 py-1.5"
                                >
                                    <Folder className="h-3 w-3 shrink-0 text-primary-light" />
                                    <span className="min-w-0 flex-1 truncate text-[10px] text-text" title={folder}>
                                        {folder}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeMusicFolder(folder)}
                                        className="shrink-0 text-text-muted hover:text-error"
                                        title="Quitar carpeta"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </section>
            </div>
        </div>
    );
}
