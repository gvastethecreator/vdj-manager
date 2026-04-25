import {
    LayoutDashboard,
    Music,
    Copy,
    FileX,
    Link2,
    FolderSearch,
    ArrowLeftRight,
    Database,
    FolderOpen,
    RefreshCw,
    SlidersHorizontal,
    ListTree,
    Gamepad2,
    Joystick,
} from "lucide-react";
import { useApp } from "../App";
import type { Theme } from "../App";
import type { Page } from "../types/database";

const navItems: { page: Page; label: string; icon: typeof Music }[] = [
    { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "songs", label: "Canciones", icon: Music },
    { page: "playlists", label: "Playlists", icon: ListTree },
    { page: "duplicates", label: "Duplicados", icon: Copy },
    { page: "missing", label: "Archivos Faltantes", icon: FileX },
    { page: "relink", label: "Tracks Movidos", icon: Link2 },
    { page: "orphans", label: "Huérfanos", icon: FolderSearch },
    { page: "batch", label: "Operaciones", icon: ArrowLeftRight },
    { page: "configs", label: "Configuraciones", icon: SlidersHorizontal },
    { page: "pads", label: "Pads", icon: Gamepad2 },
    { page: "mappers", label: "Mappers", icon: Joystick },
];

/** Accent colour swatches for the theme picker */
const ACCENT_THEMES: { theme: Theme; color: string; label: string }[] = [
    { theme: "dark", color: "#8b5cf6", label: "Violeta (oscuro)" },
    { theme: "light", color: "#7c3aed", label: "Violeta (claro)" },
    { theme: "blue", color: "#3b82f6", label: "Azul" },
    { theme: "teal", color: "#14b8a6", label: "Teal" },
    { theme: "green", color: "#22c55e", label: "Verde" },
    { theme: "amber", color: "#f59e0b", label: "Ámbar" },
    { theme: "red", color: "#ef4444", label: "Rojo" },
];

/** Navigation sidebar with page links, folder selector, and reload button. */
export function Sidebar() {
    const { page, setPage, vdjFolder, selectFolder, reload, loading, theme, setTheme } = useApp();

    return (
        <aside className="flex w-60 flex-col border-r-2 border-border bg-surface">
            {/* Header */}
            <div className="flex items-center gap-3 border-b-2 border-border px-4 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-primary/15">
                    <Database className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-bold text-text">VDJ Manager</h1>
                    {vdjFolder && (
                        <p className="truncate text-[10px] text-text-muted" title={vdjFolder}>
                            {vdjFolder}
                        </p>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-auto py-1.5">
                {navItems.map(({ page: p, label, icon: Icon }) => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-[13px] transition-all ${page === p
                            ? "bg-primary/12 text-primary-light border-r-2 border-primary font-medium"
                            : "text-text-secondary hover:bg-surface-hover hover:text-text"
                            }`}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                    </button>
                ))}
            </nav>

            {/* Theme picker */}
            <div className="border-t-2 border-border px-3 py-2">
                <p className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wide">Tema</p>
                <div className="flex flex-wrap gap-1.5">
                    {ACCENT_THEMES.map(({ theme: t, color, label }) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTheme(t)}
                            title={label}
                            className="h-5 w-5 rounded-full border-2 transition-all"
                            style={{
                                backgroundColor: color,
                                borderColor: theme === t ? "#fff" : "transparent",
                                boxShadow: theme === t ? `0 0 0 1px ${color}` : "none",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Footer actions */}
            <div className="border-t-2 border-border p-2.5 space-y-1.5">
                <button
                    onClick={selectFolder}
                    className="btn btn-primary btn-sm w-full"
                >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Cambiar Carpeta
                </button>
                <button
                    onClick={reload}
                    disabled={loading}
                    className="btn btn-ghost btn-sm w-full"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Recargar
                </button>
            </div>
        </aside>
    );
}
