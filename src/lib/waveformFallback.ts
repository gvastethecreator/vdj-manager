import type { WaveformPreview } from "../types/database";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function colorForBucket(index: number, bucketCount: number, seed: number): string {
  const ratio = bucketCount <= 1 ? 0 : index / (bucketCount - 1);
  const hue = Math.round((seed % 72) + 170 + ratio * 150) % 360;
  return `hsl(${hue}, 88%, 64%)`;
}

export function buildSyntheticWaveformPreview(
  filePath: string,
  bucketCount: number,
): WaveformPreview {
  const safeBucketCount = Math.max(16, Math.min(256, Math.round(bucketCount)));
  const seed = hashString(filePath);
  const peaks = Array.from({ length: safeBucketCount }, (_, index) => {
    const waveA = Math.sin((index + 1 + (seed % 17)) * 0.31);
    const waveB = Math.sin((index + 1) * 0.83 + (seed % 29));
    const transient = ((index * 37 + seed) % 19) === 0 ? 0.34 : 0;
    const value = 0.18 + Math.abs(waveA) * 0.48 + Math.abs(waveB) * 0.24 + transient;
    return Math.round(Math.min(1, value) * 255);
  });

  return {
    peaks,
    bucket_count: safeBucketCount,
    frequency_bands: [],
    frequency_band_count: 0,
    colors: peaks.map((_, index) => colorForBucket(index, safeBucketCount, seed)),
    values_per_second: null,
    source: "synthetic-demo",
  };
}
