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
import { legacyPageFromNavigation, navigationFromLegacyPage } from "../lib/navigation";

const navSections: { title: string; items: { page: Page; label: string; icon: typeof Music }[] }[] = [
    {
        title: "Biblioteca",
        items: [
            { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { page: "songs", label: "Canciones", icon: Music },
            { page: "playlists", label: "Playlists", icon: ListTree },
        ],
    },
    {
        title: "Integridad",
        items: [
            { page: "duplicates", label: "Duplicados", icon: Copy },
            { page: "missing", label: "Archivos faltantes", icon: FileX },
            { page: "relink", label: "Tracks movidos", icon: Link2 },
            { page: "orphans", label: "Huérfanos", icon: FolderSearch },
        ],
    },
    {
        title: "Operaciones",
        items: [
            { page: "batch", label: "Operaciones en lote", icon: ArrowLeftRight },
        ],
    },
    {
        title: "Recursos VDJ",
        items: [
            { page: "configs", label: "Configuraciones", icon: SlidersHorizontal },
            { page: "pads", label: "Pads", icon: Gamepad2 },
            { page: "mappers", label: "Mappers", icon: Joystick },
        ],
    },
];

/** Accent colour swatches for the theme picker */
const ACCENT_THEMES: { theme: Theme; color: string; label: string }[] = [
    { theme: "dark", color: "#8b5cf6", label: "Violeta (oscuro)" },
    { theme: "light", color: "#7c3aed", label: "Violeta (claro)" },
];

/** Navigation sidebar with page links, folder selector, and reload button. */
export function Sidebar() {
    const { navigation, setNavigation, vdjFolder, selectFolder, reload, loading, theme, setTheme } = useApp();
    const page = legacyPageFromNavigation(navigation);

    return (
        <aside className="flex w-56 flex-col border-r border-border bg-surface/92">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-3.5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
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
            <nav className="flex-1 overflow-auto px-2 py-2">
                {navSections.map((section) => (
                    <section key={section.title} className="mb-3 last:mb-0">
                        <h2 className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            {section.title}
                        </h2>
                        {section.items.map(({ page: p, label, icon: Icon }) => (
                            <button
                                key={p}
                                onClick={() => setNavigation(navigationFromLegacyPage(p))}
                                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] transition-all ${page === p
                                    ? "bg-primary/14 text-primary-light shadow-[inset_2px_0_0_var(--color-primary)]"
                                    : "text-text-secondary hover:bg-surface-hover/70 hover:text-text"
                                    }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{label}</span>
                            </button>
                        ))}
                    </section>
                ))}
            </nav>

            {/* Theme picker */}
            <div className="border-t border-border px-3 py-2">
                <p className="mb-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wide">Tema</p>
                <div className="flex flex-wrap gap-1.5">
                    {ACCENT_THEMES.map(({ theme: t, color, label }) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTheme(t)}
                            title={label}
                            className="h-5 w-5 rounded-full border transition-all"
                            style={{
                                backgroundColor: color,
                                borderColor: theme === t ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.12)",
                                boxShadow: theme === t ? `0 0 0 2px ${color}55` : "none",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Footer actions */}
            <div className="space-y-1.5 border-t border-border p-2.5">
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
