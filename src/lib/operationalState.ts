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
      title: "Recuperación pendiente",
      detail: "Hay una mutación interrumpida. Resuélvela antes de volver a escribir en la biblioteca.",
      actionLabel: "Revisar recuperación",
      navigation: { workspace: "dashboard" },
    });
  }

  if (integrity.missing === null || integrity.mismatched === null) {
    items.push({
      id: "verify",
      tone: "neutral",
      title: "Integridad de archivos sin verificar",
      detail: "Todavía no se comprobó si las rutas y tamaños registrados coinciden con el disco.",
      actionLabel: "Verificar ahora",
      navigation: { workspace: "integrity", section: "missing" },
    });
  } else if (integrity.missing > 0 || integrity.mismatched > 0) {
    items.push({
      id: "missing",
      tone: "critical",
      title: `${integrity.missing} faltante${integrity.missing === 1 ? "" : "s"} · ${integrity.mismatched} con tamaño distinto`,
      detail: "Revisa candidatos de ruta antes de editar o mover estas pistas.",
      actionLabel: "Resolver rutas",
      navigation: { workspace: "integrity", section: "relink" },
    });
  }

  if (integrity.duplicateGroups === null) {
    items.push({
      id: "duplicates-unverified",
      tone: "neutral",
      title: "Duplicados sin analizar",
      detail: "El conteo se mantiene como Sin verificar hasta ejecutar el análisis.",
      actionLabel: "Analizar duplicados",
      navigation: { workspace: "integrity", section: "duplicates" },
    });
  } else if (integrity.duplicateGroups > 0) {
    items.push({
      id: "duplicates",
      tone: "warning",
      title: `${integrity.duplicateGroups} grupo${integrity.duplicateGroups === 1 ? "" : "s"} de duplicados`,
      detail: "Compara cues, stems y ubicación antes de elegir qué conservar.",
      actionLabel: "Revisar duplicados",
      navigation: { workspace: "integrity", section: "duplicates" },
    });
  }

  if (integrity.orphans === null) {
    items.push({
      id: "orphans-unverified",
      tone: "neutral",
      title: "Carpetas de música sin revisar",
      detail: "No se buscaron archivos que estén en disco pero fuera de database.xml.",
      actionLabel: "Buscar huérfanos",
      navigation: { workspace: "integrity", section: "orphans" },
    });
  } else if (integrity.orphans > 0) {
    items.push({
      id: "orphans",
      tone: "warning",
      title: `${integrity.orphans} archivo${integrity.orphans === 1 ? "" : "s"} fuera de la biblioteca`,
      detail: "Decide si deben incorporarse o quedar fuera de VirtualDJ.",
      actionLabel: "Revisar huérfanos",
      navigation: { workspace: "integrity", section: "orphans" },
    });
  }

  if (!recoveryPending && items.length === 0) {
    items.push({
      id: "healthy",
      tone: "success",
      title: "Sin acciones urgentes",
      detail: "Los últimos análisis no encontraron rutas rotas, duplicados ni huérfanos.",
      actionLabel: "Abrir biblioteca",
      navigation: { workspace: "library", section: "songs" },
    });
  }

  const priority: Record<AttentionTone, number> = { critical: 0, warning: 1, neutral: 2, success: 3 };
  return items.sort((a, b) => priority[a.tone] - priority[b.tone]);
}

export function displayScanCount(value: number | null): string {
  return value === null ? "Sin verificar" : value.toLocaleString();
}
