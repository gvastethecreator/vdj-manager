import { describe, expect, test } from "bun:test";
import { dedupeRemovalPaths, removalStatusLabel, summarizeRemoval } from "./libraryRemoval";
import type { LibraryRemovalResult } from "../types/database";

describe("library removal UI helpers", () => {
  test("dedupes Windows path aliases without losing display identity", () => {
    expect(dedupeRemovalPaths([
      "D:\\Music\\Track.mp3",
      "d:/music/track.MP3",
      "D:\\Music\\Other.mp3",
    ])).toEqual(["D:\\Music\\Track.mp3", "D:\\Music\\Other.mp3"]);
  });

  test("summarizes mixed results and keeps status copy user-facing", () => {
    const results: LibraryRemovalResult[] = [
      { originalFilePath: "a", status: "completed", mode: "db_only", message: null },
      { originalFilePath: "b", status: "trash_failed", mode: "trash_then_unindex", message: "denied" },
    ];
    expect(summarizeRemoval(results)).toEqual({ completed: 1, attention: 1 });
    expect(removalStatusLabel("trash_failed")).toBe("No se envió a papelera");
  });
});
