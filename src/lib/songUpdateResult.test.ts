import { describe, expect, test } from "bun:test";
import { shouldApplySongUpdate } from "./songUpdateResult";

describe("shouldApplySongUpdate", () => {
  test("accepts only a completed backend commit", () => {
    expect(shouldApplySongUpdate({ status: "completed" })).toBe(true);
    expect(shouldApplySongUpdate({ status: "failed_validation" })).toBe(false);
    expect(shouldApplySongUpdate({ status: "not_found" })).toBe(false);
    expect(shouldApplySongUpdate({ status: "unsafe_to_patch" })).toBe(false);
  });
});
