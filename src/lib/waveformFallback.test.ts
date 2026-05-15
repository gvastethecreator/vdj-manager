import { describe, expect, test } from "bun:test";
import { buildSyntheticWaveformPreview } from "./waveformFallback";

describe("buildSyntheticWaveformPreview", () => {
  test("returns a stable visible preview for demo-only paths", () => {
    const first = buildSyntheticWaveformPreview("D:\\Music\\Club\\Demo.flac", 16);
    const second = buildSyntheticWaveformPreview("D:\\Music\\Club\\Demo.flac", 16);

    expect(first.source).toBe("synthetic-demo");
    expect(first.peaks).toHaveLength(16);
    expect(first.colors).toHaveLength(16);
    expect(first.peaks.some((peak) => peak > 0)).toBe(true);
    expect(first).toEqual(second);
  });
});
