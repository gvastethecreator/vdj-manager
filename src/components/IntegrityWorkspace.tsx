import type { ReactNode } from "react";
import { Copy, FileSearch, FolderSearch, Link2 } from "lucide-react";
import { useApp } from "../App";
import type { IntegritySection } from "../lib/navigation";
import { displayScanCount } from "../lib/operationalState";

const TABS: Array<{ section: IntegritySection; label: string; icon: typeof FileSearch }> = [
  { section: "missing", label: "Faltantes", icon: FileSearch },
  { section: "relink", label: "Tracks movidos", icon: Link2 },
  { section: "duplicates", label: "Duplicados", icon: Copy },
  { section: "orphans", label: "Huérfanos", icon: FolderSearch },
];

export function IntegrityWorkspace({ children }: { children: ReactNode }) {
  const { navigation, setNavigation, integrity } = useApp();
  const section = navigation.section as IntegritySection;
  const fullBleedSection = section === "relink";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-surface px-4 pt-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-text">Resolver problemas</h1>
            <p className="mt-0.5 text-xs text-text-muted">Diagnostica primero; cada mutación exige confirmación y deja evidencia.</p>
          </div>
          <div className="flex gap-4 text-xs text-text-muted">
            <span>Faltantes <strong className="ml-1 text-text-secondary">{displayScanCount(integrity.missing)}</strong></span>
            <span>Duplicados <strong className="ml-1 text-text-secondary">{displayScanCount(integrity.duplicateGroups)}</strong></span>
            <span>Huérfanos <strong className="ml-1 text-text-secondary">{displayScanCount(integrity.orphans)}</strong></span>
          </div>
        </div>
        <nav className="mt-3 flex gap-1" aria-label="Secciones de integridad">
          {TABS.map(({ section: nextSection, label, icon: Icon }) => (
            <button
              key={nextSection}
              type="button"
              className={`flex min-h-9 items-center gap-2 border-b-2 px-3 text-sm font-semibold ${section === nextSection ? "border-primary-light text-primary-light" : "border-transparent text-text-muted hover:text-text"}`}
              onClick={() => setNavigation({ workspace: "integrity", section: nextSection })}
              aria-current={section === nextSection ? "page" : undefined}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
      </header>
      <div className={`min-h-0 flex-1 overflow-auto ${fullBleedSection ? "p-0" : "p-4"}`}>{children}</div>
    </div>
  );
}
