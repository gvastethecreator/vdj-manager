import { describe, expect, test } from "bun:test";
import {
  DEFAULT_PANE_LAYOUT,
  PANE_LAYOUT_STORAGE_KEY,
  loadPaneLayout,
  parsePaneLayout,
  resizePane,
  savePaneLayout,
} from "../src/lib/paneLayout";

describe("pane layout persistence", () => {
  test("recovers from malformed and stale payloads", () => {
    expect(parsePaneLayout({ version: 1, treeWidth: 999, detailWidth: 0 })).toEqual(DEFAULT_PANE_LAYOUT);
    expect(parsePaneLayout({ version: 2, treeWidth: Number.NaN, detailWidth: 360 })).toEqual(DEFAULT_PANE_LAYOUT);
  });

  test("clamps resize to preserve a usable table", () => {
    const next = resizePane(DEFAULT_PANE_LAYOUT, "tree", 999, 1208);
    expect(next.treeWidth).toBe(360);
    expect(next.detailWidth).toBeLessThanOrEqual(328);
    expect(1208 - next.treeWidth - next.detailWidth).toBeGreaterThanOrEqual(520);
  });

  test("loads and saves the versioned storage key", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    savePaneLayout({ version: 2, treeWidth: 280, detailWidth: 400 }, storage);
    expect(values.has(PANE_LAYOUT_STORAGE_KEY)).toBe(true);
    expect(loadPaneLayout(storage)).toEqual({ version: 2, treeWidth: 280, detailWidth: 400 });
  });
});

