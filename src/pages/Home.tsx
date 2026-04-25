import { useRef, useEffect } from "react";
import { FolderOpen, Disc3, Music, X, BarChart3, Copy, FileWarning, Folder, Wrench } from "lucide-react";
import gsap from "gsap";
import { useApp } from "../App";
import { EASE, DURATION } from "../lib/animations";

/** Landing page — clean folder selection and quick-start with GSAP entrance. */
export function Home() {
    const {
        selectFolder,
        selectMusicFolder,
        loadFromFolder,
        loading,
        error,
        musicFolders,
        removeMusicFolder,
        lastVdjFolder,
    } = useApp();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".home-hero", { autoAlpha: 0, y: 30, duration: DURATION, ease: "back.out(1.4)" });
            gsap.from(".home-actions > *", { autoAlpha: 0, y: 16, duration: DURATION, ease: EASE, stagger: 0.08, delay: 0.2 });
            gsap.from(".home-features > *", { autoAlpha: 0, y: 14, duration: DURATION, ease: EASE, stagger: 0.06, delay: 0.4 });
            gsap.from(".home-extra", { autoAlpha: 0, y: 14, duration: DURATION, ease: EASE, delay: 0.6 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const FEATURES = [
        { icon: BarChart3, title: "Dashboard", desc: "Estadísticas y análisis de tu colección" },
        { icon: Music, title: "Canciones", desc: "Navega, filtra y edita tags inline" },
        { icon: Copy, title: "Duplicados", desc: "Detecta duplicados por nombre, tamaño o hash" },
        { icon: FileWarning, title: "Archivos", desc: "Encuentra faltantes y huérfanos" },
        { icon: Wrench, title: "Operaciones", desc: "Renombra y mueve archivos en lote" },
    ];

    return (
        <div ref={containerRef} className="flex h-full items-center justify-center bg-background p-6">
            <div className="w-full max-w-2xl space-y-8">
                {/* Hero */}
                <div className="home-hero flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/12 shadow-lg shadow-primary/10">
                        <Disc3 className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">VDJ Database Manager</h1>
                    <p className="max-w-md text-sm text-text-secondary">
                        Gestiona tu base de datos de VirtualDJ: analiza, edita tags, detecta duplicados y organiza tu colección.
                    </p>
                </div>

                {/* Primary actions */}
                <div className="home-actions flex flex-col items-center gap-2.5">
                    <button
                        onClick={selectFolder}
                        disabled={loading}
                        className="btn btn-primary btn-lg w-full max-w-md"
                    >
                        <FolderOpen className="h-5 w-5" />
                        Seleccionar Carpeta VirtualDJ
                    </button>

                    <div className="flex w-full max-w-md gap-2">
                        <button
                            onClick={() => loadFromFolder("D:\\Documents\\VirtualDJ")}
                            disabled={loading}
                            className="btn btn-ghost flex-1 text-[12px]"
                        >
                            <Folder className="h-3.5 w-3.5" />
                            Ruta por defecto
                        </button>

                        {lastVdjFolder && lastVdjFolder !== "D:\\Documents\\VirtualDJ" && (
                            <button
                                onClick={() => loadFromFolder(lastVdjFolder)}
                                disabled={loading}
                                className="btn btn-ghost flex-1 text-[12px]"
                                title={lastVdjFolder}
                            >
                                <Folder className="h-3.5 w-3.5" />
                                Última sesión
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                        <div className="spinner" />
                        Cargando base de datos...
                    </div>
                )}

                {error && (
                    <div className="rounded-[5px] border-2 border-error/30 bg-error/8 px-4 py-2.5 text-center text-sm text-error">
                        {error}
                    </div>
                )}

                {/* Feature grid */}
                <div className="home-features grid grid-cols-5 gap-2">
                    {FEATURES.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-surface/50 p-3 text-center">
                            <Icon className="h-5 w-5 text-primary-light" />
                            <span className="text-[11px] font-semibold text-text">{title}</span>
                            <span className="text-[10px] leading-tight text-text-muted">{desc}</span>
                        </div>
                    ))}
                </div>

                {/* Music folders configuration — collapsible extra section */}
                <div className="home-extra card p-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-[12px] font-semibold text-text">Carpetas de música</h3>
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
                                    className="flex items-center gap-2 rounded-sm border border-border/50 bg-surface-hover/30 px-2 py-1.5"
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
            </div>
        </div>
    );
}
