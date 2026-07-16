import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SongSummary } from "../types/database";
import { formatDuration, formatSize, getEffectiveColor } from "../lib/api";
import { compareDriveAwarePaths, compareSongsByDrivePath } from "../lib/pathUtils";
import { shouldApplySongUpdate } from "../lib/songUpdateResult";
import { WaveformPreview, onWaveformQueueChange } from "./WaveformPreview";
import { useApp } from "../App";

// ── Column configuration ──

export type SortKey =
    | "file_path" | "file_name" | "file_size" | "title" | "author" | "album" | "genre"
    | "bpm" | "key" | "duration_secs" | "play_count" | "year"
    | "stars" | "cue_count" | "bitrate" | "label" | "composer"
    | "remix" | "remixer" | "grouping" | "comment"
    | "color" | "gain" | "first_seen" | "first_play" | "last_play"
    | "has_stems" | "track_number" | "user1" | "user2";

export type ColumnKey = SortKey | "waveform" | "play";

export interface ColumnDef {
    key: ColumnKey;
    label: string;
    width: number;
    defaultVisible: boolean;
    render: (song: SongSummary, helpers: RenderHelpers) => ReactNode;
    cellClass?: string;
    /** If set, this column supports double-click inline editing */
    editableTag?: string;
}

interface RenderHelpers {
    rowColor: string | null;
    onStartEdit?: (songIndex: number, columnKey: ColumnKey) => void;
    editState?: { songIndex: number; columnKey: ColumnKey; value: string } | null;
    onEditChange?: (value: string) => void;
    onEditCommit?: () => void;
    onEditCancel?: () => void;
    onStarClick?: (songIndex: number, stars: number) => void;
    onColorClick?: (songIndex: number, e: React.MouseEvent) => void;
    onPlayClick?: (filePath: string) => void;
    playingPath?: string | null;
    vdjFolder?: string | null;
}

/** All available columns for the song data table. Shared across views. */
export const ALL_COLUMNS: ColumnDef[] = [
    {
        key: "play", label: "▶", width: 32, defaultVisible: true,
        render: (s, { onPlayClick, playingPath }) => (
            <button
                type="button"
                className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-text-muted hover:bg-primary/15 hover:text-primary-light"
                onClick={() => onPlayClick?.(s.file_path)}
                aria-label={playingPath === s.file_path ? `Pausar ${s.file_name}` : `Reproducir ${s.file_name}`}
                title="Reproducir"
            >
                {playingPath === s.file_path
                    ? <span className="text-primary-light text-xs">⏸</span>
                    : <span className="text-xs">▶</span>}
            </button>
        ),
    },
    { key: "file_name", label: "Archivo", width: 180, defaultVisible: true, cellClass: "overflow-hidden truncate text-text", render: (s) => <span title={s.file_path}>{s.file_name}</span> },
    { key: "waveform", label: "Wave", width: 124, defaultVisible: true, cellClass: "py-0.5", render: (s, h) => <WaveformPreview filePath={s.file_path} fileSize={s.file_size} cueMarkers={s.cue_markers} durationSecs={s.duration_secs} vdjFolder={h.vdjFolder} /> },
    { key: "title", label: "Título", width: 150, defaultVisible: true, cellClass: "overflow-hidden truncate", editableTag: "title", render: (s, h) => <EditableCell song={s} columnKey="title" value={s.title} helpers={h} /> },
    { key: "author", label: "Artista", width: 130, defaultVisible: true, cellClass: "overflow-hidden truncate", editableTag: "author", render: (s, h) => <EditableCell song={s} columnKey="author" value={s.author} helpers={h} /> },
    { key: "album", label: "Álbum", width: 130, defaultVisible: true, cellClass: "overflow-hidden truncate", editableTag: "album", render: (s, h) => <EditableCell song={s} columnKey="album" value={s.album} helpers={h} /> },
    { key: "genre", label: "Género", width: 90, defaultVisible: true, cellClass: "overflow-hidden truncate", editableTag: "genre", render: (s, h) => <EditableCell song={s} columnKey="genre" value={s.genre} helpers={h} /> },
    { key: "year", label: "Año", width: 50, defaultVisible: true, cellClass: "tabular-nums", editableTag: "year", render: (s, h) => <EditableCell song={s} columnKey="year" value={s.year} helpers={h} /> },
    { key: "bpm", label: "BPM", width: 58, defaultVisible: true, cellClass: "tabular-nums", render: (s) => s.bpm ? s.bpm.toFixed(1) : "—" },
    { key: "key", label: "Key", width: 58, defaultVisible: true, render: (s) => <KeyBadge keyStr={s.key} /> },
    { key: "duration_secs", label: "Duración", width: 72, defaultVisible: true, cellClass: "tabular-nums", render: (s) => formatDuration(s.duration_secs) },
    { key: "bitrate", label: "Bitrate", width: 62, defaultVisible: true, cellClass: "tabular-nums", render: (s) => s.bitrate ?? "—" },
    { key: "file_size", label: "Tamaño", width: 72, defaultVisible: false, cellClass: "tabular-nums", render: (s) => formatSize(s.file_size) },
    { key: "play_count", label: "Plays", width: 52, defaultVisible: true, cellClass: "tabular-nums", render: (s) => s.play_count ?? "—" },
    {
        key: "stars", label: "★", width: 132, defaultVisible: true,
        render: (s, { onStarClick }) => <StarRating stars={s.stars} onRate={s.in_database && onStarClick ? (v) => onStarClick(s.index, v) : undefined} />,
    },
    { key: "cue_count", label: "Cues", width: 48, defaultVisible: true, cellClass: "tabular-nums", render: (s) => s.cue_count || "—" },
    { key: "has_stems", label: "Stems", width: 52, defaultVisible: true, render: (s) => s.has_stems ? <span className="badge bg-purple-500/15 text-purple-400">S</span> : null },
    { key: "label", label: "Sello", width: 100, defaultVisible: true, cellClass: "overflow-hidden truncate", editableTag: "label", render: (s, h) => <EditableCell song={s} columnKey="label" value={s.label} helpers={h} /> },
    { key: "composer", label: "Compositor", width: 100, defaultVisible: true, cellClass: "overflow-hidden truncate", editableTag: "composer", render: (s, h) => <EditableCell song={s} columnKey="composer" value={s.composer} helpers={h} /> },
    { key: "remix", label: "Remix", width: 100, defaultVisible: false, cellClass: "overflow-hidden truncate", editableTag: "remix", render: (s, h) => <EditableCell song={s} columnKey="remix" value={s.remix} helpers={h} /> },
    { key: "remixer", label: "Remixer", width: 100, defaultVisible: false, cellClass: "overflow-hidden truncate", editableTag: "remixer", render: (s, h) => <EditableCell song={s} columnKey="remixer" value={s.remixer} helpers={h} /> },
    { key: "grouping", label: "Grupo", width: 80, defaultVisible: false, cellClass: "overflow-hidden truncate", editableTag: "grouping", render: (s, h) => <EditableCell song={s} columnKey="grouping" value={s.grouping} helpers={h} /> },
    { key: "track_number", label: "Track #", width: 56, defaultVisible: false, cellClass: "tabular-nums", editableTag: "trackNumber", render: (s, h) => <EditableCell song={s} columnKey="track_number" value={s.track_number} helpers={h} /> },
    {
        key: "color", label: "Color", width: 46, defaultVisible: true,
        render: (_s, { rowColor, onColorClick }) => rowColor
            ? (_s.in_database
                ? <button type="button" className="inline-block h-[24px] w-[24px] rounded-[3px] border border-border/60 cursor-pointer hover:ring-2 hover:ring-primary/40" style={{ backgroundColor: rowColor }} aria-label={`Cambiar color de ${_s.file_name}; actual ${rowColor}`} title={`Color: ${rowColor} — click para cambiar`} onClick={(e) => onColorClick?.(_s.index, e)} />
                : <span className="inline-block h-3.5 w-3.5 rounded-[3px] border border-border/60" style={{ backgroundColor: rowColor }} title={`Color: ${rowColor}`} />)
            : (_s.in_database
                ? <button type="button" className="inline-flex h-[24px] w-[24px] items-center justify-center text-text-muted hover:text-primary-light cursor-pointer" aria-label={`Asignar color a ${_s.file_name}`} title="Asignar color" onClick={(e) => onColorClick?.(_s.index, e)}>+</button>
                : <span className="text-text-muted">—</span>),
    },
    { key: "gain", label: "Gain", width: 52, defaultVisible: false, cellClass: "tabular-nums", render: (s) => s.gain ?? "—" },
    { key: "comment", label: "Comentario", width: 100, defaultVisible: false, cellClass: "overflow-hidden truncate", editableTag: "commentText", render: (s, h) => <EditableCell song={s} columnKey="comment" value={s.comment} helpers={h} /> },
    { key: "user1", label: "User 1", width: 80, defaultVisible: false, cellClass: "overflow-hidden truncate", editableTag: "user1", render: (s, h) => <EditableCell song={s} columnKey="user1" value={s.user1} helpers={h} /> },
    { key: "user2", label: "User 2", width: 80, defaultVisible: false, cellClass: "overflow-hidden truncate", editableTag: "user2", render: (s, h) => <EditableCell song={s} columnKey="user2" value={s.user2} helpers={h} /> },
    { key: "first_seen", label: "1ra vez", width: 86, defaultVisible: false, cellClass: "tabular-nums text-xs text-text-muted", render: (s) => s.first_seen ?? "—" },
    { key: "first_play", label: "1er play", width: 86, defaultVisible: false, cellClass: "tabular-nums text-xs text-text-muted", render: (s) => s.first_play ?? "—" },
    { key: "last_play", label: "Último play", width: 86, defaultVisible: false, cellClass: "tabular-nums text-xs text-text-muted", render: (s) => s.last_play ?? "—" },
];

const DEFAULT_VISIBLE = new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
const LS_KEY = "vdj-visible-columns";
const COLUMN_PREFS_VERSION = 2;

// ── Column configuration end ──

// ── Inline editing cell ──
function EditableCell({ song, columnKey, value, helpers }: {
    song: SongSummary;
    columnKey: ColumnKey;
    value: string | null | undefined;
    helpers: RenderHelpers;
}) {
    if (!song.in_database) {
        return <span title="Archivo externo (no está en database.xml)">{value ?? "—"}</span>;
    }

    const isEditing = helpers.editState?.songIndex === song.index && helpers.editState?.columnKey === columnKey;

    if (isEditing) {
        return (
            <input
                type="text"
                aria-label={`Editar ${columnKey} de ${song.file_name}`}
                className="w-full rounded border border-primary/50 bg-surface px-1 py-0 text-xs text-text outline-none focus:border-primary"
                value={helpers.editState?.value ?? ""}
                onChange={(e) => helpers.onEditChange?.(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") helpers.onEditCommit?.();
                    if (e.key === "Escape") helpers.onEditCancel?.();
                }}
                onBlur={() => helpers.onEditCommit?.()}
                autoFocus
            />
        );
    }

    return (
        <span
            className="cursor-text"
            onDoubleClick={() => helpers.onStartEdit?.(song.index, columnKey)}
            title="Doble click para editar"
        >
            {value ?? "—"}
        </span>
    );
}

// ── Star Rating ──
const STAR_COLORS = ["#fbbf24", "#fbbf24", "#fbbf24", "#fbbf24", "#fbbf24"];

function StarRating({ stars, onRate }: { stars: string | null | undefined; onRate?: (value: number) => void }) {
    const current = stars ? parseInt(stars, 10) : 0;
    const filled = isNaN(current) ? 0 : Math.min(5, Math.max(0, current));

    return (
        <span className="inline-flex gap-px">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    className="flex h-[24px] w-[24px] items-center justify-center p-0 leading-none disabled:cursor-default"
                    style={{ color: n <= filled ? STAR_COLORS[n - 1] : "var(--color-text-muted)", fontSize: "12px", background: "none", border: "none" }}
                    onClick={() => onRate?.(n === filled ? 0 : n)}
                    disabled={!onRate}
                    aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                    title={`${n} estrella${n > 1 ? "s" : ""}`}
                >
                    ★
                </button>
            ))}
        </span>
    );
}

// ── Color Picker Popup ──
const PRESET_COLORS = [
    "#ff0000", "#ff6b00", "#ffd000", "#00cc00", "#00aaff",
    "#0044ff", "#8800ff", "#ff00aa", "#ffffff", "#888888",
    "#ff4444", "#ffaa44", "#ffee44", "#44dd44", "#44ccff",
    "#4488ff", "#aa44ff", "#ff44cc", "#cccccc", "#444444",
];

function ColorPickerPopup({ position, currentColor, onSelect, onClose }: {
    position: { x: number; y: number };
    currentColor: string | null;
    onSelect: (color: string | null) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [custom, setCustom] = useState(currentColor ?? "#8b5cf6");

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-lg border-2 border-border bg-surface p-2.5 shadow-xl"
            style={{ left: position.x, top: position.y }}
        >
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">Color</div>
            <div className="grid grid-cols-5 gap-1">
                {PRESET_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className="h-[24px] w-[24px] rounded-[3px] border border-border/60 cursor-pointer hover:ring-2 hover:ring-primary/40"
                        style={{ backgroundColor: c }}
                        onClick={() => onSelect(c)}
                        title={c}
                    />
                ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
                <input
                    type="color"
                    aria-label="Color personalizado"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    className="h-[24px] w-[24px] cursor-pointer rounded border border-border/60 bg-transparent p-0"
                />
                <button type="button" className="btn btn-ghost btn-sm flex-1 text-xs" onClick={() => onSelect(custom)}>
                    Aplicar
                </button>
                <button type="button" className="btn btn-ghost btn-sm text-xs text-error" onClick={() => onSelect(null)}>
                    Quitar
                </button>
            </div>
        </div>
    );
}

// ── Audio player singleton ──
let globalAudio: HTMLAudioElement | null = null;

interface SongTableProps {
    songs: SongSummary[];
    activeSongIndex?: number | null;
    onRowSelect?: (song: SongSummary) => void;
    selectable?: boolean;
    selected?: Set<number>;
    onToggle?: (index: number) => void;
    onSelectAll?: () => void;
    onDeselectAll?: () => void;
    /** localStorage key suffix for per-view column visibility (default: shared) */
    storageKey?: string;
    /** Override which columns are visible by default */
    defaultColumns?: ColumnKey[];
}

const ROW_HEIGHT = 30;

/**
 * Full-featured sortable/searchable song table with virtualization.
 * Right-click column headers to choose visible columns.
 */
export function SongTable({
    songs,
    activeSongIndex,
    onRowSelect,
    selectable = false,
    selected,
    onToggle,
    onSelectAll,
    onDeselectAll,
    storageKey,
    defaultColumns,
}: SongTableProps) {
    const lsKey = storageKey ? `${LS_KEY}-${storageKey}` : LS_KEY;
    const lsVersionKey = `${lsKey}-version`;

    // ── Waveform processing feedback ──
    const [waveformQueue, setWaveformQueue] = useState({ pending: 0, active: 0 });
    useEffect(() => onWaveformQueueChange((pending, active) => setWaveformQueue({ pending, active })), []);

    // ── Inline edit state ──
    const { vdjFolder, patchSong, reportUiError, refreshRecovery, mutationsBlocked, services } = useApp();
    const [editState, setEditState] = useState<{ songIndex: number; columnKey: ColumnKey; value: string } | null>(null);

    const patchFromEditableTag = useCallback((editableTag: string, value: string): Partial<SongSummary> => {
        const normalizedValue = value.trim() === "" ? null : value;

        switch (editableTag) {
            case "trackNumber":
                return { track_number: normalizedValue };
            case "commentText":
                return { comment: normalizedValue };
            default:
                return { [editableTag]: normalizedValue } as Partial<SongSummary>;
        }
    }, []);

    const onStartEdit = useCallback((songIndex: number, columnKey: ColumnKey) => {
        if (mutationsBlocked) return;
        const song = songs.find((s) => s.index === songIndex);
        if (!song) return;
        if (!song.in_database) return;
        const col = ALL_COLUMNS.find((c) => c.key === columnKey);
        if (!col?.editableTag) return;
        const currentValue = (song as unknown as Record<string, unknown>)[columnKey] as string | null;
        setEditState({ songIndex, columnKey, value: currentValue ?? "" });
    }, [mutationsBlocked, songs]);

    const onEditChange = useCallback((value: string) => {
        setEditState((prev) => prev ? { ...prev, value } : null);
    }, []);

    const onEditCommit = useCallback(async () => {
        if (!editState || !vdjFolder || mutationsBlocked) return;
        const col = ALL_COLUMNS.find((c) => c.key === editState.columnKey);
        if (!col?.editableTag) return;
        const song = songs.find((candidate) => candidate.index === editState.songIndex);
        if (!song?.in_database) return;
        try {
            const result = await services.updateSongTags(vdjFolder, song.file_path, { [col.editableTag]: editState.value });
            if (!shouldApplySongUpdate(result)) {
                throw new Error(`Resultado de actualización: ${result.status}`);
            }
            patchSong(editState.songIndex, patchFromEditableTag(col.editableTag, editState.value));
            setEditState(null);
        } catch (err) {
            await refreshRecovery();
            console.error("Error updating tag:", err);
            reportUiError("No se pudo actualizar el tag.", err);
        }
    }, [editState, mutationsBlocked, vdjFolder, patchFromEditableTag, patchSong, refreshRecovery, reportUiError, services, songs]);

    const onEditCancel = useCallback(() => setEditState(null), []);

    // ── Star click ──
    const onStarClick = useCallback(async (songIndex: number, stars: number) => {
        if (!vdjFolder || mutationsBlocked) return;
        const song = songs.find((s) => s.index === songIndex);
        if (!song?.in_database) return;
        try {
            const result = await services.updateSongTags(vdjFolder, song.file_path, { stars: stars > 0 ? String(stars) : "" });
            if (!shouldApplySongUpdate(result)) {
                throw new Error(`Resultado de actualización: ${result.status}`);
            }
            patchSong(songIndex, { stars: stars > 0 ? String(stars) : null });
        } catch (err) {
            await refreshRecovery();
            console.error("Error updating stars:", err);
            reportUiError("No se pudo actualizar la puntuación.", err);
        }
    }, [mutationsBlocked, vdjFolder, patchSong, refreshRecovery, reportUiError, services, songs]);

    // ── Audio playback ──
    const [playingPath, setPlayingPath] = useState<string | null>(null);
    const onPlayClick = useCallback((filePath: string) => {
        if (playingPath === filePath) {
            globalAudio?.pause();
            globalAudio = null;
            setPlayingPath(null);
            return;
        }
        if (globalAudio) { globalAudio.pause(); globalAudio = null; }
        const audio = new Audio(services.convertFileSrc(filePath));
        audio.volume = 0.5;
        audio.play().catch(console.error);
        audio.onended = () => { setPlayingPath(null); globalAudio = null; };
        globalAudio = audio;
        setPlayingPath(filePath);
    }, [playingPath, services]);

    // ── Color picker ──
    const [colorPicker, setColorPicker] = useState<{ songIndex: number; position: { x: number; y: number } } | null>(null);

    const onColorClick = useCallback((songIndex: number, e: React.MouseEvent) => {
        if (mutationsBlocked) return;
        const song = songs.find((s) => s.index === songIndex);
        if (!song?.in_database) return;
        setColorPicker({ songIndex, position: { x: e.clientX, y: e.clientY } });
    }, [mutationsBlocked, songs]);

    const onColorSelect = useCallback(async (color: string | null) => {
        if (!colorPicker || !vdjFolder || mutationsBlocked) return;
        const song = songs.find((candidate) => candidate.index === colorPicker.songIndex);
        if (!song?.in_database) return;
        try {
            // Convert CSS hex to VDJ COLORREF (BGR)
            let colorValue = "";
            if (color) {
                const hex = color.replace("#", "");
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                colorValue = String((b << 16) | (g << 8) | r);
            }
            const result = await services.updateSongTags(vdjFolder, song.file_path, { color: colorValue });
            if (!shouldApplySongUpdate(result)) {
                throw new Error(`Resultado de actualización: ${result.status}`);
            }
            patchSong(colorPicker.songIndex, { color: colorValue || null });
            setColorPicker(null);
        } catch (err) {
            await refreshRecovery();
            console.error("Error updating color:", err);
            reportUiError("No se pudo actualizar el color.", err);
        }
    }, [colorPicker, mutationsBlocked, vdjFolder, patchSong, refreshRecovery, reportUiError, services, songs]);

    const persistVisibleColumns = useCallback((next: Set<ColumnKey>) => {
        try {
            localStorage.setItem(lsKey, JSON.stringify([...next]));
            localStorage.setItem(lsVersionKey, String(COLUMN_PREFS_VERSION));
        } catch {
            /* ignore */
        }
    }, [lsKey, lsVersionKey]);

    const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() => {
        if (defaultColumns) return new Set(defaultColumns);
        try {
            const raw = localStorage.getItem(lsKey);
            if (raw) {
                const keys = JSON.parse(raw) as ColumnKey[];
                if (Array.isArray(keys) && keys.length > 0) {
                    const next = new Set(keys);
                    const storedVersion = localStorage.getItem(lsVersionKey);
                    if (storedVersion !== String(COLUMN_PREFS_VERSION)) {
                        next.add("waveform");
                    }
                    return next;
                }
            }
        } catch { /* ignore */ }
        return new Set(DEFAULT_VISIBLE);
    });

    useEffect(() => {
        try {
            localStorage.setItem(lsVersionKey, String(COLUMN_PREFS_VERSION));
        } catch {
            /* ignore */
        }
    }, [lsVersionKey]);

    const toggleColumn = useCallback((key: ColumnKey) => {
        setVisibleCols((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            persistVisibleColumns(next);
            return next;
        });
    }, [persistVisibleColumns]);

    const columns = useMemo(
        () => ALL_COLUMNS.filter((c) => visibleCols.has(c.key)),
        [visibleCols],
    );

    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("file_path");
    const [sortAsc, setSortAsc] = useState(true);
    const parentRef = useRef<HTMLDivElement>(null);

    // ── Context menu state ──
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
    const ctxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ctxMenu) return;
        function onClickOutside(e: MouseEvent) {
            if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
                setCtxMenu(null);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [ctxMenu]);

    const handleHeaderContext = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        let result = songs;
        if (q) {
            result = songs.filter(
                (s) =>
                    s.file_name.toLowerCase().includes(q) ||
                    (s.title ?? "").toLowerCase().includes(q) ||
                    (s.author ?? "").toLowerCase().includes(q) ||
                    (s.album ?? "").toLowerCase().includes(q) ||
                    (s.genre ?? "").toLowerCase().includes(q) ||
                    (s.comment ?? "").toLowerCase().includes(q) ||
                    (s.label ?? "").toLowerCase().includes(q) ||
                    (s.composer ?? "").toLowerCase().includes(q)
            );
        }
        return [...result].sort((a, b) => {
            if (sortKey === "file_path") {
                const cmp = compareSongsByDrivePath(a, b);
                return sortAsc ? cmp : -cmp;
            }
            if (sortKey === "file_name") {
                const cmp = compareDriveAwarePaths(a.file_path, b.file_path)
                    || a.file_name.localeCompare(b.file_name, undefined, { numeric: true, sensitivity: "base" });
                return sortAsc ? cmp : -cmp;
            }
            const va = a[sortKey] ?? "";
            const vb = b[sortKey] ?? "";
            const cmp = typeof va === "number" && typeof vb === "number"
                ? va - vb
                : typeof va === "boolean" && typeof vb === "boolean"
                    ? (va === vb ? 0 : va ? -1 : 1)
                    : String(va).localeCompare(String(vb));
            return sortAsc ? cmp : -cmp;
        });
    }, [songs, search, sortKey, sortAsc]);

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 20,
    });

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    }

    function getColumnSortKey(column: ColumnDef): SortKey | null {
        return column.key === "waveform" || column.key === "play" ? null : column.key;
    }

    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();
    const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
    const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;
    const colCount = columns.length + (selectable ? 1 : 0);
    const minWidth = columns.reduce((sum, c) => sum + c.width, 0) + (selectable ? 32 : 0);

    return (
        <div>
            {/* Search bar */}
            <div className="mb-2.5 flex items-center gap-2.5">
                <input
                    type="text"
                    aria-label="Buscar canciones"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, título, artista, álbum, género, sello, compositor..."
                    className="input flex-1"
                />
                <span className="text-xs tabular-nums text-text-muted">{filtered.length} resultados</span>
                {(waveformQueue.pending > 0 || waveformQueue.active > 0) && (
                    <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs tabular-nums text-primary-light">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-light" />
                        Waveforms: {waveformQueue.active} procesando, {waveformQueue.pending} en cola
                    </span>
                )}
                {selectable && (
                    <div className="flex gap-1.5">
                        <button type="button" onClick={onSelectAll} className="btn btn-ghost btn-sm">Seleccionar todo</button>
                        <button type="button" onClick={onDeselectAll} className="btn btn-ghost btn-sm">Deseleccionar</button>
                    </div>
                )}
            </div>

            {/* Virtualized Table */}
            <div
                ref={parentRef}
                className="data-table-shell max-h-[calc(100vh-220px)] overflow-auto"
            >
                <table className="w-full text-xs" style={{ tableLayout: "fixed", minWidth }}>
                    <colgroup>
                        {selectable && <col style={{ width: 32 }} />}
                        {columns.map((c) => <col key={c.key} style={{ width: c.width }} />)}
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                        <tr onContextMenu={handleHeaderContext}>
                            {selectable && <th className="w-8 px-1.5 py-1.5" />}
                            {columns.map((c) => {
                                const columnSortKey = getColumnSortKey(c);
                                return (
                                    <th
                                        key={c.key}
                                        className={`select-none whitespace-nowrap ${c.key === "play" || c.key === "stars" ? "px-1" : "px-2.5"} py-1.5 text-left text-xs font-semibold ${columnSortKey ? "cursor-pointer text-text-muted hover:text-text" : "text-text-muted/80"}`}
                                        onClick={columnSortKey ? () => toggleSort(columnSortKey) : undefined}
                                        onContextMenu={handleHeaderContext}
                                    >
                                        {c.label}
                                        {columnSortKey && sortKey === columnSortKey ? (sortAsc ? " ▲" : " ▼") : ""}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paddingTop > 0 && (
                            <tr><td style={{ height: paddingTop }} colSpan={colCount} /></tr>
                        )}
                        {virtualItems.map((virtualRow) => {
                            const song = filtered[virtualRow.index];
                            const rowColor = getEffectiveColor(song);
                            const helpers: RenderHelpers = {
                                rowColor,
                                onStartEdit,
                                editState,
                                onEditChange,
                                onEditCommit,
                                onEditCancel,
                                onStarClick,
                                onColorClick,
                                onPlayClick,
                                playingPath,
                                vdjFolder,
                            };
                            return (
                                <tr
                                    key={song.index}
                                    style={{
                                        height: ROW_HEIGHT,
                                        ...(rowColor && { borderLeft: `3px solid ${rowColor}` }),
                                    }}
                                    className={`border-b border-border/30 ${activeSongIndex === song.index ? "bg-primary/12 ring-1 ring-inset ring-primary/35" : selected?.has(song.index) ? "bg-primary/8" : ""} ${onRowSelect ? "cursor-pointer" : ""}`}
                                    onClick={() => onRowSelect?.(song)}
                                >
                                    {selectable && (
                                        <td className="px-1.5">
                                            <input
                                                type="checkbox"
                                                aria-label={`Seleccionar ${song.file_name}`}
                                                checked={selected?.has(song.index) ?? false}
                                                onChange={() => onToggle?.(song.index)}
                                            />
                                        </td>
                                    )}
                                    {columns.map((c) => (
                                        <td key={c.key} className={`${c.key === "play" || c.key === "stars" ? "px-1" : "px-2.5"} ${c.cellClass ?? ""}`}>
                                            {c.render(song, helpers)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {paddingBottom > 0 && (
                            <tr><td style={{ height: paddingBottom }} colSpan={colCount} /></tr>
                        )}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="py-10 text-center text-sm text-text-muted">
                        No se encontraron canciones
                    </div>
                )}
            </div>

            {/* Column visibility context menu */}
            {ctxMenu && (
                <div
                    ref={ctxRef}
                    className="fixed z-50 max-h-80 overflow-auto rounded-lg border-2 border-border bg-surface p-1.5 shadow-xl"
                    style={{ left: ctxMenu.x, top: ctxMenu.y }}
                >
                    <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                        Columnas visibles
                    </div>
                    {ALL_COLUMNS.map((c) => (
                        <label
                            key={c.key}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-0.5 text-xs text-text-secondary hover:bg-surface-hover"
                        >
                            <input
                                type="checkbox"
                                checked={visibleCols.has(c.key)}
                                onChange={() => toggleColumn(c.key)}
                                className="accent-primary"
                            />
                            {c.label}
                        </label>
                    ))}
                    <div className="mt-1 flex gap-1 border-t border-border pt-1">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm flex-1 text-xs"
                            onClick={() => {
                                const all = new Set<ColumnKey>(ALL_COLUMNS.map((c) => c.key));
                                setVisibleCols(all);
                                persistVisibleColumns(all);
                            }}
                        >
                            Mostrar todas
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm flex-1 text-xs"
                            onClick={() => {
                                const defaults = new Set<ColumnKey>(DEFAULT_VISIBLE);
                                setVisibleCols(defaults);
                                persistVisibleColumns(defaults);
                            }}
                        >
                            Predeterminado
                        </button>
                    </div>
                </div>
            )}

            {/* Color picker popup */}
            {colorPicker && (
                <ColorPickerPopup
                    position={colorPicker.position}
                    currentColor={(() => {
                        const s = songs.find((s) => s.index === colorPicker.songIndex);
                        return s ? getEffectiveColor(s) : null;
                    })()}
                    onSelect={onColorSelect}
                    onClose={() => setColorPicker(null)}
                />
            )}
        </div>
    );
}

/**
 * Camelot wheel + Open Key colour mapping.
 * 12 positions map to a full chromatic rainbow (1=Red → 12=Magenta).
 * A (minor) = darker tint · B (major) = lighter/brighter tint.
 * Root-note reference:
 *  1=Ab/B  2=Eb/F#  3=Bb/Db  4=F/Ab  5=C/Eb  6=G/Bb
 *  7=D/F   8=A/C   9=E/G   10=B/D  11=F#/A  12=Db/E
 */
const KEY_COLORS: Record<string, [string, string]> = {
    // 1 — Red (Abm / B)
    "1A": ["#c0392b", "#fff"], "1m": ["#c0392b", "#fff"],
    "1B": ["#e74c3c", "#fff"], "1d": ["#e74c3c", "#fff"],
    // 2 — Orange-Red (Ebm / F#)
    "2A": ["#c0541a", "#fff"], "2m": ["#c0541a", "#fff"],
    "2B": ["#e8784a", "#fff"], "2d": ["#e8784a", "#fff"],
    // 3 — Orange (Bbm / Db)
    "3A": ["#b06010", "#fff"], "3m": ["#b06010", "#fff"],
    "3B": ["#e8922a", "#222"], "3d": ["#e8922a", "#222"],
    // 4 — Yellow (Fm / Ab)
    "4A": ["#9a8000", "#fff"], "4m": ["#9a8000", "#fff"],
    "4B": ["#f0c010", "#222"], "4d": ["#f0c010", "#222"],
    // 5 — Yellow-Green (Cm / Eb)
    "5A": ["#6a9a00", "#fff"], "5m": ["#6a9a00", "#fff"],
    "5B": ["#96d010", "#222"], "5d": ["#96d010", "#222"],
    // 6 — Green (Gm / Bb)
    "6A": ["#1a8a28", "#fff"], "6m": ["#1a8a28", "#fff"],
    "6B": ["#2ecc71", "#222"], "6d": ["#2ecc71", "#222"],
    // 7 — Teal-Green (Dm / F)
    "7A": ["#0a7860", "#fff"], "7m": ["#0a7860", "#fff"],
    "7B": ["#1abc9c", "#222"], "7d": ["#1abc9c", "#222"],
    // 8 — Cyan (Am / C)
    "8A": ["#0088a8", "#fff"], "8m": ["#0088a8", "#fff"],
    "8B": ["#00bcd4", "#222"], "8d": ["#00bcd4", "#222"],
    // 9 — Blue (Em / G)
    "9A": ["#1055b8", "#fff"], "9m": ["#1055b8", "#fff"],
    "9B": ["#3a8ff0", "#fff"], "9d": ["#3a8ff0", "#fff"],
    // 10 — Blue-Indigo (Bm / D)
    "10A": ["#2838a8", "#fff"], "10m": ["#2838a8", "#fff"],
    "10B": ["#5470e0", "#fff"], "10d": ["#5470e0", "#fff"],
    // 11 — Violet (F#m / A)
    "11A": ["#5a10a0", "#fff"], "11m": ["#5a10a0", "#fff"],
    "11B": ["#9048d0", "#fff"], "11d": ["#9048d0", "#fff"],
    // 12 — Magenta (Dbm / E)
    "12A": ["#980870", "#fff"], "12m": ["#980870", "#fff"],
    "12B": ["#d04898", "#fff"], "12d": ["#d04898", "#fff"],
};

/**
 * Map from standard musical key names (as stored by VDJ) to Camelot codes.
 * Covers sharps (#), flats (b), and common enharmonic equivalents.
 */
const STANDARD_KEY_MAP: Record<string, string> = {
    // ── Minor keys → A side ──
    "Abm": "1A", "G#m": "1A",
    "Ebm": "2A", "D#m": "2A",
    "Bbm": "3A", "A#m": "3A",
    "Fm": "4A",
    "Cm": "5A",
    "Gm": "6A",
    "Dm": "7A",
    "Am": "8A",
    "Em": "9A",
    "Bm": "10A",
    "F#m": "11A", "Gbm": "11A",
    "C#m": "12A", "Dbm": "12A",
    // ── Major keys → B side ──
    "B": "1B", "Cb": "1B",
    "F#": "2B", "Gb": "2B",
    "Db": "3B", "C#": "3B",
    "Ab": "4B", "G#": "4B",
    "Eb": "5B", "D#": "5B",
    "Bb": "6B", "A#": "6B",
    "F": "7B",
    "C": "8B",
    "G": "9B",
    "D": "10B",
    "A": "11B",
    "E": "12B",
};

/** Coloured musical key badge using Camelot wheel / Open Key notation.
 *  Also resolves standard notation (Am, F#, Ebm…) via STANDARD_KEY_MAP.
 */
export function KeyBadge({ keyStr }: { keyStr: string | null | undefined }) {
    if (!keyStr) return <span className="text-text-muted">—</span>;
    // Try direct lookup (Camelot / Open Key), then standard notation
    const camelot = STANDARD_KEY_MAP[keyStr] ?? STANDARD_KEY_MAP[keyStr.charAt(0).toUpperCase() + keyStr.slice(1)];
    const pair =
        KEY_COLORS[keyStr] ??
        KEY_COLORS[keyStr.toUpperCase()] ??
        (camelot ? KEY_COLORS[camelot] : undefined);
    if (!pair) return <span className="badge bg-surface-hover text-text-secondary">{keyStr}</span>;
    return (
        <span
            className="badge font-semibold"
            style={{ backgroundColor: pair[0], color: pair[1], border: "none" }}
        >
            {keyStr}
        </span>
    );
}

/** Compact table for displaying songs inside duplicate groups.
 * Shares the same column definitions and supports column customization via context menu.
 */
export function SongMiniTable({
    songs,
    selectable = false,
    selected,
    onToggle,
    visibleKeys,
}: {
    songs: SongSummary[];
    selectable?: boolean;
    selected?: Set<number>;
    onToggle?: (index: number) => void;
    visibleKeys?: Set<ColumnKey>;
}) {
    const cols = useMemo(() => {
        if (!visibleKeys) {
            // Default compact set for mini tables
            const defaultMini = new Set<ColumnKey>(["file_name", "waveform", "title", "author", "file_size", "bitrate", "bpm", "key", "cue_count", "has_stems"]);
            return ALL_COLUMNS.filter((c) => defaultMini.has(c.key));
        }
        return ALL_COLUMNS.filter((c) => visibleKeys.has(c.key));
    }, [visibleKeys]);

    return (
        <table className="w-full table-fixed text-xs">
            <colgroup>
                {selectable && <col className="w-8" />}
                {cols.map((c) => <col key={c.key} style={{ width: c.width }} />)}
                {/* Location column — always present in mini table */}
                <col style={{ width: 160 }} />
            </colgroup>
            <thead>
                <tr className="text-text-muted">
                    {selectable && <th className="px-2 py-1" />}
                    {cols.map((c) => (
                        <th key={c.key} className="px-2 py-1 text-left">{c.label}</th>
                    ))}
                    <th className="px-2 py-1 text-left">Ubicación</th>
                </tr>
            </thead>
            <tbody>
                {songs.map((s) => {
                    const dir = s.file_path.includes("\\")
                        ? s.file_path.substring(0, s.file_path.lastIndexOf("\\"))
                        : s.file_path.substring(0, s.file_path.lastIndexOf("/"));
                    const rowColor = getEffectiveColor(s);
                    const helpers: RenderHelpers = { rowColor };
                    return (
                        <tr
                            key={s.index}
                            style={rowColor ? { borderLeft: `3px solid ${rowColor}` } : undefined}
                            className={`border-t-2 border-border/40 ${selected?.has(s.index) ? "bg-primary/8" : ""}`}
                        >
                            {selectable && (
                                <td className="px-2 py-0.5">
                                    <input
                                        type="checkbox"
                                        checked={selected?.has(s.index) ?? false}
                                        onChange={() => onToggle?.(s.index)}
                                    />
                                </td>
                            )}
                            {cols.map((c) => (
                                <td key={c.key} className={`px-2 py-0.5 ${c.cellClass ?? ""}`}>
                                    {c.render(s, helpers)}
                                </td>
                            ))}
                            <td className="truncate px-2 py-0.5 text-text-muted" title={dir}>{dir}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
