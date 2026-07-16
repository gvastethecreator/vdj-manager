import type { ReactNode } from "react";
import { Database, RotateCw } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { RecoveryCenter } from "./RecoveryCenter";
import { useApp } from "../App";
import { UiErrorNotice } from "./UiErrorNotice";

/** Main layout shell: sidebar + scrollable content area with error banner. */
export function Layout({ children }: { children: ReactNode }) {
    const { uiError, clearUiError, vdjFolder, stats, reload, loading } = useApp();

    return (
        <div className="flex h-full bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/88 px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/12 text-primary-light">
                            <Database className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text">database.xml</span>
                                <span className="badge bg-success/12 text-success">backup protegido</span>
                                {stats ? <span className="badge bg-info/12 text-info">{stats.total_songs.toLocaleString()} tracks</span> : null}
                            </div>
                            <p className="truncate text-xs text-text-muted" title={vdjFolder ?? ""}>
                                {vdjFolder ?? "Selecciona una carpeta de VirtualDJ para comenzar"}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={reload} disabled={loading || !vdjFolder} className="btn btn-ghost btn-sm">
                        <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Recargar
                    </button>
                </header>
                <RecoveryCenter />
                <div className="flex min-h-0 flex-1">
                    <main className="min-w-0 flex-1 overflow-auto p-5">
                        {uiError ? <UiErrorNotice error={uiError} onDismiss={clearUiError} onRetry={() => void reload()} /> : null}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
