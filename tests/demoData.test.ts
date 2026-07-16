import { describe, expect, test } from "bun:test";
import { demoSongsForScenario, getDemoAppState } from "../src/lib/demoData";

describe("visual demo fixtures", () => {
  test("provides deterministic empty and dense libraries with long paths", () => {
    expect(demoSongsForScenario("empty")).toEqual([]);
    const dense = demoSongsForScenario("dense");
    expect(dense).toHaveLength(160);
    expect(dense[0].file_path.length).toBeGreaterThan(90);
    expect(new Set(dense.map((song) => song.index)).size).toBe(160);
  });

  test("provides a deterministic first-run home without a remembered library", () => {
    expect(getDemoAppState("?demo&page=home&state=first-run")).toMatchObject({ vdjFolder: null, songs: [], stats: null, musicFolders: [] });
  });
});
