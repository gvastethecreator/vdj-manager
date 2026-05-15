import { describe, expect, test } from "bun:test";
import { buildWaveformSegments } from "./waveformRender";

describe("buildWaveformSegments", () => {
  test("keeps VirtualDJ cache colors aligned with peak buckets", () => {
    const segments = buildWaveformSegments([0, 128, 255], ["#112233", "#445566", "#778899"]);

    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.color)).toEqual(["#112233", "#445566", "#778899"]);
    expect(segments[0].x).toBe(0);
    expect(segments[1].x).toBe(50);
    expect(segments[2].x).toBe(100);
    expect(segments[2].y1).toBeLessThan(segments[1].y1);
    expect(segments[2].y2).toBeGreaterThan(segments[1].y2);
  });

  test("falls back to the default stroke color when colors are absent", () => {
    const segments = buildWaveformSegments([255, 128], []);

    expect(segments.map((segment) => segment.color)).toEqual(["currentColor", "currentColor"]);
  });
});
