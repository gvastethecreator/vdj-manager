import { describe, expect, test } from "bun:test";
import {
  compareDriveAwarePaths,
  getDriveRoot,
  getParentDirectory,
  getPathLeafName,
  isPathInsideFolder,
} from "./pathUtils";

describe("pathUtils", () => {
  test("extracts normalized Windows drive roots", () => {
    expect(getDriveRoot("d:/Music/Club/Track.mp3")).toBe("D:\\");
    expect(getDriveRoot("E:\\Sets\\Track.mp3")).toBe("E:\\");
  });

  test("sorts paths by drive letter before nested folders", () => {
    const paths = [
      "E:\\Music\\B.mp3",
      "D:\\ZZZ\\Track.mp3",
      "D:\\Music\\A.mp3",
      "C:\\Archive\\Track.mp3",
    ];

    expect([...paths].sort(compareDriveAwarePaths)).toEqual([
      "C:\\Archive\\Track.mp3",
      "D:\\Music\\A.mp3",
      "D:\\ZZZ\\Track.mp3",
      "E:\\Music\\B.mp3",
    ]);
  });

  test("keeps drive roots as parents when deriving names and parents", () => {
    expect(getPathLeafName("D:\\")).toBe("D:\\");
    expect(getParentDirectory("D:\\Music\\Club")).toBe("D:\\Music");
    expect(getParentDirectory("D:\\Music")).toBe("D:\\");
  });

  test("matches folder containment without sibling false positives", () => {
    expect(isPathInsideFolder("D:\\Music\\Club\\Track.mp3", "D:\\Music")).toBe(true);
    expect(isPathInsideFolder("D:\\Musicology\\Track.mp3", "D:\\Music")).toBe(false);
  });
});
