import { useEffect, useMemo, useState } from "react";
import { getWaveformPreview } from "../lib/api";
import { buildCueOverlayMarkers } from "../lib/cueOverlay";
import { buildSyntheticWaveformPreview } from "../lib/waveformFallback";
import { buildWaveformSegments } from "../lib/waveformRender";
import type { WaveformPreview as WaveformPreviewData, CueMarker } from "../types/database";

interface WaveformPreviewProps {
    filePath: string;
    bucketCount?: number;
    /** Cue markers to render as vertical lines */
    cueMarkers?: CueMarker[];
    /** Song duration in seconds (needed to position cue markers) */
    durationSecs?: number | null;
    /** VirtualDJ folder used to read Cache/cache.db in read-only mode */
    vdjFolder?: string | null;
    /** File size from database.xml, used to match VirtualDJ cache rows even if the file is offline */
    fileSize?: number | null;
    heightClass?: string;
    svgClassName?: string;
}

const MAX_CONCURRENT_REQUESTS = Math.min(
    6,
    Math.max(
        2,
        Math.floor(((globalThis.navigator?.hardwareConcurrency ?? 4) || 4) / 2),
    ),
);

const previewCache = new Map<string, WaveformPreviewData | null>();
const inflightCache = new Map<string, Promise<WaveformPreviewData | null>>();

const pendingTasks: Array<() => void> = [];
let activeTasks = 0;

// ── Global processing state for UI feedback ──
type QueueListener = (pending: number, active: number) => void;
const queueListeners = new Set<QueueListener>();

function notifyQueueListeners() {
    for (const fn of queueListeners) fn(pendingTasks.length, activeTasks);
}

/** Subscribe to waveform queue state changes. Returns unsubscribe function. */
export function onWaveformQueueChange(fn: QueueListener): () => void {
    queueListeners.add(fn);
    fn(pendingTasks.length, activeTasks);
    return () => { queueListeners.delete(fn); };
}

function getCacheKey(filePath: string, bucketCount: number, vdjFolder?: string | null, fileSize?: number | null): string {
    return `${bucketCount}:${vdjFolder ?? ""}:${fileSize ?? ""}:${filePath}`;
}

function shouldUseDemoFallback(): boolean {
    return new URLSearchParams(window.location.search).has("demo");
}

function runQueuedTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const run = () => {
            activeTasks += 1;
            notifyQueueListeners();
            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    activeTasks -= 1;
                    const nextTask = pendingTasks.shift();
                    if (nextTask) nextTask();
                    notifyQueueListeners();
                });
        };

        if (activeTasks < MAX_CONCURRENT_REQUESTS) {
            run();
            return;
        }

        pendingTasks.push(run);
        notifyQueueListeners();
    });
}

async function loadWaveformPreview(
    filePath: string,
    bucketCount: number,
    vdjFolder?: string | null,
    fileSize?: number | null,
): Promise<WaveformPreviewData | null> {
    const cacheKey = getCacheKey(filePath, bucketCount, vdjFolder, fileSize);
    const cached = previewCache.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }

    const existingRequest = inflightCache.get(cacheKey);
    if (existingRequest) {
        return existingRequest;
    }

    const request = runQueuedTask(async () => {
        try {
            const preview = await getWaveformPreview(filePath, bucketCount, vdjFolder, fileSize);
            previewCache.set(cacheKey, preview);
            return preview;
        } catch {
            const fallback = shouldUseDemoFallback()
                ? buildSyntheticWaveformPreview(filePath, bucketCount)
                : null;
            previewCache.set(cacheKey, fallback);
            return fallback;
        } finally {
            inflightCache.delete(cacheKey);
        }
    });

    inflightCache.set(cacheKey, request);
    return request;
}

function getBandColor(index: number, total: number): string {
    const ratio = total <= 1 ? 0 : index / (total - 1);
    const hue = 185 + ratio * 145;
    return `hsla(${hue.toFixed(0)}, 85%, 66%, 0.32)`;
}

export function WaveformPreview({
    filePath,
    bucketCount = 64,
    cueMarkers,
    durationSecs,
    vdjFolder,
    fileSize,
    heightClass = "h-6",
    svgClassName = "h-6",
}: WaveformPreviewProps) {
    const cacheKey = getCacheKey(filePath, bucketCount, vdjFolder, fileSize);
    const [preview, setPreview] = useState<WaveformPreviewData | null | undefined>(
        () => previewCache.get(cacheKey),
    );

    useEffect(() => {
        let cancelled = false;

        const cached = previewCache.get(cacheKey);
        if (cached !== undefined) {
            setPreview(cached);
            return () => {
                cancelled = true;
            };
        }

        setPreview(undefined);

        loadWaveformPreview(filePath, bucketCount, vdjFolder, fileSize).then((result) => {
            if (!cancelled) {
                setPreview(result);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [bucketCount, cacheKey, filePath, vdjFolder, fileSize]);

    const waveformSegments = useMemo(
        () => (preview?.peaks ? buildWaveformSegments(preview.peaks, preview.colors) : []),
        [preview],
    );

    const frequencyBars = useMemo(() => {
        if (!preview?.frequency_bands || preview.frequency_bands.length === 0) {
            return [];
        }

        const total = preview.frequency_bands.length;
        const barWidth = 100 / total;

        return preview.frequency_bands.map((band, index) => {
            const normalized = band / 255;
            const height = Math.max(4, normalized * 24);
            const x = index * barWidth + barWidth * 0.12;
            const y = 28 - height;

            return {
                key: `${index}-${band}`,
                x,
                y,
                width: Math.max(1.6, barWidth * 0.76),
                height,
                fill: getBandColor(index, total),
            };
        });
    }, [preview]);

    const visibleCueMarkers = useMemo(
        () => buildCueOverlayMarkers(cueMarkers, durationSecs),
        [cueMarkers, durationSecs],
    );

    if (preview === undefined) {
        return (
            <div
                aria-hidden
                className={`${heightClass} w-full animate-pulse rounded bg-surface-hover/70`}
                title="Cargando waveform…"
            />
        );
    }

    if (!preview || preview.peaks.length === 0) {
        return (
            <div
                className={`${heightClass} w-full rounded border border-dashed border-border/70 bg-surface-hover/30`}
                title="Waveform no disponible para este archivo"
            />
        );
    }

    return (
        <div className={`flex ${heightClass} w-full items-center`} title="Waveform + espectro de frecuencias del archivo">
            <svg
                aria-label="Waveform"
                className={`${svgClassName} w-full overflow-visible text-primary-light opacity-90`}
                preserveAspectRatio="none"
                viewBox="0 0 100 28"
            >
                {frequencyBars.map((bar) => (
                    <rect
                        key={bar.key}
                        fill={bar.fill}
                        height={bar.height}
                        rx="0.8"
                        width={bar.width}
                        x={bar.x}
                        y={bar.y}
                    />
                ))}
                <line
                    className="text-border/80"
                    stroke="currentColor"
                    strokeWidth="0.9"
                    x1="0"
                    x2="100"
                    y1="14"
                    y2="14"
                />
                {waveformSegments.map((segment) => (
                    <line
                        key={segment.key}
                        stroke={segment.color}
                        strokeLinecap="round"
                        strokeWidth="1.15"
                        x1={segment.x.toFixed(2)}
                        x2={segment.x.toFixed(2)}
                        y1={segment.y1.toFixed(2)}
                        y2={segment.y2.toFixed(2)}
                    />
                ))}
                {/* Cue markers inspired by VDJ songpos/rhythm cue overlays */}
                {visibleCueMarkers.map(({ cue, index, lineX, labelX, labelWidth, label }) => {
                    const markerColor = cue.color ?? "#ffb020";

                    return (
                        <g key={`cue-${index}-${cue.pos}`}>
                            <line
                                x1={lineX.toFixed(2)}
                                x2={lineX.toFixed(2)}
                                y1="5.6"
                                y2="28"
                                stroke={markerColor}
                                strokeOpacity="0.95"
                                strokeWidth="1.2"
                            />
                            <rect
                                fill={markerColor}
                                height="4.8"
                                rx="1.2"
                                width={labelWidth}
                                x={labelX.toFixed(2)}
                                y="0.4"
                            />
                            <text
                                fill="#0b0b0f"
                                fontSize="3.1"
                                fontWeight="700"
                                textAnchor="middle"
                                x={(labelX + labelWidth / 2).toFixed(2)}
                                y="3.85"
                            >
                                {label}
                            </text>
                            <title>{cue.name ?? `Cue ${label}`} ({cue.pos.toFixed(2)}s)</title>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
