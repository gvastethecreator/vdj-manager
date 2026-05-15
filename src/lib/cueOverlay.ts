import type { CueMarker } from "../types/database";

export interface CueOverlayMarker {
  cue: CueMarker;
  index: number;
  x: number;
  lineX: number;
  labelX: number;
  labelWidth: number;
  label: number;
}

export function buildCueOverlayMarkers(
  cueMarkers: CueMarker[] | null | undefined,
  durationSecs: number | null | undefined,
): CueOverlayMarker[] {
  if (!cueMarkers || !durationSecs || durationSecs <= 0) return [];

  return cueMarkers
    .map((cue, index) => {
      const label = cue.num ?? index + 1;
      const labelWidth = label >= 10 ? 5.8 : 4.4;
      const x = (cue.pos / durationSecs) * 100;
      const labelX = Math.min(Math.max(x - labelWidth / 2, 0.8), 100 - labelWidth - 0.8);

      return {
        cue,
        index,
        x,
        lineX: x,
        labelX,
        labelWidth,
        label,
      };
    })
    .filter((item) => item.x >= 0 && item.x <= 100)
    .sort((a, b) => a.x - b.x || a.label - b.label);
}
