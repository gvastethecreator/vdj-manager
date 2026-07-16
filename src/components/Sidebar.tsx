import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Database,
  FolderOpen,
  Layers3,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  Sun,
  Wrench,
} from "lucide-react";
import { useApp } from "../App";
import type { NavigationState, Workspace } from "../lib/navigation";

interface PrimaryNavItem {
  workspace: Workspace;
  label: string;
  icon: typeof LayoutDashboard;
  navigation: NavigationState;
}

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { workspace: "dashboard", label: "Dashboard", icon: LayoutDashboard, navigation: { workspace: "dashboard" } },
  { workspace: "library", label: "Biblioteca", icon: Database, navigation: { workspace: "library", section: "songs" } },
  { workspace: "integrity", label: "Resolver problemas", icon: AlertTriangle, navigation: { workspace: "integrity", section: "missing" } },
  { workspace: "operations", label: "Operaciones", icon: Wrench, navigation: { workspace: "operations", section: "batch" } },
  { workspace: "resources", label: "Recursos", icon: Layers3, navigation: { workspace: "resources", section: "configs" } },
];

/** Compact 72 px rail. Expansion overlays content so workspace geometry never shifts. */
export function Sidebar() {
  const { navigation, setNavigation, selectFolder, loading, theme, toggleTheme } = useApp();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [expanded]);

  const navigate = (next: NavigationState) => {
    setNavigation(next);
    setExpanded(false);
  };

  return (
    <aside className="relative z-50 w-[72px] shrink-0 border-r border-border" aria-label="Navegación principal">
      <div className={`absolute inset-y-0 left-0 flex flex-col border-r border-border bg-surface ${expanded ? "w-60 shadow-2xl" : "w-[71px]"}`}>
        <div className="flex h-14 shrink-0 items-center border-b border-border px-[18px]">
          <button
            type="button"
            className="icon-button shrink-0 text-primary-light"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? "Contraer navegación" : "Expandir navegación"}
          >
            {expanded ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {expanded ? <span className="ml-3 whitespace-nowrap text-sm font-bold text-text">VDJ Manager</span> : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2.5 py-3">
          {PRIMARY_NAV_ITEMS.map(({ workspace, label, icon: Icon, navigation: next }) => {
            const active = navigation.workspace === workspace;
            return (
              <button
                key={workspace}
                type="button"
                onClick={() => navigate(next)}
                className={`flex h-11 w-full items-center rounded-md border text-sm font-semibold ${expanded ? "px-3" : "justify-center px-0"} ${active ? "border-primary/35 bg-primary/16 text-primary-light" : "border-transparent text-text-muted hover:bg-surface-hover hover:text-text"}`}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={expanded ? undefined : label}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {expanded ? <span className="ml-3 whitespace-nowrap">{label}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex h-10 w-full items-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text ${expanded ? "px-3" : "justify-center"}`}
            aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
            title={expanded ? undefined : theme === "dark" ? "Tema claro" : "Tema oscuro"}
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
            {expanded ? <span className="ml-3 text-sm">{theme === "dark" ? "Tema claro" : "Tema oscuro"}</span> : null}
          </button>
          <button
            type="button"
            onClick={() => void selectFolder()}
            disabled={loading}
            className={`flex h-10 w-full items-center rounded-md bg-primary-dark text-white hover:bg-primary ${expanded ? "px-3" : "justify-center"}`}
            aria-label="Cambiar biblioteca"
            title={expanded ? undefined : "Cambiar biblioteca"}
          >
            <FolderOpen className="h-[18px] w-[18px] shrink-0" />
            {expanded ? <span className="ml-3 text-sm font-semibold">Cambiar biblioteca</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}
