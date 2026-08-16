import type { NavigationState } from "./navigation";

export interface IntegritySnapshot {
  missing: number | null;
  mismatched: number | null;
  duplicateGroups: number | null;
  orphans: number | null;
  updatedAt: string | null;
}

export type AttentionTone = "critical" | "warning" | "neutral" | "success";

export interface AttentionItem {
  id: string;
  tone: AttentionTone;
  title: string;
  detail: string;
  actionLabel: string;
  navigation: NavigationState;
}

export const EMPTY_INTEGRITY_SNAPSHOT: IntegritySnapshot = {
  missing: null,
  mismatched: null,
  duplicateGroups: null,
  orphans: null,
  updatedAt: null,
};

export function demoIntegritySnapshot(scenario: string): IntegritySnapshot {
  if (["unverified", "loading", "error", "empty", "dense"].includes(scenario)) return { ...EMPTY_INTEGRITY_SNAPSHOT };
  const problem = scenario === "problem";
  return {
    missing: problem ? 1 : 0,
    mismatched: problem ? 1 : 0,
    duplicateGroups: problem ? 1 : 0,
    orphans: problem ? 1 : 0,
    updatedAt: "2026-07-15T14:30:00.000Z",
  };
}

export function buildAttentionQueue(
  integrity: IntegritySnapshot,
  recoveryPending: boolean,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (recoveryPending) {
    items.push({
      id: "recovery",
      tone: "critical",
      title: "Recovery pending",
      detail: "A mutation was interrupted. Resolve it before writing to the library again.",
      actionLabel: "Review recovery",
      navigation: { workspace: "dashboard" },
    });
  }

  if (integrity.missing === null || integrity.mismatched === null) {
    items.push({
      id: "verify",
      tone: "neutral",
      title: "File integrity not checked",
      detail: "Recorded paths and sizes have not yet been checked against disk.",
      actionLabel: "Check now",
      navigation: { workspace: "integrity", section: "missing" },
    });
  } else if (integrity.missing > 0 || integrity.mismatched > 0) {
    items.push({
      id: "missing",
      tone: "critical",
      title: `${integrity.missing} missing · ${integrity.mismatched} size mismatch${integrity.mismatched === 1 ? "" : "es"}`,
      detail: "Review path candidates before editing or moving these tracks.",
      actionLabel: "Resolve paths",
      navigation: { workspace: "integrity", section: "relink" },
    });
  }

  if (integrity.duplicateGroups === null) {
    items.push({
      id: "duplicates-unverified",
      tone: "neutral",
      title: "Duplicates not analyzed",
      detail: "The count remains Not checked until the analysis runs.",
      actionLabel: "Analyze duplicates",
      navigation: { workspace: "integrity", section: "duplicates" },
    });
  } else if (integrity.duplicateGroups > 0) {
    items.push({
      id: "duplicates",
      tone: "warning",
      title: `${integrity.duplicateGroups} duplicate group${integrity.duplicateGroups === 1 ? "" : "s"}`,
      detail: "Compare cues, stems, and location before choosing what to keep.",
      actionLabel: "Review duplicates",
      navigation: { workspace: "integrity", section: "duplicates" },
    });
  }

  if (integrity.orphans === null) {
    items.push({
      id: "orphans-unverified",
      tone: "neutral",
      title: "Music folders not scanned",
      detail: "Files on disk but outside database.xml have not been searched.",
      actionLabel: "Find orphans",
      navigation: { workspace: "integrity", section: "orphans" },
    });
  } else if (integrity.orphans > 0) {
    items.push({
      id: "orphans",
      tone: "warning",
      title: `${integrity.orphans} file${integrity.orphans === 1 ? "" : "s"} outside the library`,
      detail: "Decide whether to add them or keep them outside VirtualDJ.",
      actionLabel: "Review orphans",
      navigation: { workspace: "integrity", section: "orphans" },
    });
  }

  if (!recoveryPending && items.length === 0) {
    items.push({
      id: "healthy",
      tone: "success",
      title: "No urgent actions",
      detail: "The latest scans found no broken paths, duplicates, or orphans.",
      actionLabel: "Open library",
      navigation: { workspace: "library", section: "songs" },
    });
  }

  const priority: Record<AttentionTone, number> = { critical: 0, warning: 1, neutral: 2, success: 3 };
  return items.sort((a, b) => priority[a.tone] - priority[b.tone]);
}

export function displayScanCount(value: number | null): string {
  return value === null ? "Not checked" : value.toLocaleString();
}
