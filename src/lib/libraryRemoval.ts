import type { LibraryRemovalResult, LibraryRemovalStatus } from "../types/database";
import { normalizePathSeparators } from "./pathUtils";

export function dedupeRemovalPaths(paths: string[]): string[] {
  const unique = new Map<string, string>();
  for (const path of paths) {
    const key = normalizePathSeparators(path).toLowerCase();
    if (!unique.has(key)) unique.set(key, path);
  }
  return Array.from(unique.values());
}

export function summarizeRemoval(results: LibraryRemovalResult[]): {
  completed: number;
  attention: number;
} {
  const completed = results.filter((item) => item.status === "completed").length;
  return { completed, attention: results.length - completed };
}

export function removalStatusLabel(status: LibraryRemovalStatus): string {
  return {
    completed: "Completed",
    failed_validation: "Validation rejected",
    trash_failed: "Not sent to Recycle Bin",
    manual_review_required: "Manual review required",
    not_found: "Not found",
  }[status];
}
