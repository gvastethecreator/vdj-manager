import { describe, expect, test } from "bun:test";
import { isMutationBlocked, pendingRecoveryItemCount, recoveryActionLabel } from "./recovery";
import type { MutationRecoveryState } from "../types/database";

const pending: MutationRecoveryState = {
  status: "pending_recovery",
  libraryKey: "d:\\virtualdj",
  recommendedAction: "resume",
  allowedActions: ["resume", "rollback"],
  entries: [{
    recommendedAction: "resume",
    allowedActions: ["resume", "rollback"],
    journal: {
      journalId: "journal-1",
      operation: "rename",
      phase: "planned",
      outcomeSummary: "in_progress",
      createdAtMs: 1,
      updatedAtMs: 1,
      items: [{
        itemId: "item-1",
        originalFilePath: "D:\\Music\\A.mp3",
        targetFilePath: "D:\\Music\\B.mp3",
        sourceFileSize: 123,
        sourceSha256: "fixture-sha256",
        phase: "planned",
        lastError: null,
        manualReviewAcknowledged: false,
      }],
    },
  }],
};

describe("mutation recovery gate", () => {
  test("blocks critical writes but keeps state readable", () => {
    expect(isMutationBlocked(pending, null)).toBe(true);
    expect(pendingRecoveryItemCount(pending)).toBe(1);
    expect(isMutationBlocked({ ...pending, status: "clean", entries: [] }, null)).toBe(false);
    expect(isMutationBlocked(null, "journal ilegible")).toBe(true);
  });

  test("uses explicit user-facing action labels", () => {
    expect(recoveryActionLabel("resume")).toBe("Reanudar y completar");
    expect(recoveryActionLabel("manual_review_acknowledged")).toBe("Confirmar revisión manual");
  });
});
