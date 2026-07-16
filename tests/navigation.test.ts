import { describe, expect, test } from "bun:test";
import {
  initialNavigation,
  legacyPageFromNavigation,
  navigationFromLegacyPage,
  navigationScope,
} from "../src/lib/navigation";

describe("workspace navigation", () => {
  test("maps legacy visual aliases into workspace sections", () => {
    expect(navigationFromLegacyPage("songs")).toEqual({ workspace: "library", section: "songs" });
    expect(navigationFromLegacyPage("relink")).toEqual({ workspace: "integrity", section: "relink" });
    expect(navigationFromLegacyPage("pads")).toEqual({ workspace: "resources", section: "pads" });
  });

  test("round-trips supported aliases", () => {
    expect(legacyPageFromNavigation({ workspace: "integrity", section: "duplicates" })).toBe("duplicates");
    expect(legacyPageFromNavigation({ workspace: "library" })).toBe("songs");
  });

  test("uses aliases only in demo and scopes errors by workspace section", () => {
    expect(initialNavigation("?demo=1&page=mappers", true)).toEqual({ workspace: "resources", section: "mappers" });
    expect(initialNavigation("?page=mappers", false)).toEqual({ workspace: "home" });
    expect(navigationScope({ workspace: "integrity", section: "missing" })).toBe("integrity:missing");
  });
});

