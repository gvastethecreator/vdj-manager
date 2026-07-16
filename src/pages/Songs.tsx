import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { FolderPlus, Folders, ListMusic, PanelRightClose, RotateCcw, Upload } from "lucide-react";
import { useApp } from "../App";
import { SongTable } from "../components/SongTable";
import { FolderTree } from "../components/FolderTree";
import { SongDetailsCard } from "../components/SongDetailsCard";
import { PaneSeparator } from "../components/PaneSeparator";
import { getConfiguredMusicRoots } from "../lib/api";
import {
  clampPaneLayout,
  DEFAULT_PANE_LAYOUT,
  getPaneLimits,
  loadPaneLayout,
  resizePane,
  savePaneLayout,
  setPaneSize,
  shouldUseDetailDrawer,
  type PaneLayout,
} from "../lib/paneLayout";
import { compareDriveAwarePaths, compareSongsByDrivePath, getPathLeafName, isPathInsideFolder } from "../lib/pathUtils";
import type { PlaylistEntry, PlaylistInfo, SongSummary } from "../types/database";

type SourceMode = "folders" | "playlists";

function externalSong(filePath: string, index: number, comment: string): SongSummary {
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  return {
    index,
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
    comment,
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

/** Unified three-pane Browser: source tree, sovereign table and contextual detail. */
export function Songs() {
  const {
    songs,
    vdjFolder,
    musicFolders,
    selectMusicFolder,
    services,
    navigation,
    setNavigation,
    reportUiError,
  } = useApp();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const initialWidth = Math.max(900, (typeof window === "undefined" ? 1280 : window.innerWidth) - 72);
  const [workspaceWidth, setWorkspaceWidth] = useState(initialWidth);
  const [paneLayout, setPaneLayout] = useState<PaneLayout>(() => loadPaneLayout(localStorage, initialWidth));
  const [selectedFolder, setSelectedFolder] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistInfo | null>(null);
  const [playlistEntries, setPlaylistEntries] = useState<PlaylistEntry[]>([]);
  const [playlistEntriesLoading, setPlaylistEntriesLoading] = useState(false);
  const [externalSongs, setExternalSongs] = useState<SongSummary[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const playlistListRequest = useRef(0);
  const playlistReadRequest = useRef(0);

  const mode: SourceMode = navigation.section === "playlists" ? "playlists" : "folders";
  const compactDetail = shouldUseDetailDrawer(workspaceWidth);
  const paneLimits = getPaneLimits(paneLayout, workspaceWidth);

  useEffect(() => {
    const element = workspaceRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width <= 0) return;
      setWorkspaceWidth(width);
      setPaneLayout((current) => clampPaneLayout(current, width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const updateLayout = useCallback((pane: "tree" | "detail", delta: number) => {
    setPaneLayout((current) => {
      const next = resizePane(current, pane, delta, workspaceWidth);
      savePaneLayout(next);
      return next;
    });
  }, [workspaceWidth]);

  const resetLayout = useCallback(() => {
    const next = clampPaneLayout(DEFAULT_PANE_LAYOUT, workspaceWidth);
    setPaneLayout(next);
    savePaneLayout(next);
  }, [workspaceWidth]);

  const setLayoutPane = useCallback((pane: "tree" | "detail", value: number) => {
    setPaneLayout((current) => {
      const next = setPaneSize(current, pane, value, workspaceWidth);
      savePaneLayout(next);
      return next;
    });
  }, [workspaceWidth]);

  const beginResize = useCallback((pane: "tree" | "detail", event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    let lastX = event.clientX;
    const move = (pointerEvent: PointerEvent) => {
      const delta = pointerEvent.clientX - lastX;
      lastX = pointerEvent.clientX;
      updateLayout(pane, delta);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }, [updateLayout]);

  const treeRoots = useMemo(
    () => getConfiguredMusicRoots(songs, vdjFolder, musicFolders),
    [songs, vdjFolder, musicFolders],
  );

  useEffect(() => {
    if (!vdjFolder) return;
    const request = playlistListRequest.current + 1;
    playlistListRequest.current = request;
    setPlaylistLoading(true);
    services.listPlaylists(vdjFolder)
      .then((nextPlaylists) => {
        if (playlistListRequest.current === request) setPlaylists(nextPlaylists);
      })
      .catch((error) => {
        if (playlistListRequest.current !== request) return;
        setPlaylists([]);
        reportUiError("No se pudieron cargar las playlists.", error);
      })
      .finally(() => {
        if (playlistListRequest.current === request) setPlaylistLoading(false);
      });
    return () => {
      if (playlistListRequest.current === request) playlistListRequest.current += 1;
    };
  }, [reportUiError, services, vdjFolder]);

  const selectPlaylist = useCallback(async (playlist: PlaylistInfo) => {
    const request = playlistReadRequest.current + 1;
    playlistReadRequest.current = request;
    setSelectedPlaylist(playlist);
    setSelectedFolder("");
    setPlaylistEntries([]);
    setPlaylistEntriesLoading(true);
    try {
      const entries = await services.readPlaylist(playlist.path);
      if (playlistReadRequest.current === request) setPlaylistEntries(entries);
    } catch (error) {
      if (playlistReadRequest.current !== request) return;
      setPlaylistEntries([]);
      reportUiError("No se pudo abrir la playlist seleccionada.", error, {
        retry: () => selectPlaylist(playlist),
      });
    } finally {
      if (playlistReadRequest.current === request) setPlaylistEntriesLoading(false);
    }
  }, [reportUiError, services]);

  const clearPlaylistSelection = useCallback(() => {
    playlistReadRequest.current += 1;
    setSelectedPlaylist(null);
    setPlaylistEntries([]);
    setPlaylistEntriesLoading(false);
  }, []);

  const importPlaylist = useCallback(async () => {
    const selected = await services.selectFile({
      title: "Importar playlist",
      extensions: ["m3u", "m3u8", "vdjplaylist", "vdjlist"],
    });
    if (!selected) return;
    const fileName = selected.split(/[/\\]/).pop() ?? selected;
    const dot = fileName.lastIndexOf(".");
    const imported: PlaylistInfo = {
      name: dot > 0 ? fileName.slice(0, dot) : fileName,
      path: selected,
      folder: "Importadas",
      count: 0,
      format: dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "playlist",
    };
    await selectPlaylist(imported);
  }, [selectPlaylist, services]);

  useEffect(() => {
    if (mode !== "folders") {
      setExternalSongs([]);
      return;
    }
    const databasePaths = new Set(songs.map((song) => song.file_path.toLowerCase()));
    const selectableRoots = new Set([...musicFolders, ...treeRoots].map((root) => root.toLowerCase()));
    const targets = selectedFolder
      ? selectableRoots.has(selectedFolder.toLowerCase()) ? [selectedFolder] : []
      : musicFolders;
    if (targets.length === 0) {
      setExternalSongs([]);
      return;
    }

    let cancelled = false;
    setExternalLoading(true);
    void (async () => {
      const discovered = new Map<string, string>();
      for (const folder of targets) {
        try {
          for (const file of await services.scanMusicFolder(folder)) {
            const normalized = file.toLowerCase();
            if (!databasePaths.has(normalized) && !discovered.has(normalized)) discovered.set(normalized, file);
          }
        } catch {
          // One unavailable root must not hide the rest of the library.
        }
      }
      if (!cancelled) {
        setExternalSongs([...discovered.values()].sort(compareDriveAwarePaths).map((path, index) => (
          externalSong(path, -1 - index, "Archivo detectado fuera de database.xml")
        )));
      }
    })().finally(() => { if (!cancelled) setExternalLoading(false); });
    return () => { cancelled = true; };
  }, [mode, musicFolders, selectedFolder, services, songs, treeRoots]);

  const librarySongs = useMemo(
    () => [...songs, ...externalSongs].sort(compareSongsByDrivePath),
    [externalSongs, songs],
  );

  const filteredSongs = useMemo(() => {
    if (mode === "playlists" && selectedPlaylist) {
      const songsByPath = new Map(songs.map((song) => [song.file_path.toLowerCase(), song]));
      return playlistEntries.map((entry, index) => (
        songsByPath.get(entry.file_path.toLowerCase())
        ?? externalSong(entry.file_path, -10_000 - index, "Entrada proveniente de playlist")
      ));
    }
    if (mode === "folders" && selectedFolder) {
      return librarySongs.filter((song) => isPathInsideFolder(song.file_path, selectedFolder));
    }
    return mode === "folders" ? librarySongs : songs;
  }, [librarySongs, mode, playlistEntries, selectedFolder, selectedPlaylist, songs]);

  useEffect(() => {
    setSelectedSongIndex((current) => (
      current !== null && filteredSongs.some((song) => song.index === current)
        ? current
        : (filteredSongs[0]?.index ?? null)
    ));
  }, [filteredSongs]);

  const selectedSong = useMemo(
    () => filteredSongs.find((song) => song.index === selectedSongIndex) ?? null,
    [filteredSongs, selectedSongIndex],
  );

  const playlistFolders = useMemo(() => {
    const groups = new Map<string, PlaylistInfo[]>();
    for (const playlist of playlists) {
      const key = playlist.folder || "Playlists";
      groups.set(key, [...(groups.get(key) ?? []), playlist]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [playlists]);

  const sourceLabel = mode === "playlists"
    ? selectedPlaylist?.name ?? "Todas las canciones"
    : selectedFolder ? getPathLeafName(selectedFolder) : "Toda la biblioteca";

  const selectSong = (song: SongSummary) => {
    setSelectedSongIndex(song.index);
    if (compactDetail) setDetailDrawerOpen(true);
  };

  return (
    <div ref={workspaceRef} className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-semibold text-text">Browser de Biblioteca</h1>
            <p className="text-xs text-text-muted">{sourceLabel} · {filteredSongs.length.toLocaleString()} pistas</p>
          </div>
          <div className="tab-group min-w-64" aria-label="Fuente de biblioteca">
            <button type="button" className={`tab-item flex items-center justify-center gap-2 ${mode === "folders" ? "tab-active" : ""}`} onClick={() => { setNavigation({ workspace: "library", section: "songs" }); clearPlaylistSelection(); }}>
              <Folders className="h-4 w-4" /> Canciones
            </button>
            <button type="button" className={`tab-item flex items-center justify-center gap-2 ${mode === "playlists" ? "tab-active" : ""}`} onClick={() => { setNavigation({ workspace: "library", section: "playlists" }); setSelectedFolder(""); }}>
              <ListMusic className="h-4 w-4" /> Playlists
            </button>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetLayout} title="También disponible con Enter sobre un separador">
          <RotateCcw className="h-4 w-4" /> Restablecer paneles
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex min-h-0 shrink-0 flex-col bg-surface" style={{ width: paneLayout.treeWidth }} aria-label="Fuentes de biblioteca">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{mode === "folders" ? "Carpetas" : "Playlists e historial"}</span>
            <button type="button" className="icon-button h-7 w-7" onClick={() => void (mode === "folders" ? selectMusicFolder() : importPlaylist())} aria-label={mode === "folders" ? "Agregar carpeta" : "Importar playlist"}>
              {mode === "folders" ? <FolderPlus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </button>
          </div>
          {mode === "folders" ? (
            <div className="min-h-0 flex-1 overflow-auto p-2">
              <button type="button" className={`mb-2 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm ${selectedFolder === "" ? "bg-primary/14 text-primary-light" : "text-text-secondary hover:bg-surface-hover"}`} onClick={() => setSelectedFolder("")}>
                Toda la biblioteca <span className="text-xs tabular-nums text-text-muted">{librarySongs.length}</span>
              </button>
              <FolderTree roots={treeRoots} onSelect={setSelectedFolder} selectedPath={selectedFolder} maxHeightClass="max-h-none" />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto py-2">
              {playlistLoading ? <div className="p-3 text-sm text-text-muted">Cargando playlists…</div> : null}
              {!playlistLoading && playlists.length === 0 ? <div className="m-2 rounded-md border border-dashed border-border p-4 text-center text-sm text-text-muted">No hay playlists en esta biblioteca.</div> : null}
              <button type="button" className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${!selectedPlaylist ? "bg-primary/14 text-primary-light" : "text-text-secondary hover:bg-surface-hover"}`} onClick={clearPlaylistSelection}>
                Todas las canciones <span className="text-xs tabular-nums text-text-muted">{songs.length}</span>
              </button>
              {playlistFolders.map(([folder, entries]) => (
                <section key={folder}>
                  <h2 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{folder}</h2>
                  {entries.sort((a, b) => a.name.localeCompare(b.name)).map((playlist) => (
                    <button key={playlist.path} type="button" className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${selectedPlaylist?.path === playlist.path ? "bg-primary/14 text-primary-light" : "text-text-secondary hover:bg-surface-hover"}`} onClick={() => void selectPlaylist(playlist)}>
                      <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
                      <span className="text-xs tabular-nums text-text-muted">{playlist.count}</span>
                    </button>
                  ))}
                </section>
              ))}
            </div>
          )}
        </aside>

        <PaneSeparator label="Ajustar ancho del árbol" value={paneLayout.treeWidth} min={paneLimits.tree.min} max={paneLimits.tree.max} onMove={(delta) => updateLayout("tree", delta)} onSet={(value) => setLayoutPane("tree", value)} onReset={resetLayout} onPointerDown={(event) => beginResize("tree", event)} />

        <section className="min-h-0 min-w-0 flex-1 overflow-auto p-3" aria-label="Tabla de canciones">
          {externalLoading ? <div className="mb-2 text-xs text-text-muted">Escaneando archivos externos…</div> : null}
          {playlistEntriesLoading ? <div className="mb-2 text-[13px] text-text-muted">Cargando contenido de la playlist…</div> : null}
          <SongTable songs={filteredSongs} storageKey="library" activeSongIndex={selectedSongIndex} onRowSelect={selectSong} />
        </section>

        {!compactDetail ? (
          <>
            <PaneSeparator label="Ajustar ancho del detalle" value={paneLayout.detailWidth} min={paneLimits.detail.min} max={paneLimits.detail.max} onMove={(delta) => updateLayout("detail", delta)} onSet={(value) => setLayoutPane("detail", value)} onReset={resetLayout} onPointerDown={(event) => beginResize("detail", event)} />
            <aside className="min-h-0 shrink-0 overflow-auto bg-surface p-3" style={{ width: paneLayout.detailWidth }} aria-label="Detalle de pista">
              {selectedSong ? <SongDetailsCard song={selectedSong} /> : <div className="rounded-md border border-dashed border-border p-5 text-center text-sm text-text-muted">Selecciona una pista para ver sus detalles.</div>}
            </aside>
          </>
        ) : null}

        {compactDetail && detailDrawerOpen && selectedSong ? (
          <>
            <button type="button" className="absolute inset-0 z-20 bg-black/45" aria-label="Cerrar detalle" onClick={() => setDetailDrawerOpen(false)} />
            <aside className="absolute inset-y-0 right-0 z-30 overflow-auto border-l border-border-strong bg-surface p-3 shadow-2xl" style={{ width: "min(420px, 90%)" }} aria-label="Detalle de pista">
              <div className="mb-2 flex justify-end"><button type="button" className="icon-button" onClick={() => setDetailDrawerOpen(false)} aria-label="Cerrar detalle de pista"><PanelRightClose className="h-4 w-4" /></button></div>
              <SongDetailsCard song={selectedSong} />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
