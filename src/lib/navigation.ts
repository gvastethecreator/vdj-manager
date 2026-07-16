import type { Page } from "../types/database";

export type Workspace =
  | "home"
  | "dashboard"
  | "library"
  | "integrity"
  | "operations"
  | "resources";

export type LibrarySection = "songs" | "playlists" | "history";
export type IntegritySection = "missing" | "relink" | "duplicates" | "orphans";
export type ResourceSection = "configs" | "pads" | "mappers";

export interface NavigationState {
  workspace: Workspace;
  section?: LibrarySection | IntegritySection | ResourceSection | "batch";
}

const LEGACY_TO_NAVIGATION: Record<Page, NavigationState> = {
  home: { workspace: "home" },
  dashboard: { workspace: "dashboard" },
  songs: { workspace: "library", section: "songs" },
  playlists: { workspace: "library", section: "playlists" },
  duplicates: { workspace: "integrity", section: "duplicates" },
  missing: { workspace: "integrity", section: "missing" },
  relink: { workspace: "integrity", section: "relink" },
  orphans: { workspace: "integrity", section: "orphans" },
  batch: { workspace: "operations", section: "batch" },
  configs: { workspace: "resources", section: "configs" },
  pads: { workspace: "resources", section: "pads" },
  mappers: { workspace: "resources", section: "mappers" },
};

const DEFAULT_SECTION: Partial<Record<Workspace, NavigationState["section"]>> = {
  library: "songs",
  integrity: "missing",
  operations: "batch",
  resources: "configs",
};

export function normalizeNavigation(navigation: NavigationState): NavigationState {
  const section = navigation.section ?? DEFAULT_SECTION[navigation.workspace];
  return section ? { workspace: navigation.workspace, section } : { workspace: navigation.workspace };
}

export function navigationFromLegacyPage(page: Page): NavigationState {
  return normalizeNavigation(LEGACY_TO_NAVIGATION[page]);
}

export function legacyPageFromNavigation(navigation: NavigationState): Page {
  const normalized = normalizeNavigation(navigation);
  if (normalized.workspace === "home" || normalized.workspace === "dashboard") {
    return normalized.workspace;
  }
  if (normalized.workspace === "operations") return "batch";
  return (normalized.section ?? DEFAULT_SECTION[normalized.workspace]) as Page;
}

export function navigationScope(navigation: NavigationState): string {
  const normalized = normalizeNavigation(navigation);
  return normalized.section
    ? `${normalized.workspace}:${normalized.section}`
    : normalized.workspace;
}

export function initialNavigation(search: string, demoMode: boolean): NavigationState {
  if (!demoMode) return { workspace: "home" };
  const candidate = new URLSearchParams(search).get("page") as Page | null;
  if (candidate && candidate in LEGACY_TO_NAVIGATION) {
    return navigationFromLegacyPage(candidate);
  }
  return { workspace: "dashboard" };
}

