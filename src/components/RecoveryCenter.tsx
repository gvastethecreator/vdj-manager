import { useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, ShieldAlert, X } from "lucide-react";
import { useApp } from "../App";
import { pendingRecoveryItemCount, recoveryActionLabel } from "../lib/recovery";
import type { MutationRecoveryAction } from "../types/database";

function operationLabel(operation: string): string {
    return { rename: "Renombrado", move: "Movimiento", remove_library: "Remoción" }[operation] ?? operation;
}

/** Persistent, library-scoped recovery surface. It never performs an action without a second confirmation. */
export function RecoveryCenter() {
    const {
        recoveryState,
        recoveryError,
        recoveryLoading,
        recoveryOutcomes,
        refreshRecovery,
        resolveRecovery,
    } = useApp();
    const [expanded, setExpanded] = useState(true);
    const [pendingAction, setPendingAction] = useState<{ action: MutationRecoveryAction; journalId: string } | null>(null);
    const pendingCount = pendingRecoveryItemCount(recoveryState);
    const blocked = recoveryError !== null || recoveryState?.status === "pending_recovery";

    if (!blocked && recoveryOutcomes.length === 0) return null;

    return (
        <section className={`shrink-0 border-b px-5 py-3 ${blocked ? "border-warning/35 bg-warning/10" : "border-success/30 bg-success/8"}`} aria-live="polite">
            <div className="flex flex-wrap items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${blocked ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                    {blocked ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-text">
                        {recoveryError ? "No se pudo verificar el estado de recuperación" : blocked ? "Mutaciones pausadas: recuperación pendiente" : "Recuperación resuelta"}
                    </h2>
                    <p className="text-[11px] text-text-secondary">
                        {recoveryError
                            ? "La biblioteca sigue disponible en modo lectura. Reintenta la verificación antes de modificar archivos o database.xml."
                            : blocked
                                ? `${pendingCount} ítem${pendingCount === 1 ? "" : "s"} requiere${pendingCount === 1 ? "" : "n"} una decisión explícita. No se tocará ningún otro archivo mientras tanto.`
                                : "La biblioteca ya puede recibir nuevas operaciones."}
                    </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" disabled={recoveryLoading} onClick={() => void refreshRecovery()}>
                    <RefreshCw className={`h-3.5 w-3.5 ${recoveryLoading ? "animate-spin" : ""}`} /> Verificar
                </button>
                {(recoveryState?.entries.length ?? 0) > 0 || recoveryOutcomes.length > 0 ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {expanded ? "Ocultar" : "Ver detalles"}
                    </button>
                ) : null}
            </div>

            {recoveryError ? <p className="mt-2 break-all rounded-md border border-error/25 bg-error/8 px-3 py-2 text-[11px] text-error">{recoveryError}</p> : null}

            {expanded && recoveryState?.entries.map((entry) => (
                <div key={entry.journal.journalId} className="mt-3 rounded-lg border border-border bg-background/80 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <span className="text-[12px] font-semibold text-text">{operationLabel(entry.journal.operation)}</span>
                            <span className="ml-2 font-mono text-[10px] text-text-muted">{entry.journal.journalId}</span>
                            <p className="mt-0.5 text-[11px] text-text-secondary">{entry.journal.outcomeSummary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {entry.allowedActions.map((action) => (
                                <button
                                    key={action}
                                    type="button"
                                    disabled={recoveryLoading}
                                    className={`btn btn-sm ${action === "rollback" ? "btn-warning" : action === "manual_review_acknowledged" ? "btn-ghost" : "btn-primary"}`}
                                    onClick={() => setPendingAction({ action, journalId: entry.journal.journalId })}
                                >
                                    {recoveryActionLabel(action)}{entry.recommendedAction === action ? " · recomendado" : ""}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-2 space-y-1">
                        {entry.journal.items.map((item) => (
                            <div key={item.itemId} className="rounded-md border border-border/70 bg-surface px-2.5 py-2 text-[10px] text-text-secondary">
                                <div className="flex flex-wrap items-center gap-2"><span className="badge bg-info/12 text-info">{item.phase}</span><span className="font-mono">{item.originalFilePath}</span></div>
                                {item.targetFilePath ? <div className="mt-1 truncate font-mono text-text-muted" title={item.targetFilePath}>→ {item.targetFilePath}</div> : null}
                                {item.lastError ? <div className="mt-1 text-error">{item.lastError}</div> : null}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {expanded && recoveryOutcomes.length > 0 ? (
                <div className="mt-3 rounded-lg border border-success/25 bg-background/80 p-3">
                    <h3 className="text-[12px] font-semibold text-success">Último resultado</h3>
                    {recoveryOutcomes.map((outcome) => <p key={`${outcome.journalId}:${outcome.itemId}`} className={`mt-1 text-[11px] ${outcome.status === "resolved" ? "text-text-secondary" : "text-error"}`}>{outcome.message}</p>)}
                </div>
            ) : null}

            {pendingAction ? (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="recovery-confirm-title">
                    <div className="card w-full max-w-lg space-y-4 p-5 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                            <div className="min-w-0 flex-1">
                                <h3 id="recovery-confirm-title" className="text-base font-bold text-text">Confirmar acción de recuperación</h3>
                                <p className="mt-1 text-sm text-text-secondary">
                                    Se aplicará <strong>{recoveryActionLabel(pendingAction.action)}</strong> únicamente al journal seleccionado. El journal conservará el resultado; los casos ambiguos quedarán pausados para revisión manual.
                                </p>
                            </div>
                            <button type="button" className="rounded p-1 text-text-muted hover:bg-surface-hover" onClick={() => setPendingAction(null)} aria-label="Cancelar"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" className="btn btn-ghost" onClick={() => setPendingAction(null)}>Cancelar</button>
                            <button type="button" className="btn btn-warning" disabled={recoveryLoading} onClick={() => { const pending = pendingAction; setPendingAction(null); void resolveRecovery(pending.action, pending.journalId); }}>
                                Confirmar: {recoveryActionLabel(pendingAction.action)}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
