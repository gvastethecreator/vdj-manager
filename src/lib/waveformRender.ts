export interface WaveformSegment {
  key: string;
  x: number;
  y1: number;
  y2: number;
  color: string;
}

export function buildWaveformSegments(
  peaks: number[],
  colors: string[] = [],
): WaveformSegment[] {
  if (peaks.length === 0) return [];

  const viewWidth = 100;
  const viewHeight = 28;
  const midY = viewHeight / 2;
  const maxHalfHeight = midY - 2;

  return peaks.map((peak, index) => {
    const x = peaks.length === 1
      ? viewWidth / 2
      : (index / (peaks.length - 1)) * viewWidth;
    const halfHeight = 1 + (peak / 255) * maxHalfHeight;
    const color = colors[index] || "currentColor";

    return {
      key: `${index}-${peak}-${color}`,
      x,
      y1: midY - halfHeight,
      y2: midY + halfHeight,
      color,
    };
  });
}
