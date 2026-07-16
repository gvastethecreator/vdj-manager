import { describe, expect, test } from "bun:test";
import { buildAttentionQueue, demoIntegritySnapshot, displayScanCount } from "../src/lib/operationalState";

describe("operational attention queue", () => {
  test("never represents an unexecuted scan as zero", () => {
    const snapshot = demoIntegritySnapshot("unverified");
    expect(displayScanCount(snapshot.missing)).toBe("Sin verificar");
    expect(buildAttentionQueue(snapshot, false).map((item) => item.id)).toEqual([
      "verify",
      "duplicates-unverified",
      "orphans-unverified",
    ]);
  });

  test("prioritizes recovery and broken paths before duplicate cleanup", () => {
    const queue = buildAttentionQueue(demoIntegritySnapshot("problem"), true);
    expect(queue.map((item) => item.id)).toEqual(["recovery", "missing", "duplicates", "orphans"]);
  });

  test("returns a single healthy next action when every scan is clean", () => {
    const queue = buildAttentionQueue(demoIntegritySnapshot("healthy"), false);
    expect(queue).toHaveLength(1);
    expect(queue[0].tone).toBe("success");
  });
});
