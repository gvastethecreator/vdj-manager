import type {
  MutationRecoveryAction,
  MutationRecoveryState,
} from "../types/database";

export function getDemoRecoveryState(): MutationRecoveryState | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("recovery")) return null;
  const mode = params.get("recovery") ?? "";
  if (mode === "error") return null;
  const manualReview = mode === "manual";
  const now = Date.now();
  return {
    status: "pending_recovery",
    libraryKey: "demo-virtualdj",
    recommendedAction: manualReview ? "manual_review_acknowledged" : "resume",
    allowedActions: manualReview ? ["manual_review_acknowledged"] : ["resume", "rollback"],
    entries: [{
      recommendedAction: manualReview ? "manual_review_acknowledged" : "resume",
      allowedActions: manualReview ? ["manual_review_acknowledged"] : ["resume", "rollback"],
      journal: {
        journalId: "demo-recovery-001",
        operation: "move",
        phase: "fs_applied",
        outcomeSummary: "Movimiento físico aplicado; database.xml todavía conserva la ruta original.",
        createdAtMs: now - 90_000,
        updatedAtMs: now - 30_000,
        items: [{
          itemId: "demo-item-001",
          originalFilePath: "D:\\Music\\Incoming\\Demo Track.mp3",
          targetFilePath: "D:\\Music\\House\\Demo Track.mp3",
          sourceFileSize: 8_421_376,
          sourceSha256: "demo-sha256-verified",
          phase: manualReview ? "manual_review_required" : "fs_applied",
          lastError: manualReview ? "El archivo destino cambió desde que se registró la operación." : null,
          manualReviewAcknowledged: false,
        }],
      },
    }],
  };
}

export function isMutationBlocked(
  state: MutationRecoveryState | null,
  recoveryError: string | null,
): boolean {
  return recoveryError !== null || state?.status === "pending_recovery";
}

export function pendingRecoveryItemCount(state: MutationRecoveryState | null): number {
  if (!state || state.status === "clean") return 0;
  return state.entries.reduce(
    (count, entry) => count + entry.journal.items.filter((item) => (
      item.phase === "planned"
      || item.phase === "fs_applied"
      || (item.phase === "manual_review_required" && !item.manualReviewAcknowledged)
    )).length,
    0,
  );
}

export function recoveryActionLabel(action: MutationRecoveryAction): string {
  return {
    resume: "Reanudar y completar",
    rollback: "Revertir cambios",
    manual_review_acknowledged: "Confirmar revisión manual",
  }[action];
}
