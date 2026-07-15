import type { UpdateSongTagsResult } from "../types/database";

/** Local song state may advance only after the backend confirms its XML commit. */
export function shouldApplySongUpdate(
  result: Pick<UpdateSongTagsResult, "status">,
): boolean {
  return result.status === "completed";
}
