import type { ReactNode } from "react";
import { ChevronDown, Database, RotateCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { RecoveryCenter } from "./RecoveryCenter";
import { useApp } from "../App";
import { UiErrorNotice } from "./UiErrorNotice";

const WORKSPACE_LABELS = {
  dashboard: "Dashboard",
  library: "Biblioteca",
  integrity: "Resolver problemas",
  operations: "Operaciones",
  resources: "Recursos",
  home: "Inicio",
} as const;

function libraryName(folder: string | null): string {
  if (!folder) return "Sin biblioteca";
  const parts = folder.replace(/[\\/]+$/, "").split(/[\\/]/);
  return parts[parts.length - 1] || "VirtualDJ";
}

/** Desktop shell with a compact rail, minimal library header and scoped feedback. */
export function Layout({ children }: { children: ReactNode }) {
  const {
    uiError,
    uiErrorRecovery,
    clearUiError,
    vdjFolder,
    stats,
    reload,
    loading,
    mutationsBlocked,
    recoveryError,
    navigation,
    currentScope,
  } = useApp();
  const fullBleed = navigation.workspace !== "dashboard";
  const errorOwnedByWorkspace = navigation.workspace === "resources";

  return (
    <div className="flex h-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/12 text-primary-light">
              <Database className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-text">{libraryName(vdjFolder)}</span>
                <span className="text-xs text-text-muted">/ {WORKSPACE_LABELS[navigation.workspace]}</span>
              </div>
              <p className="truncate text-xs text-text-muted" title={vdjFolder ?? ""}>{vdjFolder ?? "Selecciona una carpeta de VirtualDJ"}</p>
            </div>
            <span className="badge hidden border border-border bg-surface text-text-secondary sm:inline-flex">
              {stats ? `${stats.total_songs.toLocaleString()} tracks` : "Sin cargar"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <details className="group relative">
              <summary className={`flex min-h-8 cursor-pointer list-none items-center gap-2 rounded-full border px-3 text-xs font-semibold [&::-webkit-details-marker]:hidden ${mutationsBlocked ? "border-warning/45 bg-warning/10 text-warning" : "border-success/35 bg-success/10 text-success"}`}>
                {mutationsBlocked ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {recoveryError ? "Estado no verificado" : mutationsBlocked ? "Mutaciones pausadas" : "Mutaciones protegidas"}
                <ChevronDown className="h-3.5 w-3.5 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-lg border border-border-strong bg-surface p-4 shadow-2xl">
                <h2 className="text-sm font-semibold text-text">Seguridad de escritura</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {mutationsBlocked
                    ? "Las escrituras están bloqueadas hasta resolver o verificar la recuperación pendiente."
                    : "Las mutaciones crean backup previo, usan escritura atómica y registran recuperación."}
                </p>
                <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-text-muted">
                  Este estado no confirma la integridad de rutas, duplicados ni archivos huérfanos; esos análisis se ejecutan por separado.
                </p>
              </div>
            </details>
            <button type="button" onClick={() => void reload()} disabled={loading || !vdjFolder} className="icon-button" aria-label="Recargar biblioteca" title="Recargar biblioteca">
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <RecoveryCenter />
        <main className={`min-h-0 min-w-0 flex-1 overflow-auto ${fullBleed ? "p-0" : "p-5"}`}>
          {uiError?.scope === currentScope && !errorOwnedByWorkspace ? (
            <div className={fullBleed ? "px-4 pt-4" : ""}>
              <UiErrorNotice
                error={uiError}
                onDismiss={clearUiError}
                onRetry={uiErrorRecovery?.scope === currentScope ? () => {
                  const retry = uiErrorRecovery.run;
                  clearUiError();
                  void retry();
                } : undefined}
                retryLabel={uiErrorRecovery?.scope === currentScope ? uiErrorRecovery.label : undefined}
              />
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
