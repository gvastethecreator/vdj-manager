import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { mergeFolderLists } from "./lib/api";
import { log } from "./lib/logger";
import type {
  ApplyRecoveryResult,
  DatabaseStats,
  MutationRecoveryAction,
  MutationRecoveryState,
  SongSummary,
} from "./types/database";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { getDemoAppState, isDemoMode } from "./lib/demoData";
import {
  initialNavigation,
  legacyPageFromNavigation,
  navigationScope,
  normalizeNavigation,
  type NavigationState,
} from "./lib/navigation";
import { createRuntimeServices, type RuntimeServices } from "./lib/runtimeServices";
import { createUiError, errorForScope, type UiError } from "./lib/uiError";
import { persistTheme, readStoredTheme, type Theme } from "./lib/theme";
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
import { isMutationBlocked } from "./lib/recovery";

export type { Theme } from "./lib/theme";

const MUSIC_FOLDERS_STORAGE_KEY = "vdj-music-folders";
const LAST_VDJ_FOLDER_STORAGE_KEY = "vdj-last-folder";

interface AppState {
  vdjFolder: string | null;
  songs: SongSummary[];
  stats: DatabaseStats | null;
  loading: boolean;
  navigation: NavigationState;
}

interface AppContextType extends AppState {
  setNavigation: (navigation: NavigationState) => void;
  currentScope: string;
  services: RuntimeServices;
  selectFolder: () => Promise<void>;
  loadFromFolder: (folder: string, options?: { targetNavigation?: NavigationState }) => Promise<void>;
  reload: () => Promise<void>;
  patchSong: (songIndex: number, patch: Partial<SongSummary>) => void;
  uiError: UiError | null;
  setUiError: (error: UiError | null) => void;
  reportUiError: (summary: string, error?: unknown, scope?: string) => void;
  clearUiError: () => void;
  musicFolders: string[];
  addMusicFolder: (folder: string) => void;
  removeMusicFolder: (folder: string) => void;
  selectMusicFolder: () => Promise<string | null>;
  lastVdjFolder: string | null;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  recoveryState: MutationRecoveryState | null;
  recoveryError: UiError | null;
  recoveryLoading: boolean;
  recoveryOutcomes: ApplyRecoveryResult["outcomes"];
  mutationsBlocked: boolean;
  refreshRecovery: () => Promise<void>;
  resolveRecovery: (action: MutationRecoveryAction, journalId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

/** Root state and service boundary. Demo and Tauri share the same view contracts. */
export default function App() {
  const demoMode = isDemoMode();
  const demoState = demoMode ? getDemoAppState() : null;
  const services = useMemo(() => createRuntimeServices(demoMode), [demoMode]);
  const [state, setState] = useState<AppState>({
    vdjFolder: demoState?.vdjFolder ?? null,
    songs: demoState?.songs ?? [],
    stats: demoState?.stats ?? null,
    loading: false,
    navigation: initialNavigation(window.location.search, demoMode),
  });
  const [uiError, setUiError] = useState<UiError | null>(null);
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
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());
  const [recoveryState, setRecoveryState] = useState<MutationRecoveryState | null>(null);
  const [recoveryError, setRecoveryError] = useState<UiError | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryOutcomes, setRecoveryOutcomes] = useState<ApplyRecoveryResult["outcomes"]>([]);

  const currentScope = navigationScope(state.navigation);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(MUSIC_FOLDERS_STORAGE_KEY, JSON.stringify(musicFolders));
    } catch {
      // Persistence is optional; the current session remains usable.
    }
  }, [musicFolders]);

  useEffect(() => {
    setUiError((error) => errorForScope(error, currentScope));
  }, [currentScope]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }, []);

  const setNavigation = useCallback((navigation: NavigationState) => {
    const normalized = normalizeNavigation(navigation);
    setState((previous) => ({ ...previous, navigation: normalized }));
    if (demoMode) {
      const url = new URL(window.location.href);
      url.searchParams.set("page", legacyPageFromNavigation(normalized));
      window.history.replaceState(null, "", url);
    }
  }, [demoMode]);

  const clearUiError = useCallback(() => setUiError(null), []);

  const reportUiError = useCallback((summary: string, error?: unknown, scope = currentScope) => {
    setUiError(createUiError(scope, summary, error));
  }, [currentScope]);

  const addMusicFolder = useCallback((folder: string) => {
    setMusicFolders((previous) => mergeFolderLists(previous, [folder]));
  }, []);

  const removeMusicFolder = useCallback((folder: string) => {
    setMusicFolders((previous) => previous.filter((entry) => entry.toLowerCase() !== folder.toLowerCase()));
  }, []);

  const selectMusicFolder = useCallback(async () => {
    const selected = await services.selectDirectory({
      purpose: "music",
      title: "Seleccionar carpeta de música",
    });
    if (!selected) return null;
    addMusicFolder(selected);
    return selected;
  }, [addMusicFolder, services]);

  const loadFromFolder = useCallback(async (
    folder: string,
    options?: { targetNavigation?: NavigationState },
  ) => {
    log.info(`Loading database from ${folder}`);
    setState((previous) => ({ ...previous, loading: true }));
    setUiError(null);
    try {
      const recoveryRequest = services.getMutationRecoveryState(folder)
        .then((next) => ({ state: next, error: null as UiError | null }))
        .catch((error: unknown) => ({
          state: null,
          error: createUiError("recovery", "No se pudo comprobar el estado de recuperación.", error),
        }));
      const [songs, stats, recovery] = await Promise.all([
        services.loadDatabase(folder),
        services.getDatabaseStats(folder),
        recoveryRequest,
      ]);
      setRecoveryState(recovery.state);
      setRecoveryError(recovery.error);
      setRecoveryOutcomes([]);
      log.info(`Loaded ${songs.length} songs`);
      setState((previous) => ({
        ...previous,
        vdjFolder: folder,
        songs,
        stats,
        loading: false,
        navigation: options?.targetNavigation ?? { workspace: "dashboard" },
      }));
      setLastVdjFolder(folder);
      try {
        localStorage.setItem(LAST_VDJ_FOLDER_STORAGE_KEY, folder);
      } catch {
        // The loaded session remains valid without persistence.
      }
    } catch (error) {
      log.error("Failed to load database", error);
      setState((previous) => ({ ...previous, loading: false }));
      setUiError(createUiError(currentScope, "No se pudo abrir esta Biblioteca VirtualDJ.", error));
    }
  }, [currentScope, services]);

  const refreshRecovery = useCallback(async () => {
    if (!state.vdjFolder) return;
    setRecoveryLoading(true);
    try {
      const next = await services.getMutationRecoveryState(state.vdjFolder);
      setRecoveryState(next);
      setRecoveryError(null);
    } catch (error) {
      setRecoveryError(createUiError("recovery", "No se pudo actualizar el estado de recuperación.", error));
    } finally {
      setRecoveryLoading(false);
    }
  }, [services, state.vdjFolder]);

  const resolveRecovery = useCallback(async (action: MutationRecoveryAction, journalId: string) => {
    if (!state.vdjFolder) return;
    setRecoveryLoading(true);
    setRecoveryError(null);
    try {
      const result = await services.applyMutationRecoveryAction(state.vdjFolder, action, journalId);
      setRecoveryState(result.state);
      setRecoveryOutcomes(result.outcomes);
      if (result.state.status === "clean") {
        await loadFromFolder(state.vdjFolder, { targetNavigation: state.navigation });
      }
    } catch (error) {
      setRecoveryError(createUiError("recovery", "No se pudo completar la recuperación.", error));
    } finally {
      setRecoveryLoading(false);
    }
  }, [loadFromFolder, services, state.navigation, state.vdjFolder]);

  const selectFolder = useCallback(async () => {
    const selected = await services.selectDirectory({
      purpose: "virtualdj",
      title: "Seleccionar carpeta de VirtualDJ",
      defaultPath: "D:\\Documents\\VirtualDJ",
    });
    if (selected) await loadFromFolder(selected);
  }, [loadFromFolder, services]);

  const reload = useCallback(async () => {
    if (state.vdjFolder) {
      await loadFromFolder(state.vdjFolder, { targetNavigation: state.navigation });
    }
  }, [loadFromFolder, state.navigation, state.vdjFolder]);

  const patchSong = useCallback((songIndex: number, patch: Partial<SongSummary>) => {
    setState((previous) => ({
      ...previous,
      songs: previous.songs.map((song) => song.index === songIndex ? { ...song, ...patch } : song),
    }));
  }, []);

  const context: AppContextType = {
    ...state,
    setNavigation,
    currentScope,
    services,
    selectFolder,
    loadFromFolder,
    reload,
    patchSong,
    uiError,
    setUiError,
    reportUiError,
    clearUiError,
    musicFolders,
    addMusicFolder,
    removeMusicFolder,
    selectMusicFolder,
    lastVdjFolder,
    theme,
    toggleTheme,
    setTheme,
    recoveryState,
    recoveryError,
    recoveryLoading,
    recoveryOutcomes,
    mutationsBlocked: isMutationBlocked(recoveryState, recoveryError?.summary ?? null),
    refreshRecovery,
    resolveRecovery,
  };

  function renderPage(): ReactNode {
    switch (legacyPageFromNavigation(state.navigation)) {
      case "home": return <Home />;
      case "dashboard": return <Dashboard />;
      case "songs": return <Songs />;
      case "playlists": return <Playlists />;
      case "duplicates": return <Duplicates />;
      case "missing": return <MissingFiles />;
      case "relink": return <RelinkTracks />;
      case "orphans": return <OrphanFiles />;
      case "batch": return <BatchOperations />;
      case "configs": return <Configs />;
      case "pads": return <Pads />;
      case "mappers": return <Mappers />;
    }
  }

  const page = legacyPageFromNavigation(state.navigation);
  return (
    <AppContext.Provider value={context}>
      {page === "home" ? (
        <ErrorBoundary>{renderPage()}</ErrorBoundary>
      ) : (
        <Layout>
          <ErrorBoundary key={currentScope}>{renderPage()}</ErrorBoundary>
        </Layout>
      )}
    </AppContext.Provider>
  );
}
