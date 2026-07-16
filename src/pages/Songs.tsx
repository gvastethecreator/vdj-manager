import { useState, useCallback, useMemo, useEffect } from "react";
import { useApp } from "../App";
import { SongTable } from "../components/SongTable";
import { FolderTree } from "../components/FolderTree";
import { SongDetailsCard } from "../components/SongDetailsCard";
import { getConfiguredMusicRoots } from "../lib/api";
import { compareDriveAwarePaths, compareSongsByDrivePath, getPathLeafName, isPathInsideFolder } from "../lib/pathUtils";
import type { PlaylistInfo, PlaylistEntry, SongSummary } from "../types/database";

type SidebarMode = "folders" | "playlists";

/** Full song library view with a folder-tree sidebar for directory filtering. */
export function Songs() {
    const { songs, vdjFolder, musicFolders, selectMusicFolder, services } = useApp();

    // ── Sidebar mode ──
    const [mode, setMode] = useState<SidebarMode>("folders");

    // ── Folder tree ──
    const treeRoots = useMemo(
        () => getConfiguredMusicRoots(songs, vdjFolder, musicFolders),
        [songs, vdjFolder, musicFolders],
    );
    const [selectedFolder, setSelectedFolder] = useState<string>("");

    // ── Playlists ──
    const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistInfo | null>(null);
    const [playlistEntries, setPlaylistEntries] = useState<PlaylistEntry[]>([]);
    const [externalSongs, setExternalSongs] = useState<SongSummary[]>([]);
    const [externalLoading, setExternalLoading] = useState(false);
    const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!vdjFolder) return;
        setPlaylistLoading(true);
        services.listPlaylists(vdjFolder)
            .then(setPlaylists)
            .catch(() => setPlaylists([]))
            .finally(() => setPlaylistLoading(false));
    }, [services, vdjFolder]);

    const selectPlaylist = useCallback(async (pl: PlaylistInfo) => {
        setSelectedPlaylist(pl);
        setSelectedFolder("");
        try {
            const entries = await services.readPlaylist(pl.path);
            setPlaylistEntries(entries);
        } catch {
            setPlaylistEntries([]);
        }
    }, [services]);

    const importPlaylist = useCallback(async () => {
        const selected = await services.selectFile({
            title: "Importar playlist",
            extensions: ["m3u", "m3u8", "vdjplaylist", "vdjlist"],
        });

        if (!selected) return;

        const fileName = selected.split(/[/\\]/).pop() ?? selected;
        const dot = fileName.lastIndexOf(".");
        const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "playlist";

        const imported: PlaylistInfo = {
            name: dot > 0 ? fileName.slice(0, dot) : fileName,
            path: selected,
            folder: "Importadas",
            count: 0,
            format: ext,
        };

        await selectPlaylist(imported);
    }, [selectPlaylist, services]);

    useEffect(() => {
        if (mode !== "folders") {
            setExternalSongs([]);
            return;
        }

        const databasePathSet = new Set(songs.map((song) => song.file_path.toLowerCase()));
        const selectableScanRoots = new Set([...musicFolders, ...treeRoots].map((root) => root.toLowerCase()));
        const targets = selectedFolder
            ? selectableScanRoots.has(selectedFolder.toLowerCase()) ? [selectedFolder] : []
            : musicFolders;

        if (targets.length === 0) {
            setExternalSongs([]);
            return;
        }

        let cancelled = false;
        setExternalLoading(true);

        (async () => {
            const discovered = new Map<string, string>();

            for (const folder of targets) {
                try {
                    const files = await services.scanMusicFolder(folder);
                    for (const file of files) {
                        const normalized = file.toLowerCase();
                        if (databasePathSet.has(normalized)) continue;
                        if (!discovered.has(normalized)) {
                            discovered.set(normalized, file);
                        }
                    }
                } catch {
                    // ignore per-folder errors to keep UX robust
                }
            }

            const mapped: SongSummary[] = [...discovered.values()].sort(compareDriveAwarePaths).map((filePath, idx) => {
                const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
                return {
                    index: -1 - idx,
                    in_database: false,
                    file_path: filePath,
                    file_name: fileName,
                    file_size: null,
                    title: null,
                    author: null,
                    album: null,
                    genre: null,
                    year: null,
                    bpm: null,
                    key: null,
                    duration_secs: null,
                    bitrate: null,
                    play_count: null,
                    stars: null,
                    cue_count: 0,
                    cue_markers: [],
                    remix: null,
                    remixer: null,
                    composer: null,
                    label: null,
                    track_number: null,
                    grouping: null,
                    comment: "Archivo detectado fuera de database.xml",
                    user1: null,
                    user2: null,
                    color: null,
                    user_color: null,
                    gain: null,
                    first_seen: null,
                    first_play: null,
                    last_play: null,
                    has_stems: false,
                };
            });

            if (!cancelled) {
                setExternalSongs(mapped);
            }
        })().finally(() => {
            if (!cancelled) {
                setExternalLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [mode, selectedFolder, songs, musicFolders, services, treeRoots]);

    const librarySongs = useMemo(() => {
        if (mode !== "folders") return songs;
        return [...songs, ...externalSongs].sort(compareSongsByDrivePath);
    }, [mode, songs, externalSongs]);

    // ── Filtered songs ──
    const filteredSongs = useMemo(() => {
        if (mode === "playlists" && selectedPlaylist) {
            const pathSet = new Set(playlistEntries.map((e) => e.file_path.toLowerCase()));
            return songs.filter((s) => pathSet.has(s.file_path.toLowerCase())).sort(compareSongsByDrivePath);
        }
        if (selectedFolder) {
            return librarySongs.filter((song) => isPathInsideFolder(song.file_path, selectedFolder));
        }
        return librarySongs;
    }, [songs, librarySongs, mode, selectedFolder, selectedPlaylist, playlistEntries]);

    useEffect(() => {
        if (filteredSongs.length === 0) {
            setSelectedSongIndex(null);
            return;
        }

        setSelectedSongIndex((prev) => {
            if (prev != null && filteredSongs.some((song) => song.index === prev)) {
                return prev;
            }
            return filteredSongs[0]?.index ?? null;
        });
    }, [filteredSongs]);

    const selectedSong = useMemo(
        () => filteredSongs.find((song) => song.index === selectedSongIndex) ?? null,
        [filteredSongs, selectedSongIndex],
    );

    const addRoot = useCallback(async () => {
        await selectMusicFolder();
    }, [selectMusicFolder]);

    // Playlist folders for grouping
    const playlistFolders = useMemo(() => {
        const folders = new Map<string, PlaylistInfo[]>();
        for (const pl of playlists) {
            const key = pl.folder || "";
            const existing = folders.get(key);
            if (existing) existing.push(pl);
            else folders.set(key, [pl]);
        }
        return folders;
    }, [playlists]);

    const subtitle = mode === "playlists" && selectedPlaylist
        ? selectedPlaylist.name
        : selectedFolder
            ? getPathLeafName(selectedFolder)
            : "";

    return (
        <div className="flex h-full gap-0">
            {/* ── Left sidebar ── */}
            <div className="flex w-60 shrink-0 flex-col border-r border-border bg-surface/85">
                {/* Mode tabs */}
                <div className="flex border-b border-border p-1">
                    <button
                        type="button"
                        onClick={() => { setMode("folders"); setSelectedPlaylist(null); }}
                        className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === "folders" ? "bg-primary/14 text-primary-light" : "text-text-muted hover:bg-surface-hover hover:text-text"}`}
                    >
                        Carpetas
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("playlists"); setSelectedFolder(""); }}
                        className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === "playlists" ? "bg-primary/14 text-primary-light" : "text-text-muted hover:bg-surface-hover hover:text-text"}`}
                    >
                        Playlists
                    </button>
                </div>

                {mode === "folders" && (
                    <>
                        <div className="flex items-center justify-between border-b border-border px-3 py-2">
                            <span className="text-xs font-semibold text-text-muted">Carpetas</span>
                            <button
                                type="button"
                                onClick={addRoot}
                                className="text-xs text-primary-light hover:underline"
                            >
                                + Agregar
                            </button>
                        </div>

                        {/* "All songs" entry */}
                        <button
                            type="button"
                            onClick={() => setSelectedFolder("")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] transition-colors ${selectedFolder === ""
                                ? "bg-primary/12 text-primary-light font-medium"
                                : "text-text-secondary hover:bg-surface-hover"
                                }`}
                        >
                            <span>Todas las canciones</span>
                            <span className="ml-auto text-xs tabular-nums text-text-muted">
                                {librarySongs.length}
                            </span>
                        </button>

                        <div className="flex-1 overflow-auto p-2">
                            <FolderTree
                                roots={treeRoots}
                                onSelect={setSelectedFolder}
                                selectedPath={selectedFolder}
                                maxHeightClass="max-h-full"
                            />
                        </div>
                    </>
                )}

                {mode === "playlists" && (
                    <div className="flex-1 overflow-auto">
                        {playlistLoading && (
                            <div className="flex items-center gap-2 p-3 text-xs text-text-muted">
                                <div className="spinner" /> Cargando playlists...
                            </div>
                        )}
                        {!playlistLoading && playlists.length === 0 && (
                            <div className="p-3 text-xs text-text-muted">
                                No se encontraron playlists en la carpeta VDJ.
                            </div>
                        )}
                        {/* "All songs" entry */}
                        <button
                            type="button"
                            onClick={() => setSelectedPlaylist(null)}
                            className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-[12px] transition-colors ${!selectedPlaylist
                                ? "bg-primary/12 text-primary-light font-medium"
                                : "text-text-secondary hover:bg-surface-hover"
                                }`}
                        >
                            <span>Todas las canciones</span>
                            <span className="ml-auto text-xs tabular-nums text-text-muted">
                                {songs.length}
                            </span>
                        </button>
                        {[...playlistFolders.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([folder, pls]) => (
                            <div key={folder}>
                                {folder && (
                                    <div className="px-3 pt-2 pb-0.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                                        {folder}
                                    </div>
                                )}
                                {[...pls].sort((a, b) => a.name.localeCompare(b.name)).map((pl) => (
                                    <button
                                        key={pl.path}
                                        type="button"
                                        onClick={() => selectPlaylist(pl)}
                                        className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-[12px] transition-colors ${selectedPlaylist?.path === pl.path
                                            ? "bg-primary/12 text-primary-light font-medium"
                                            : "text-text-secondary hover:bg-surface-hover"
                                            }`}
                                    >
                                        <span className="truncate">{pl.name}</span>
                                        <span className="rounded bg-surface-hover px-1 py-0 text-xs uppercase tracking-wide text-text-muted">
                                            {pl.format}
                                        </span>
                                        <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">
                                            {pl.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ))}
                        <div className="border-t border-border/50 px-3 py-2">
                            <button
                                type="button"
                                onClick={importPlaylist}
                                className="w-full rounded border border-border/70 px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover"
                            >
                                Importar playlist externa…
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right: song table ── */}
            <div className="min-w-0 flex-1 overflow-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text">
                        Canciones
                        <span className="ml-2 text-base font-normal text-text-muted">
                            ({filteredSongs.length.toLocaleString()}
                            {subtitle ? ` en ${subtitle}` : ""})
                        </span>
                    </h2>
                    {mode === "folders" && externalLoading && (
                        <span className="text-xs text-text-muted">Escaneando archivos externos…</span>
                    )}
                </div>
                {selectedSong && (
                    <div className="mb-4">
                        <SongDetailsCard song={selectedSong} />
                    </div>
                )}
                <SongTable
                    songs={filteredSongs}
                    storageKey="songs"
                    activeSongIndex={selectedSongIndex}
                    onRowSelect={(song) => setSelectedSongIndex(song.index)}
                />
            </div>
        </div>
    );
}
