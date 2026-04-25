import { useEffect, useMemo, useState } from "react";
import { listPlaylists, readPlaylist } from "../lib/api";
import { useApp } from "../App";
import type { PlaylistEntry, PlaylistInfo, SongSummary } from "../types/database";
import { TreeFileNavigator, type TreeFileItem } from "../components/TreeFileNavigator";
import { SongTable } from "../components/SongTable";
import { SongDetailsCard } from "../components/SongDetailsCard";

function createExternalSong(filePath: string, index: number): SongSummary {
    const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
    return {
        index: -10_000 - index,
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
        comment: "Entrada proveniente de playlist",
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
}

/** Dedicated tree view for VirtualDJ playlists and history folders. */
export function Playlists() {
    const { vdjFolder, songs, setError } = useApp();
    const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
    const [selectedPlaylistPath, setSelectedPlaylistPath] = useState<string | null>(null);
    const [entries, setEntries] = useState<PlaylistEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!vdjFolder) {
            setPlaylists([]);
            setSelectedPlaylistPath(null);
            return;
        }

        setLoading(true);
        listPlaylists(vdjFolder)
            .then((result) => {
                setPlaylists(result);
                setSelectedPlaylistPath((prev) => prev && result.some((item) => item.path === prev) ? prev : (result[0]?.path ?? null));
            })
            .catch((err) => setError(String(err)))
            .finally(() => setLoading(false));
    }, [setError, vdjFolder]);

    useEffect(() => {
        if (!selectedPlaylistPath) {
            setEntries([]);
            return;
        }
        readPlaylist(selectedPlaylistPath)
            .then(setEntries)
            .catch((err) => setError(String(err)));
    }, [selectedPlaylistPath, setError]);

    const treeItems = useMemo<TreeFileItem[]>(() => playlists.map((playlist) => ({
        id: playlist.path,
        path: playlist.path,
        relativePath: playlist.folder ? `${playlist.folder}/${playlist.name}.${playlist.format}` : `${playlist.name}.${playlist.format}`,
        label: playlist.name,
        meta: `${playlist.count}`,
    })), [playlists]);

    const selectedPlaylist = useMemo(
        () => playlists.find((playlist) => playlist.path === selectedPlaylistPath) ?? null,
        [playlists, selectedPlaylistPath],
    );

    const playlistSongs = useMemo(() => {
        const songsByPath = new Map(songs.map((song) => [song.file_path.toLowerCase(), song]));
        return entries.map((entry, index) => songsByPath.get(entry.file_path.toLowerCase()) ?? createExternalSong(entry.file_path, index));
    }, [entries, songs]);

    useEffect(() => {
        setSelectedSongIndex((prev) => prev != null && playlistSongs.some((song) => song.index === prev)
            ? prev
            : (playlistSongs[0]?.index ?? null));
    }, [playlistSongs]);

    const selectedSong = useMemo(
        () => playlistSongs.find((song) => song.index === selectedSongIndex) ?? null,
        [playlistSongs, selectedSongIndex],
    );

    const unmatchedCount = useMemo(
        () => playlistSongs.filter((song) => !song.in_database).length,
        [playlistSongs],
    );

    return (
        <div className="flex h-full gap-0">
            <aside className="flex w-80 shrink-0 flex-col border-r-2 border-border bg-surface">
                <div className="border-b-2 border-border px-3 py-2">
                    <h2 className="text-sm font-semibold text-text">Playlists</h2>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                        Árbol estructurado de listas VirtualDJ, incluyendo historial y subcarpetas.
                    </p>
                </div>
                <div className="flex-1 overflow-auto p-1.5">
                    {loading ? (
                        <div className="p-2 text-[11px] text-text-muted">Cargando playlists...</div>
                    ) : (
                        <TreeFileNavigator
                            items={treeItems}
                            selectedId={selectedPlaylistPath}
                            onSelect={(item) => setSelectedPlaylistPath(item.path)}
                            emptyLabel="No se encontraron playlists en la carpeta VirtualDJ."
                        />
                    )}
                </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-auto p-3">
                {!selectedPlaylist ? (
                    <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                        Selecciona una playlist del árbol.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="card p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-text">{selectedPlaylist.name}</h3>
                                    <p className="mt-1 text-sm text-text-muted">{selectedPlaylist.folder || "Raíz de Playlists"}</p>
                                    <p className="mt-1 text-[11px] text-text-muted font-mono">{selectedPlaylist.path}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="rounded bg-background px-2 py-1 text-[11px] text-text-secondary">{selectedPlaylist.format}</span>
                                    <span className="rounded bg-background px-2 py-1 text-[11px] text-text-secondary">{selectedPlaylist.count} entrada(s)</span>
                                    {unmatchedCount > 0 ? <span className="rounded bg-warning/15 px-2 py-1 text-[11px] text-warning">{unmatchedCount} fuera de DB</span> : null}
                                </div>
                            </div>
                        </div>

                        {selectedSong ? <SongDetailsCard song={selectedSong} /> : null}

                        <SongTable
                            songs={playlistSongs}
                            storageKey="playlists"
                            activeSongIndex={selectedSongIndex}
                            onRowSelect={(song) => setSelectedSongIndex(song.index)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
