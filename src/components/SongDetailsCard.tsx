import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Clock3, Database, FolderOpen, RotateCcw, Save } from "lucide-react";
import { useApp } from "../App";
import type { SongSummary } from "../types/database";
import { formatDuration, formatSize, getEffectiveColor, updateSongTags } from "../lib/api";
import { shouldApplySongUpdate } from "../lib/songUpdateResult";
import { WaveformPreview } from "./WaveformPreview";

interface TagFormState {
    title: string;
    author: string;
    remix: string;
    album: string;
    remixer: string;
    composer: string;
    label: string;
    genre: string;
    year: string;
    trackNumber: string;
    grouping: string;
    bpm: string;
    key: string;
    gain: string;
    stars: string;
    commentText: string;
    user1: string;
    user2: string;
    color: string;
}

function stringValue(value: string | number | null | undefined): string {
    if (value == null) return "";
    return String(value);
}

function formStateFromSong(song: SongSummary, rowColor: string | null): TagFormState {
    return {
        title: stringValue(song.title),
        author: stringValue(song.author),
        remix: stringValue(song.remix),
        album: stringValue(song.album),
        remixer: stringValue(song.remixer),
        composer: stringValue(song.composer),
        label: stringValue(song.label),
        genre: stringValue(song.genre),
        year: stringValue(song.year),
        trackNumber: stringValue(song.track_number),
        grouping: stringValue(song.grouping),
        bpm: song.bpm != null ? song.bpm.toFixed(2) : "",
        key: stringValue(song.key),
        gain: stringValue(song.gain),
        stars: stringValue(song.stars),
        commentText: stringValue(song.comment),
        user1: stringValue(song.user1),
        user2: stringValue(song.user2),
        color: rowColor ?? "#8f5cf7",
    };
}

function normalizeNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function cssHexToVdjColorRef(hex: string): string {
    const normalized = hex.replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return String((b << 16) | (g << 8) | r);
}

function buildSongPatch(form: TagFormState, includeColor: boolean): Partial<SongSummary> {
    const bpm = Number.parseFloat(form.bpm);
    const patch: Partial<SongSummary> = {
        title: normalizeNullable(form.title),
        author: normalizeNullable(form.author),
        remix: normalizeNullable(form.remix),
        album: normalizeNullable(form.album),
        remixer: normalizeNullable(form.remixer),
        composer: normalizeNullable(form.composer),
        label: normalizeNullable(form.label),
        genre: normalizeNullable(form.genre),
        year: normalizeNullable(form.year),
        track_number: normalizeNullable(form.trackNumber),
        grouping: normalizeNullable(form.grouping),
        bpm: Number.isFinite(bpm) ? bpm : null,
        key: normalizeNullable(form.key),
        gain: normalizeNullable(form.gain),
        stars: normalizeNullable(form.stars),
        comment: normalizeNullable(form.commentText),
        user1: normalizeNullable(form.user1),
        user2: normalizeNullable(form.user2),
    };

    if (includeColor) {
        patch.color = cssHexToVdjColorRef(form.color);
    }

    return patch;
}

function buildTagUpdate(form: TagFormState, includeColor: boolean) {
    const update: {
        title: string;
        author: string;
        remix: string;
        album: string;
        remixer: string;
        composer: string;
        label: string;
        genre: string;
        year: string;
        trackNumber: string;
        grouping: string;
        bpm: string;
        key: string;
        gain: string;
        stars: string;
        commentText: string;
        user1: string;
        user2: string;
        color?: string;
    } = {
        title: form.title,
        author: form.author,
        remix: form.remix,
        album: form.album,
        remixer: form.remixer,
        composer: form.composer,
        label: form.label,
        genre: form.genre,
        year: form.year,
        trackNumber: form.trackNumber,
        grouping: form.grouping,
        bpm: form.bpm,
        key: form.key,
        gain: form.gain,
        stars: form.stars,
        commentText: form.commentText,
        user1: form.user1,
        user2: form.user2,
    };

    if (includeColor) {
        update.color = cssHexToVdjColorRef(form.color);
    }

    return update;
}

function isDemoMode(): boolean {
    return new URLSearchParams(window.location.search).has("demo");
}

function MetaBadge({ children }: { children: ReactNode }) {
    return <span className="badge border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] text-text-secondary">{children}</span>;
}

function Field({
    label,
    value,
    onChange,
    disabled,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    type?: string;
}) {
    return (
        <label className="grid min-w-0 grid-cols-[5.8rem_minmax(0,1fr)] items-center gap-2 text-[12px] text-text-secondary">
            <span className="truncate text-right text-[12px] text-text-secondary">{label}</span>
            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="h-7 min-w-0 rounded-[3px] border border-border-strong bg-background/80 px-2 text-[12px] text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
        </label>
    );
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="grid min-w-0 grid-cols-[5.8rem_minmax(0,1fr)] items-center gap-2 text-[12px] text-text-secondary">
            <span className="truncate text-right text-[12px] text-text-secondary">{label}</span>
            <div className="h-7 min-w-0 truncate rounded-[3px] border border-border bg-background/45 px-2 py-1.5 text-[12px] text-text-muted" title={value ?? undefined}>
                {value && value.trim() ? value : "—"}
            </div>
        </div>
    );
}

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <div className="relative -mb-px ml-4 inline-flex rounded-t-[3px] border border-border bg-background px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-text">
            {children}
        </div>
    );
}

/** Dense VirtualDJ-inspired tag editor adapted to the app design system. */
export function SongDetailsCard({ song }: { song: SongSummary }) {
    const { vdjFolder, patchSong, setError } = useApp();
    const rowColor = getEffectiveColor(song);
    const [form, setForm] = useState<TagFormState>(() => formStateFromSong(song, rowColor));
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        setForm(formStateFromSong(song, getEffectiveColor(song)));
        setStatus(null);
    }, [song.index]);

    const initialForm = useMemo(() => formStateFromSong(song, rowColor), [song, rowColor]);
    const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
    const editable = song.in_database && Boolean(vdjFolder);
    const title = form.title || song.file_name;
    const artist = form.author || "Artista desconocido";
    const folderPath = song.file_path.includes("\\")
        ? song.file_path.substring(0, song.file_path.lastIndexOf("\\"))
        : song.file_path.substring(0, song.file_path.lastIndexOf("/"));

    function setField<K extends keyof TagFormState>(key: K, value: TagFormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setStatus(null);
    }

    async function save() {
        if (!editable || saving) return;

        setSaving(true);
        setError(null);
        try {
            const includeColor = Boolean(rowColor) || form.color !== initialForm.color;
            if (!isDemoMode() && vdjFolder) {
                const result = await updateSongTags(vdjFolder, song.file_path, buildTagUpdate(form, includeColor));
                if (!shouldApplySongUpdate(result)) {
                    throw new Error(`Resultado de actualización: ${result.status}`);
                }
            }
            patchSong(song.index, buildSongPatch(form, includeColor));
            setStatus("Etiquetas guardadas");
        } catch (err) {
            const message = `No se pudieron guardar las etiquetas: ${String(err)}`;
            setError(message);
            setStatus(message);
        } finally {
            setSaving(false);
        }
    }

    function reset() {
        setForm(initialForm);
        setStatus(null);
    }

    return (
        <section className="overflow-hidden rounded-[6px] border border-border bg-[#111113] shadow-xl">
            <div className="flex items-center justify-between border-b border-border bg-[#1b1b1d] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-[13px] font-bold uppercase tracking-wide text-text">Editor de etiquetas</h3>
                    {song.in_database ? (
                        <MetaBadge><Database className="mr-1 inline h-3 w-3" /> database.xml</MetaBadge>
                    ) : (
                        <MetaBadge><FolderOpen className="mr-1 inline h-3 w-3" /> externo</MetaBadge>
                    )}
                    {dirty && <MetaBadge>sin guardar</MetaBadge>}
                    {status && <span className="truncate text-[11px] text-text-muted">{status}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty || saving} onClick={reset}>
                        <RotateCcw className="h-3.5 w-3.5" /> Revertir
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" disabled={!editable || !dirty || saving} onClick={save}>
                        <Save className="h-3.5 w-3.5" /> {saving ? "Guardando" : "Guardar"}
                    </button>
                </div>
            </div>

            <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_11rem]">
                <div className="min-w-0 space-y-3">
                    <div className="grid gap-x-5 gap-y-2 md:grid-cols-2">
                        <Field label="Artista" value={form.author} disabled={!editable} onChange={(value) => setField("author", value)} />
                        <Field label="Remix" value={form.remix} disabled={!editable} onChange={(value) => setField("remix", value)} />
                        <Field label="Título" value={form.title} disabled={!editable} onChange={(value) => setField("title", value)} />
                        <Field label="Álbum" value={form.album} disabled={!editable} onChange={(value) => setField("album", value)} />
                    </div>

                    <div className="border-t border-border pt-3">
                        <div className="grid gap-x-5 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Remixer" value={form.remixer} disabled={!editable} onChange={(value) => setField("remixer", value)} />
                            <Field label="Compositor" value={form.composer} disabled={!editable} onChange={(value) => setField("composer", value)} />
                            <Field label="Disquera" value={form.label} disabled={!editable} onChange={(value) => setField("label", value)} />
                            <Field label="Género" value={form.genre} disabled={!editable} onChange={(value) => setField("genre", value)} />
                            <Field label="Año" value={form.year} disabled={!editable} onChange={(value) => setField("year", value)} />
                            <Field label="Track" value={form.trackNumber} disabled={!editable} onChange={(value) => setField("trackNumber", value)} />
                            <Field label="Agrupar en" value={form.grouping} disabled={!editable} onChange={(value) => setField("grouping", value)} />
                            <label className="grid min-w-0 grid-cols-[5.8rem_minmax(0,1fr)] items-center gap-2 text-[12px] text-text-secondary">
                                <span className="truncate text-right text-[12px] text-text-secondary">Color</span>
                                <div className="flex h-7 min-w-0 items-center gap-2 rounded-[3px] border border-border-strong bg-background/80 px-1.5">
                                    <input
                                        type="color"
                                        value={form.color}
                                        disabled={!editable}
                                        onChange={(event) => setField("color", event.target.value)}
                                        className="h-5 w-8 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                                    />
                                    <span className="truncate font-mono text-[11px] text-text">{form.color.toUpperCase()}</span>
                                </div>
                            </label>
                            <Field label="BPM" value={form.bpm} disabled={!editable} onChange={(value) => setField("bpm", value)} />
                            <Field label="Nota/Tono" value={form.key} disabled={!editable} onChange={(value) => setField("key", value)} />
                            <Field label="Ganancia(dB)" value={form.gain} disabled={!editable} onChange={(value) => setField("gain", value)} />
                            <Field label="Puntaje" value={form.stars} disabled={!editable} onChange={(value) => setField("stars", value)} />
                            <ReadonlyField label="Play Count" value={stringValue(song.play_count)} />
                            <ReadonlyField label="First Seen" value={song.first_seen} />
                            <ReadonlyField label="First Play" value={song.first_play} />
                            <ReadonlyField label="Last Play" value={song.last_play} />
                        </div>
                    </div>
                </div>

                <aside className="grid min-h-32 content-between rounded-[4px] border border-border bg-background/70 p-2">
                    <div>
                        <div className="truncate text-sm font-bold text-text" title={title}>{title}</div>
                        <div className="truncate text-xs text-text-secondary" title={artist}>{artist}</div>
                    </div>
                    <div className="mt-3 border-t border-border pt-2">
                        <WaveformPreview
                            filePath={song.file_path}
                            fileSize={song.file_size}
                            bucketCount={64}
                            cueMarkers={song.cue_markers}
                            durationSecs={song.duration_secs}
                            vdjFolder={vdjFolder}
                            heightClass="h-12"
                            svgClassName="h-12"
                        />
                    </div>
                </aside>
            </div>

            <div className="border-t border-border bg-background/35 px-3 py-2">
                <label className="grid min-w-0 grid-cols-[5.8rem_minmax(0,1fr)] items-start gap-2 text-[12px] text-text-secondary">
                    <span className="pt-1 text-right text-[12px] text-text-secondary">Comentarios</span>
                    <textarea
                        value={form.commentText}
                        disabled={!editable}
                        onChange={(event) => setField("commentText", event.target.value)}
                        className="min-h-10 resize-y rounded-[3px] border border-border-strong bg-background/80 px-2 py-1.5 text-[12px] text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                </label>
                <div className="mt-2 grid gap-x-5 gap-y-2 md:grid-cols-2">
                    <Field label="Notas" value={form.user1} disabled={!editable} onChange={(value) => setField("user1", value)} />
                    <Field label="User 2" value={form.user2} disabled={!editable} onChange={(value) => setField("user2", value)} />
                </div>
            </div>

            <div className="border-t border-border">
                <SectionTitle>Información del archivo</SectionTitle>
                <div className="grid gap-2 bg-background/75 px-3 pb-3 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <ReadonlyField label="Nombre" value={song.file_name} />
                    <ReadonlyField label="Duración" value={formatDuration(song.duration_secs)} />
                    <ReadonlyField label="Ruta" value={folderPath} />
                    <ReadonlyField label="Tamaño" value={formatSize(song.file_size)} />
                    <ReadonlyField label="Bitrate" value={song.bitrate ? `${song.bitrate} kbps` : null} />
                    <ReadonlyField label="Archivo" value={song.file_path} />
                </div>
            </div>

            {song.cue_markers.length > 0 && (
                <div className="border-t border-border px-3 py-2">
                    <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase text-text-muted">
                        <Clock3 className="h-3.5 w-3.5" /> cue markers
                    </div>
                    <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
                        {song.cue_markers.map((cue, index) => (
                            <div key={`${cue.pos}-${index}`} className="rounded-[4px] border border-border bg-background/45 px-2 py-1.5 text-[11px] text-text">
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
