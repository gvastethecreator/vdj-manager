export const PANE_LAYOUT_STORAGE_KEY = "vdj-layout-v2";
export const PANE_LAYOUT_VERSION = 2 as const;
export const LIBRARY_DETAIL_VIEWPORT_BREAKPOINT = 1200;
export const SHELL_RAIL_WIDTH = 72;

export interface PaneLayout {
  version: typeof PANE_LAYOUT_VERSION;
  treeWidth: number;
  detailWidth: number;
}

export const DEFAULT_PANE_LAYOUT: PaneLayout = {
  version: PANE_LAYOUT_VERSION,
  treeWidth: 248,
  detailWidth: 360,
};

const TREE_MIN = 208;
const TREE_MAX = 360;
const DETAIL_MIN = 304;
const DETAIL_MAX = 480;
const TABLE_MIN = 520;
const SEPARATOR_SPACE = 14;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The workspace measurement excludes the fixed shell rail. */
export function shouldUseDetailDrawer(workspaceWidth: number, railWidth = SHELL_RAIL_WIDTH): boolean {
  return workspaceWidth + railWidth < LIBRARY_DETAIL_VIEWPORT_BREAKPOINT;
}

export function getPaneLimits(layout: PaneLayout, workspaceWidth = 1208) {
  const usableWidth = Math.max(0, workspaceWidth - SEPARATOR_SPACE);
  const treeMax = clamp(usableWidth - DETAIL_MIN - TABLE_MIN, TREE_MIN, TREE_MAX);
  const treeWidth = clamp(Math.round(layout.treeWidth), TREE_MIN, treeMax);
  const detailMax = clamp(usableWidth - treeWidth - TABLE_MIN, DETAIL_MIN, DETAIL_MAX);
  return {
    tree: { min: TREE_MIN, max: treeMax },
    detail: { min: DETAIL_MIN, max: detailMax },
  };
}

export function clampPaneLayout(layout: PaneLayout, workspaceWidth = 1208): PaneLayout {
  const limits = getPaneLimits(layout, workspaceWidth);
  const treeWidth = clamp(Math.round(layout.treeWidth), limits.tree.min, limits.tree.max);
  const detailWidth = clamp(Math.round(layout.detailWidth), limits.detail.min, limits.detail.max);
  return { version: PANE_LAYOUT_VERSION, treeWidth, detailWidth };
}

export function parsePaneLayout(value: unknown, workspaceWidth = 1208): PaneLayout {
  if (!value || typeof value !== "object") return clampPaneLayout(DEFAULT_PANE_LAYOUT, workspaceWidth);
  const candidate = value as Partial<PaneLayout>;
  if (
    candidate.version !== PANE_LAYOUT_VERSION
    || !Number.isFinite(candidate.treeWidth)
    || !Number.isFinite(candidate.detailWidth)
  ) {
    return clampPaneLayout(DEFAULT_PANE_LAYOUT, workspaceWidth);
  }
  return clampPaneLayout(candidate as PaneLayout, workspaceWidth);
}

export function loadPaneLayout(
  storage: Pick<Storage, "getItem"> = localStorage,
  workspaceWidth = 1208,
): PaneLayout {
  try {
    const raw = storage.getItem(PANE_LAYOUT_STORAGE_KEY);
    return raw ? parsePaneLayout(JSON.parse(raw), workspaceWidth) : parsePaneLayout(null, workspaceWidth);
  } catch {
    return parsePaneLayout(null, workspaceWidth);
  }
}

export function savePaneLayout(
  layout: PaneLayout,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    storage.setItem(PANE_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Layout persistence is an enhancement; usable defaults remain available.
  }
}

export function resizePane(
  layout: PaneLayout,
  pane: "tree" | "detail",
  delta: number,
  workspaceWidth = 1208,
): PaneLayout {
  return clampPaneLayout({
    ...layout,
    treeWidth: pane === "tree" ? layout.treeWidth + delta : layout.treeWidth,
    detailWidth: pane === "detail" ? layout.detailWidth - delta : layout.detailWidth,
  }, workspaceWidth);
}

export function setPaneSize(
  layout: PaneLayout,
  pane: "tree" | "detail",
  value: number,
  workspaceWidth = 1208,
): PaneLayout {
  return clampPaneLayout({
    ...layout,
    treeWidth: pane === "tree" ? value : layout.treeWidth,
    detailWidth: pane === "detail" ? value : layout.detailWidth,
  }, workspaceWidth);
}
