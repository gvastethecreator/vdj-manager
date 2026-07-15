import type { MoveItemStatus, MoveTransferMethod } from "../types/database";

export function moveStatusLabel(status: MoveItemStatus): string {
  return {
    ready: "Listo",
    failed_validation: "Validación rechazada",
    target_conflict: "Conflicto de destino",
    fs_moved: "Archivo movido; falta confirmar catálogo",
    db_committed: "Completado",
    rolled_back: "Revertido",
    manual_review_required: "Revisión manual requerida",
  }[status];
}

export function transferMethodLabel(method: MoveTransferMethod | null): string | null {
  if (method === "rename") return "rename atómico";
  if (method === "copy_delete") return "copia verificada + remoción";
  return null;
}
