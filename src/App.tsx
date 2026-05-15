import { useState, createContext, useContext, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
    loadDatabase,
    getDatabaseStats,
    mergeFolderLists,
} from "./lib/api";
import { log } from "./lib/logger";
import type { SongSummary, DatabaseStats, Page } from "./types/database";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { getDemoAppState, getDemoInitialPage, isDemoMode } from "./lib/demoData";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Songs } from "./pages/Songs";
import { Duplicates } from "./pages/Duplicates";
import { MissingFiles } from "./pages/MissingFiles";
import { RelinkTracks } from "./pages/RelinkTracks";
import { OrphanFiles } from "./pages/OrphanFiles";
import { BatchOperations } from "./pages/BatchOperations";
import { Configs } from "./pages/Configs";
import { Playlists } from "./pages/Playlists";
import { Pads } from "./pages/Pads";
import { Mappers } from "./pages/Mappers";

export type Theme = "dark" | "light" | "blue" | "teal" | "green" | "amber" | "red";

const MUSIC_FOLDERS_STORAGE_KEY = "vdj-music-folders";
const LAST_VDJ_FOLDER_STORAGE_KEY = "vdj-last-folder";

/** Internal application state managed by the root App component. */
interface AppState {
    vdjFolder: string | null;
    songs: SongSummary[];
    stats: DatabaseStats | null;
    loading: boolean;
    error: string | null;
    page: Page;
}

/** Context value exposed to child components via {@link useApp}. */
interface AppContextType extends AppState {
    setPage: (page: Page) => void;
    selectFolder: () => Promise<void>;
    loadFromFolder: (folder: string, options?: { targetPage?: Page }) => Promise<void>;
    reload: () => Promise<void>;
    patchSong: (songIndex: number, patch: Partial<SongSummary>) => void;
    setError: (error: string | null) => void;
    musicFolders: string[];
    addMusicFolder: (folder: string) => void;
    removeMusicFolder: (folder: string) => void;
    selectMusicFolder: () => Promise<string | null>;
    lastVdjFolder: string | null;
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const AppContext = createContext<AppContextType | null>(null);

/**
 * Access the global application context.
 * Must be called from a component inside the `<App>` tree.
 * @throws If called outside the AppContext provider.
 */
export function useApp(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}

/** Root application component: provides global state and page routing. */
export default function App() {
    const demoMode = isDemoMode();
    const demoState = demoMode ? getDemoAppState() : null;
    const [state, setState] = useState<AppState>({
        vdjFolder: demoState?.vdjFolder ?? null,
        songs: demoState?.songs ?? [],
        stats: demoState?.stats ?? null,
        loading: false,
        error: null,
        page: demoMode ? getDemoInitialPage() : "home",
    });

    const VALID_THEMES: Theme[] = ["dark", "light", "blue", "teal", "green", "amber", "red"];
    const [musicFolders, setMusicFolders] = useState<string[]>(() => {
        if (demoState) return demoState.musicFolders;
        try {
            const raw = localStorage.getItem(MUSIC_FOLDERS_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw) as string[];
            return Array.isArray(parsed) ? mergeFolderLists(parsed) : [];
        } catch {
            return [];
        }
    });
    const [lastVdjFolder, setLastVdjFolder] = useState<string | null>(() => {
        if (demoState) return demoState.vdjFolder;
        try {
            return localStorage.getItem(LAST_VDJ_FOLDER_STORAGE_KEY);
        } catch {
            return null;
        }
    });
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem("vdj-theme") as Theme;
            return VALID_THEMES.includes(saved) ? saved : "dark";
        } catch {
            return "dark";
        }
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("vdj-theme", theme); } catch { /* noop */ }
    }, [theme]);

    useEffect(() => {
        try {
            localStorage.setItem(MUSIC_FOLDERS_STORAGE_KEY, JSON.stringify(musicFolders));
        } catch {
            /* noop */
        }
    }, [musicFolders]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }, []);

    const setPage = useCallback((page: Page) => {
        setState((prev) => ({ ...prev, page }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState((prev) => ({ ...prev, error }));
    }, []);

    const addMusicFolder = useCallback((folder: string) => {
        setMusicFolders((prev) => mergeFolderLists(prev, [folder]));
    }, []);

    const removeMusicFolder = useCallback((folder: string) => {
        setMusicFolders((prev) => prev.filter((entry) => entry.toLowerCase() !== folder.toLowerCase()));
    }, []);

    const selectMusicFolder = useCallback(async () => {
        const selected = await open({
            directory: true,
            title: "Seleccionar carpeta de música",
        });
        if (!selected) return null;

        addMusicFolder(selected);
        return selected;
    }, [addMusicFolder]);

    const loadFromFolder = useCallback(async (folder: string, options?: { targetPage?: Page }) => {
        log.info(`Loading database from ${folder}`);
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const [songs, stats] = await Promise.all([
                loadDatabase(folder),
                getDatabaseStats(folder),
            ]);
            log.info(`Loaded ${songs.length} songs`);
            setState((prev) => ({
                ...prev,
                vdjFolder: folder,
                songs,
                stats,
                loading: false,
                page: options?.targetPage ?? "dashboard",
            }));
            setLastVdjFolder(folder);
            try {
                localStorage.setItem(LAST_VDJ_FOLDER_STORAGE_KEY, folder);
            } catch {
                /* noop */
            }
        } catch (err) {
            log.error("Failed to load database", err);
            setState((prev) => ({
                ...prev,
                loading: false,
                error: String(err),
            }));
        }
    }, []);

    const selectFolder = useCallback(async () => {
        const selected = await open({
            directory: true,
            title: "Seleccionar carpeta de VirtualDJ",
            defaultPath: "D:\\Documents\\VirtualDJ",
        });
        if (selected) {
            await loadFromFolder(selected);
        }
    }, [loadFromFolder]);

    const reload = useCallback(async () => {
        if (state.vdjFolder) {
            await loadFromFolder(state.vdjFolder, { targetPage: state.page });
        }
    }, [state.page, state.vdjFolder, loadFromFolder]);

    const patchSong = useCallback((songIndex: number, patch: Partial<SongSummary>) => {
        setState((prev) => ({
            ...prev,
            songs: prev.songs.map((song) => (
                song.index === songIndex
                    ? { ...song, ...patch }
                    : song
            )),
        }));
    }, []);

    const ctx: AppContextType = {
        ...state,
        setPage,
        selectFolder,
        loadFromFolder,
        reload,
        patchSong,
        setError,
        musicFolders,
        addMusicFolder,
        removeMusicFolder,
        selectMusicFolder,
        lastVdjFolder,
        theme,
        toggleTheme,
        setTheme,
    };

    function renderPage(): ReactNode {
        switch (state.page) {
            case "home":
                return <Home />;
            case "dashboard":
                return <Dashboard />;
            case "songs":
                return <Songs />;
            case "playlists":
                return <Playlists />;
            case "duplicates":
                return <Duplicates />;
            case "missing":
                return <MissingFiles />;
            case "relink":
                return <RelinkTracks />;
            case "orphans":
                return <OrphanFiles />;
            case "batch":
                return <BatchOperations />;
            case "configs":
                return <Configs />;
            case "pads":
                return <Pads />;
            case "mappers":
                return <Mappers />;
        }
    }

    return (
        <AppContext.Provider value={ctx}>
            {state.page === "home" ? (
                <div key="home" className="page-enter">
                    <ErrorBoundary>{renderPage()}</ErrorBoundary>
                </div>
            ) : (
                <Layout>
                    <div key={state.page} className="page-enter">
                        <ErrorBoundary>{renderPage()}</ErrorBoundary>
                    </div>
                </Layout>
            )}
        </AppContext.Provider>
    );
}
