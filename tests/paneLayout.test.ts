import { describe, expect, test } from "bun:test";
import {
  DEFAULT_PANE_LAYOUT,
  PANE_LAYOUT_STORAGE_KEY,
  loadPaneLayout,
  getPaneLimits,
  parsePaneLayout,
  resizePane,
  savePaneLayout,
  setPaneSize,
  shouldUseDetailDrawer,
} from "../src/lib/paneLayout";

describe("pane layout persistence", () => {
  test("recovers from malformed and stale payloads", () => {
    expect(parsePaneLayout({ version: 1, treeWidth: 999, detailWidth: 0 })).toEqual(DEFAULT_PANE_LAYOUT);
    expect(parsePaneLayout({ version: 2, treeWidth: Number.NaN, detailWidth: 360 })).toEqual(DEFAULT_PANE_LAYOUT);
  });

  test("clamps resize to preserve a usable table", () => {
    const next = resizePane(DEFAULT_PANE_LAYOUT, "tree", 999, 1208);
    expect(next.treeWidth).toBe(360);
    expect(next.detailWidth).toBeLessThanOrEqual(314);
    expect(1208 - 14 - next.treeWidth - next.detailWidth).toBeGreaterThanOrEqual(520);
  });

  test("loads and saves the versioned storage key", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    savePaneLayout({ version: 2, treeWidth: 280, detailWidth: 400 }, storage);
    expect(values.has(PANE_LAYOUT_STORAGE_KEY)).toBe(true);
    expect(loadPaneLayout(storage)).toEqual({ version: 2, treeWidth: 280, detailWidth: 394 });
  });

  test("switches detail to a drawer only below the 1200 px viewport contract", () => {
    expect(shouldUseDetailDrawer(1107)).toBe(true);
    expect(shouldUseDetailDrawer(1128)).toBe(false);
    expect(shouldUseDetailDrawer(1208)).toBe(false);
  });

  test("sets tree and detail widths to keyboard limits without inverting detail", () => {
    expect(setPaneSize(DEFAULT_PANE_LAYOUT, "tree", 208).treeWidth).toBe(208);
    expect(setPaneSize(DEFAULT_PANE_LAYOUT, "detail", 304).detailWidth).toBe(304);
    expect(setPaneSize(DEFAULT_PANE_LAYOUT, "detail", 480, 1400).detailWidth).toBe(480);
  });

  test("publishes reachable separator limits at the 1200 px viewport boundary", () => {
    const layout = parsePaneLayout(DEFAULT_PANE_LAYOUT, 1128);
    const limits = getPaneLimits(layout, 1128);
    expect(limits.tree.max).toBe(290);
    expect(limits.detail.max).toBe(346);
    expect(1128 - 14 - layout.treeWidth - layout.detailWidth).toBeGreaterThanOrEqual(520);
  });
});
