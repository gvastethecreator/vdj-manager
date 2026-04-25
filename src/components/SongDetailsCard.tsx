import type { ReactNode } from "react";
import { Music2, Database, FolderOpen, Clock3, AudioLines } from "lucide-react";
import type { SongSummary } from "../types/database";
import { formatDuration, formatSize, getEffectiveColor } from "../lib/api";
import { WaveformPreview } from "./WaveformPreview";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="rounded border border-border/50 bg-surface-hover/20 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
            <div className="mt-1 wrap-break-word text-sm text-text">{value && value.trim() ? value : "—"}</div>
        </div>
    );
}

function MetaBadge({ children }: { children: ReactNode }) {
    return <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] text-text-secondary">{children}</span>;
}

/** Rich song summary card inspired by deck metadata panels. */
export function SongDetailsCard({ song }: { song: SongSummary }) {
    const rowColor = getEffectiveColor(song);
    const title = song.title || song.file_name;
    const artist = song.author || "Artista desconocido";
    const folderPath = song.file_path.includes("\\")
        ? song.file_path.substring(0, song.file_path.lastIndexOf("\\"))
        : song.file_path.substring(0, song.file_path.lastIndexOf("/"));

    return (
        <section className="card overflow-hidden border border-border/70">
            <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                    <div
                        className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface"
                        style={rowColor ? { boxShadow: `inset 0 0 0 2px ${rowColor}55` } : undefined}
                    >
                        <Music2 className="h-9 w-9 text-primary-light" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-2xl font-bold text-text">{title}</h3>
                            {song.in_database ? (
                                <MetaBadge><Database className="mr-1 inline h-3 w-3" /> database.xml</MetaBadge>
                            ) : (
                                <MetaBadge><FolderOpen className="mr-1 inline h-3 w-3" /> externo</MetaBadge>
                            )}
                            {song.has_stems && <MetaBadge>stems</MetaBadge>}
                            {song.cue_count > 0 && <MetaBadge>{song.cue_count} cues</MetaBadge>}
                        </div>
                        <p className="mt-1 text-lg text-text-secondary">{artist}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <MetaBadge>{song.bpm ? `${song.bpm.toFixed(1)} BPM` : "BPM —"}</MetaBadge>
                            <MetaBadge>{song.key ?? "Key —"}</MetaBadge>
                            <MetaBadge>{formatDuration(song.duration_secs)}</MetaBadge>
                            <MetaBadge>{song.bitrate ?? "Bitrate —"}</MetaBadge>
                            <MetaBadge>{formatSize(song.file_size)}</MetaBadge>
                            <MetaBadge>{song.play_count != null ? `${song.play_count} plays` : "Plays —"}</MetaBadge>
                        </div>
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 text-right text-[11px] xl:w-72">
                    <div className="rounded border border-border/50 bg-surface-hover/20 px-3 py-2">
                        <div className="text-text-muted">Cues</div>
                        <div className="text-lg font-semibold text-text">{song.cue_count}</div>
                    </div>
                    <div className="rounded border border-border/50 bg-surface-hover/20 px-3 py-2">
                        <div className="text-text-muted">Rating</div>
                        <div className="text-lg font-semibold text-text">{song.stars ?? "—"}</div>
                    </div>
                    <div className="rounded border border-border/50 bg-surface-hover/20 px-3 py-2">
                        <div className="text-text-muted">Color</div>
                        <div className="mt-1 flex items-center justify-end gap-2 text-text">
                            {rowColor ? <span className="inline-block h-3.5 w-3.5 rounded border border-border/60" style={{ backgroundColor: rowColor }} /> : null}
                            {rowColor ?? "—"}
                        </div>
                    </div>
                    <div className="rounded border border-border/50 bg-surface-hover/20 px-3 py-2">
                        <div className="text-text-muted">Ganancia</div>
                        <div className="text-lg font-semibold text-text">{song.gain ?? "—"}</div>
                    </div>
                </div>
            </div>

            <div className="border-y border-border/60 bg-background/40 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    <AudioLines className="h-3.5 w-3.5" /> waveform y cues
                </div>
                <WaveformPreview
                    filePath={song.file_path}
                    bucketCount={160}
                    cueMarkers={song.cue_markers}
                    durationSecs={song.duration_secs}
                    heightClass="h-20"
                    svgClassName="h-20"
                />
            </div>

            <div className="grid gap-3 p-4 lg:grid-cols-2 2xl:grid-cols-3">
                <InfoRow label="Archivo" value={song.file_name} />
                <InfoRow label="Ruta" value={song.file_path} />
                <InfoRow label="Carpeta" value={folderPath} />
                <InfoRow label="Álbum" value={song.album} />
                <InfoRow label="Género" value={song.genre} />
                <InfoRow label="Año" value={song.year} />
                <InfoRow label="Sello" value={song.label} />
                <InfoRow label="Compositor" value={song.composer} />
                <InfoRow label="Track #" value={song.track_number} />
                <InfoRow label="Remix" value={song.remix} />
                <InfoRow label="Remixer" value={song.remixer} />
                <InfoRow label="Grouping" value={song.grouping} />
                <InfoRow label="User 1" value={song.user1} />
                <InfoRow label="User 2" value={song.user2} />
                <InfoRow label="Primera vez visto" value={song.first_seen} />
                <InfoRow label="Primer play" value={song.first_play} />
                <InfoRow label="Último play" value={song.last_play} />
                <InfoRow label="Comentario" value={song.comment} />
            </div>

            {song.cue_markers.length > 0 && (
                <div className="border-t border-border/60 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        <Clock3 className="h-3.5 w-3.5" /> cue markers
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {song.cue_markers.map((cue, index) => (
                            <div key={`${cue.pos}-${index}`} className="rounded border border-border/50 bg-surface-hover/20 px-3 py-2 text-sm text-text">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{cue.name || `Cue ${cue.num ?? index + 1}`}</span>
                                    <span className="font-mono text-[11px] text-text-muted">{cue.pos.toFixed(2)}s</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                                    <span>{cue.poi_type ?? "cue"}</span>
                                    {cue.color && <span className="inline-block h-3 w-3 rounded border border-border/60" style={{ backgroundColor: cue.color }} />}
                                    {cue.color && <span className="font-mono">{cue.color}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
