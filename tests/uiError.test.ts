import { describe, expect, test } from "bun:test";
import { createUiError, errorForScope } from "../src/lib/uiError";

describe("scoped UI errors", () => {
  test("keeps an error only inside its owner scope", () => {
    const error = createUiError("integrity:missing", "No se pudo verificar.", new Error("disk unavailable"));
    expect(errorForScope(error, "integrity:missing")).toBe(error);
    expect(errorForScope(error, "library:songs")).toBeNull();
    expect(error.detail).toContain("disk unavailable");
  });
});
