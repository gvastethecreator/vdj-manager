import { describe, expect, test } from "bun:test";
import { buildCueOverlayMarkers } from "./cueOverlay";
import type { CueMarker } from "../types/database";

const cues: CueMarker[] = [
  { pos: 64, poi_type: "cue", name: "Drop", color: "#f472b6", num: 2 },
  { pos: 0, poi_type: "cue", name: "Intro", color: "#38bdf8", num: 1 },
  { pos: 999, poi_type: "cue", name: "Outside", color: null, num: 3 },
];

describe("cueOverlay", () => {
  test("maps cue seconds to waveform percentages using song duration", () => {
    expect(buildCueOverlayMarkers(cues, 128).map((item) => item.x)).toEqual([0, 50]);
  });

  test("clamps labels while keeping marker lines at the real cue position", () => {
    const markers = buildCueOverlayMarkers(cues, 128);

    expect(markers[0].lineX).toBe(0);
    expect(markers[0].labelX).toBeGreaterThan(0);
    expect(markers[1].lineX).toBe(50);
  });
});
