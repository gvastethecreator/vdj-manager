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
    completed: "Completado",
    failed_validation: "Validación rechazada",
    trash_failed: "No se envió a papelera",
    manual_review_required: "Revisión manual requerida",
    not_found: "No encontrado",
  }[status];
}
