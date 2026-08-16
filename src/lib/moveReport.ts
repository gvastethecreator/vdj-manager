import type { MoveItemStatus, MoveTransferMethod } from "../types/database";

export function moveStatusLabel(status: MoveItemStatus): string {
  return {
    ready: "Ready",
    failed_validation: "Validation rejected",
    target_conflict: "Target conflict",
    fs_moved: "File moved; catalog confirmation pending",
    db_committed: "Completed",
    rolled_back: "Reverted",
    manual_review_required: "Manual review required",
  }[status];
}

export function transferMethodLabel(method: MoveTransferMethod | null): string | null {
  if (method === "rename") return "atomic rename";
  if (method === "copy_delete") return "verified copy + removal";
  return null;
}
