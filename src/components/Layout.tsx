import type { ReactNode } from "react";
import { Database, RotateCw, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { SafetyInspector } from "./SafetyInspector";
import { RecoveryCenter } from "./RecoveryCenter";
import { useApp } from "../App";

/** Main layout shell: sidebar + scrollable content area with error banner. */
export function Layout({ children }: { children: ReactNode }) {
    const { error, setError, vdjFolder, stats, reload, loading } = useApp();

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
                            <p className="truncate text-[11px] text-text-muted" title={vdjFolder ?? ""}>
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
                        {error && (
                            <div className="mb-4 flex items-center justify-between rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => setError(null)}
                                    className="ml-4 rounded-md px-1.5 py-0.5 opacity-75 hover:bg-error/15 hover:opacity-100"
                                    aria-label="Cerrar error"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {children}
                    </main>
                    <SafetyInspector />
                </div>
            </div>
        </div>
    );
}
