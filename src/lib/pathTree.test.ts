import { describe, expect, test } from "bun:test";
import { buildDrivePathTree } from "./pathTree";

describe("pathTree", () => {
  test("groups folder roots under the drive letter parent", () => {
    const tree = buildDrivePathTree([
      "E:\\Crates",
      "D:\\Music\\Latin",
      "D:\\Music\\Club",
    ]);

    expect(tree.map((node) => node.path)).toEqual(["D:\\", "E:\\"]);
    expect(tree[0].children?.[0]?.path).toBe("D:\\Music");
    expect(tree[0].children?.[0]?.children?.map((node) => node.path)).toEqual([
      "D:\\Music\\Club",
      "D:\\Music\\Latin",
    ]);
  });
});
