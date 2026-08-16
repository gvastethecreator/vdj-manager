import { describe, expect, test } from "bun:test";
import { moveStatusLabel, transferMethodLabel } from "./moveReport";

describe("move report copy", () => {
  test("does not expose machine statuses or fallback internals directly", () => {
    expect(moveStatusLabel("ready")).toBe("Ready");
    expect(moveStatusLabel("target_conflict")).toBe("Target conflict");
    expect(moveStatusLabel("rolled_back")).toBe("Reverted");
    expect(moveStatusLabel("manual_review_required")).toBe("Manual review required");
    expect(transferMethodLabel("copy_delete")).toBe("verified copy + removal");
    expect(transferMethodLabel(null)).toBeNull();
  });
});
