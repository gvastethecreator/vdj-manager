import { describe, expect, test } from "bun:test";
import { migrateTheme, persistTheme, readStoredTheme } from "../src/lib/theme";

describe("theme migration", () => {
  test("preserves light and migrates every legacy value to dark", () => {
    expect(migrateTheme("light")).toBe("light");
    expect(migrateTheme("dark")).toBe("dark");
    expect(migrateTheme("blue")).toBe("dark");
    expect(migrateTheme(null)).toBe("dark");
  });

  test("reads and persists through the supplied storage seam", () => {
    const values = new Map<string, string>([["vdj-theme", "teal"]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    expect(readStoredTheme(storage)).toBe("dark");
    persistTheme("light", storage);
    expect(readStoredTheme(storage)).toBe("light");
  });
});

