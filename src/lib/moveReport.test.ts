import { describe, expect, test } from "bun:test";
import { moveStatusLabel, transferMethodLabel } from "./moveReport";

describe("move report copy", () => {
  test("does not expose machine statuses or fallback internals directly", () => {
    expect(moveStatusLabel("target_conflict")).toBe("Conflicto de destino");
    expect(moveStatusLabel("manual_review_required")).toBe("Revisión manual requerida");
    expect(transferMethodLabel("copy_delete")).toBe("copia verificada + remoción");
    expect(transferMethodLabel(null)).toBeNull();
  });
});
