import { describe, expect, test } from "bun:test";
import { isRelinkMatchForPath, mergeRelinkCandidateLists, relinkReasonLabel } from "./relink";
import type { SimilarFileMatch } from "../types/database";

const candidate = (path: string, score: number) => ({
  path,
  score,
  reasons: ["same_name"],
  sameExtension: true,
  sameStem: true,
  sameName: true,
  sizeMatch: false,
});

describe("relink candidate helpers", () => {
  test("dedupes paths while preserving backend order and score", () => {
    const matches: SimilarFileMatch[][] = [[
      {
        status: "completed",
        originalFilePath: "D:\\Music\\Missing.mp3",
        candidates: [candidate("D:\\Library\\Track.mp3", 400)],
        message: null,
      },
    ], [
      {
        status: "completed",
        originalFilePath: "d:/music/missing.MP3",
        candidates: [
          candidate("d:/library/TRACK.mp3", 999),
          candidate("D:/Library/Other.mp3", 300),
        ],
        message: null,
      },
    ]];

    expect(mergeRelinkCandidateLists(matches)).toEqual([{
      status: "completed",
      originalFilePath: "D:\\Music\\Missing.mp3",
      candidates: [
        candidate("D:\\Library\\Track.mp3", 400),
        candidate("D:/Library/Other.mp3", 300),
      ],
      message: null,
    }]);
  });

  test("does not expose backend reason codes directly in the UI", () => {
    expect(relinkReasonLabel("same_name")).toBe("mismo nombre");
    expect(relinkReasonLabel("unknown_reason")).toBe("unknown_reason");
  });

  test("rejects an async response for a different selected path", () => {
    const match = {
      originalFilePath: "D:\\Music\\A.mp3",
    };
    expect(isRelinkMatchForPath(match, "d:/music/a.mp3")).toBe(true);
    expect(isRelinkMatchForPath(match, "D:\\Music\\B.mp3")).toBe(false);
    expect(isRelinkMatchForPath(match, null)).toBe(false);
  });
});
