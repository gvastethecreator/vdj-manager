import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import * as api from "./api";
import { buildSyntheticWaveformPreview } from "./waveformFallback";
import { DEMO_FOLDER, DEMO_MUSIC_ROOTS, demoSongs, demoSongsForScenario, demoStats } from "./demoData";
import { getDemoRecoveryState } from "./recovery";
import type {
  ApplyRecoveryResult,
  DryRunResult,
  DuplicateResult,
  FileVerification,
  LibraryRemovalResult,
  MoveBatchReport,
  MutationRecoveryState,
  PlaylistEntry,
  PlaylistInfo,
  RelinkFileResult,
  RenameFileResult,
  SimilarFileMatch,
  UpdateSongTagsResult,
  VdjConfigFileInfo,
  VdjMapperDocument,
  VdjSettingEntry,
  VdjXmlNode,
} from "../types/database";

export interface DirectoryRequest {
  title: string;
  defaultPath?: string;
  purpose: "virtualdj" | "music" | "destination" | "relink";
}

export interface FileRequest {
  title: string;
  extensions: string[];
}

export interface RuntimeServices {
  mode: "tauri" | "demo";
  selectDirectory(request: DirectoryRequest): Promise<string | null>;
  selectFile(request: FileRequest): Promise<string | null>;
  convertFileSrc(filePath: string): string;
  loadDatabase: typeof api.loadDatabase;
  getWaveformPreview: typeof api.getWaveformPreview;
  getDatabaseStats: typeof api.getDatabaseStats;
  updateSongTags: typeof api.updateSongTags;
  removeLibraryEntries: typeof api.removeLibraryEntries;
  getMutationRecoveryState: typeof api.getMutationRecoveryState;
  applyMutationRecoveryAction: typeof api.applyMutationRecoveryAction;
  verifyFiles: typeof api.verifyFiles;
  scanMusicFolder: typeof api.scanMusicFolder;
  renameFileOp: typeof api.renameFileOp;
  moveFilesOp: typeof api.moveFilesOp;
  findOrphanFiles: typeof api.findOrphanFiles;
  findDuplicates: typeof api.findDuplicates;
  findSimilarFiles: typeof api.findSimilarFiles;
  findRelinkCandidates: typeof api.findRelinkCandidates;
  relocateFile: typeof api.relocateFile;
  listSubdirectories: typeof api.listSubdirectories;
  planMoveFiles: typeof api.planMoveFiles;
  dryRunRename: typeof api.dryRunRename;
  listPlaylists: typeof api.listPlaylists;
  readPlaylist: typeof api.readPlaylist;
  listVdjConfigFiles: typeof api.listVdjConfigFiles;
  readVdjConfigFile: typeof api.readVdjConfigFile;
  writeVdjConfigFile: typeof api.writeVdjConfigFile;
  getVdjSettings: typeof api.getVdjSettings;
  updateVdjSettings: typeof api.updateVdjSettings;
  getVdjMapper: typeof api.getVdjMapper;
  updateVdjMapper: typeof api.updateVdjMapper;
  getVdjPadDocument: typeof api.getVdjPadDocument;
  updateVdjPadDocument: typeof api.updateVdjPadDocument;
}

const CLEAN_RECOVERY: MutationRecoveryState = {
  status: "clean",
  libraryKey: "demo-virtualdj",
  recommendedAction: null,
  allowedActions: [],
  entries: [],
};

const DEMO_PLAYLISTS: PlaylistInfo[] = [
  { name: "Warm up", path: `${DEMO_FOLDER}\\Playlists\\Warm up.m3u8`, folder: "", count: 3, format: "m3u8" },
  { name: "Peak hour", path: `${DEMO_FOLDER}\\Playlists\\Club\\Peak hour.vdjplaylist`, folder: "Club", count: 2, format: "vdjplaylist" },
  { name: "2026-07-12", path: `${DEMO_FOLDER}\\History\\2026-07-12.m3u`, folder: "History", count: 4, format: "m3u" },
];

const DEMO_CONFIG_FILES: VdjConfigFileInfo[] = [
  { name: "settings.xml", path: `${DEMO_FOLDER}\\settings.xml`, relative_path: "settings.xml", size_bytes: 18_432 },
  { name: "Controller.vdjmap", path: `${DEMO_FOLDER}\\Mappers\\Controller.vdjmap`, relative_path: "Mappers\\Controller.vdjmap", size_bytes: 4_096 },
  { name: "Performance.vdjpad", path: `${DEMO_FOLDER}\\Pads\\Performance.vdjpad`, relative_path: "Pads\\Performance.vdjpad", size_bytes: 6_144 },
];

const DEMO_SETTINGS: VdjSettingEntry[] = [
  { key: "autoBPMMatch", label: "Sincronización automática de BPM", description: "Ajusta el tempo al cargar una pista.", category: "Mezcla", value: "yes" },
  { key: "browserColumns", label: "Columnas del browser", description: "Conserva la configuración de columnas de VirtualDJ.", category: "Biblioteca", value: "title,artist,bpm,key" },
  { key: "saveHistory", label: "Guardar History", description: "Registra las sesiones reproducidas.", category: "Biblioteca", value: "yes" },
  { key: "waveformQuality", label: "Calidad de waveform", description: "Nivel de detalle de las formas de onda.", category: "Rendimiento", value: "high" },
  { key: "sandboxPlugins", label: "Aislar plugins", description: "Ejecuta plugins compatibles dentro del sandbox.", category: "Seguridad", value: "yes" },
];

const DEMO_MAPPER: VdjMapperDocument = {
  device: "Demo Controller",
  author: "VDJ Manager fixture",
  version: "1.0",
  date: "2026-07-15",
  priority: "1",
  info: "Fixture determinista; no representa un dispositivo físico.",
  other_attributes: {},
  mappings: [
    { value: "PLAY", action: "play_pause", other_attributes: {} },
    { value: "PAD_1", action: "hot_cue 1", other_attributes: {} },
  ],
};

const DEMO_PAD: VdjXmlNode = {
  name: "pad",
  attributes: { name: "Performance", color: "#8b5cf6" },
  text: null,
  children: [
    { name: "button", attributes: { index: "1", name: "Cue 1", color: "#8b5cf6" }, text: "hot_cue 1", children: [] },
    { name: "button", attributes: { index: "2", name: "Loop 4", color: "#38bdf8" }, text: "loop 4", children: [] },
  ],
};

const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

function demoScenario(): string {
  if (typeof window === "undefined") return "healthy";
  return new URLSearchParams(window.location.search).get("state") ?? "healthy";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function demoIntegrityGate(operation: string): Promise<void> {
  const scenario = demoScenario();
  if (scenario === "loading") {
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  if (scenario === "error") {
    throw new Error(`Fixture demo: ${operation} no está disponible.`);
  }
}

function demoVerification(): FileVerification[] {
  const problem = demoScenario() === "problem";
  return demoSongs.filter((song) => song.in_database).map((song, index) => ({
    file_path: song.file_path,
    title: song.title,
    author: song.author,
    exists: !(problem && index === 3),
    size_match: !(problem && index === 4),
    expected_size: song.file_size,
    actual_size: problem && index === 4 ? (song.file_size ?? 0) + 2_048 : song.file_size,
  }));
}

function demoMoveReport(paths: string[], targetFolder: string, completed: boolean): MoveBatchReport {
  const items = paths.map((originalFilePath) => ({
    originalFilePath,
    targetFilePath: `${targetFolder}\\${originalFilePath.split(/[\\/]/).pop() ?? "track.mp3"}`,
    status: completed ? "db_committed" as const : "ready" as const,
    message: null,
    journalId: completed ? `demo-${Math.abs(originalFilePath.length * 97)}` : null,
    transferMethod: completed ? "rename" as const : null,
  }));
  return {
    summary: {
      total: items.length,
      ready: completed ? 0 : items.length,
      completed: completed ? items.length : 0,
      blocked: 0,
      manualReview: 0,
    },
    items,
  };
}

export function createTauriRuntimeServices(): RuntimeServices {
  return {
    mode: "tauri",
    async selectDirectory({ title, defaultPath }) {
      const selected = await open({ directory: true, title, defaultPath });
      return typeof selected === "string" ? selected : null;
    },
    async selectFile({ title, extensions }) {
      const selected = await open({
        title,
        multiple: false,
        filters: [{ name: "Archivos compatibles", extensions }],
      });
      return typeof selected === "string" ? selected : null;
    },
    convertFileSrc,
    loadDatabase: api.loadDatabase,
    getWaveformPreview: api.getWaveformPreview,
    getDatabaseStats: api.getDatabaseStats,
    updateSongTags: api.updateSongTags,
    removeLibraryEntries: api.removeLibraryEntries,
    getMutationRecoveryState: api.getMutationRecoveryState,
    applyMutationRecoveryAction: api.applyMutationRecoveryAction,
    verifyFiles: api.verifyFiles,
    scanMusicFolder: api.scanMusicFolder,
    renameFileOp: api.renameFileOp,
    moveFilesOp: api.moveFilesOp,
    findOrphanFiles: api.findOrphanFiles,
    findDuplicates: api.findDuplicates,
    findSimilarFiles: api.findSimilarFiles,
    findRelinkCandidates: api.findRelinkCandidates,
    relocateFile: api.relocateFile,
    listSubdirectories: api.listSubdirectories,
    planMoveFiles: api.planMoveFiles,
    dryRunRename: api.dryRunRename,
    listPlaylists: api.listPlaylists,
    readPlaylist: api.readPlaylist,
    listVdjConfigFiles: api.listVdjConfigFiles,
    readVdjConfigFile: api.readVdjConfigFile,
    writeVdjConfigFile: api.writeVdjConfigFile,
    getVdjSettings: api.getVdjSettings,
    updateVdjSettings: api.updateVdjSettings,
    getVdjMapper: api.getVdjMapper,
    updateVdjMapper: api.updateVdjMapper,
    getVdjPadDocument: api.getVdjPadDocument,
    updateVdjPadDocument: api.updateVdjPadDocument,
  };
}

export function createDemoRuntimeServices(): RuntimeServices {
  const scenarioSongs = demoSongsForScenario(demoScenario());
  return {
    mode: "demo",
    async selectDirectory({ purpose }) {
      return purpose === "virtualdj" ? DEMO_FOLDER : `${DEMO_MUSIC_ROOTS[0]}\\Incoming`;
    },
    async selectFile() { return `${DEMO_FOLDER}\\Playlists\\Warm up.m3u8`; },
    convertFileSrc: () => SILENT_WAV,
    async loadDatabase() { return clone(scenarioSongs); },
    async getWaveformPreview(filePath, bucketCount = 64) { return buildSyntheticWaveformPreview(filePath, bucketCount); },
    async getDatabaseStats() { return clone(demoStats); },
    async updateSongTags(_folder, originalFilePath, update): Promise<UpdateSongTagsResult> {
      return { status: "completed", originalFilePath, currentFilePath: originalFilePath, updatedFields: Object.keys(update) };
    },
    async removeLibraryEntries(_folder, items, mode): Promise<LibraryRemovalResult[]> {
      return items.map((originalFilePath) => ({ originalFilePath, status: "completed", mode, message: null }));
    },
    async getMutationRecoveryState() { return clone(getDemoRecoveryState() ?? CLEAN_RECOVERY); },
    async applyMutationRecoveryAction(_folder, action, journalId): Promise<ApplyRecoveryResult> {
      return {
        state: clone(CLEAN_RECOVERY),
        outcomes: [{
          journalId,
          itemId: "demo-item-001",
          originalFilePath: `${DEMO_MUSIC_ROOTS[0]}\\Incoming\\Demo Track.mp3`,
          targetFilePath: `${DEMO_MUSIC_ROOTS[0]}\\House\\Demo Track.mp3`,
          status: "resolved",
          message: action === "rollback" ? "Rollback de demostración completado." : "Recuperación de demostración completada.",
        }],
      };
    },
    async verifyFiles() {
      await demoIntegrityGate("verificación de archivos");
      return clone(demoVerification());
    },
    async scanMusicFolder(folderPath) {
      await demoIntegrityGate("escaneo de carpeta");
      return scenarioSongs.filter((song) => song.file_path.toLowerCase().startsWith(folderPath.toLowerCase())).map((song) => song.file_path);
    },
    async renameFileOp(_folder, originalFilePath, newFileName): Promise<RenameFileResult> {
      const parent = originalFilePath.replace(/[\\/][^\\/]+$/, "");
      return { status: "completed", originalFilePath, newFilePath: `${parent}\\${newFileName}`, journalId: "demo-rename", phase: "completed", message: null };
    },
    async moveFilesOp(_folder, paths, targetFolder) { return demoMoveReport(paths, targetFolder, true); },
    async findOrphanFiles() { return demoScenario() === "problem" ? [`${DEMO_MUSIC_ROOTS[2]}\\Uncatalogued Edit.wav`] : []; },
    async findDuplicates(): Promise<DuplicateResult> {
      await demoIntegrityGate("análisis de duplicados");
      if (demoScenario() !== "problem") return { by_name: [], by_size: [], by_hash: [] };
      const pair = [clone(demoSongs[0]), { ...clone(demoSongs[0]), index: 90, file_path: `${DEMO_MUSIC_ROOTS[2]}\\Disclosure - You & Me copy.flac`, file_name: "Disclosure - You & Me copy.flac" }];
      return { by_name: [{ key: "disclosure - you & me", songs: pair }], by_size: [], by_hash: [] };
    },
    async findSimilarFiles(_folder, missingPaths, scanFolder): Promise<SimilarFileMatch[]> {
      return Promise.all(missingPaths.map((path) => createDemoRuntimeServices().findRelinkCandidates(_folder, path, [scanFolder])));
    },
    async findRelinkCandidates(_folder, originalFilePath, scanFolders): Promise<SimilarFileMatch> {
      await demoIntegrityGate("búsqueda de candidatos");
      const target = `${scanFolders[0] ?? DEMO_MUSIC_ROOTS[0]}\\Recovered\\${originalFilePath.split(/[\\/]/).pop() ?? "track.mp3"}`;
      return {
        status: "completed",
        originalFilePath,
        message: null,
        candidates: [{ path: target, score: 0.94, reasons: ["mismo nombre", "misma extensión"], sameExtension: true, sameStem: true, sameName: true, sizeMatch: true }],
      };
    },
    async relocateFile(_folder, originalFilePath, newFilePath): Promise<RelinkFileResult> {
      return { status: "completed", originalFilePath, newFilePath, fileSize: 9_482_240, collisionPath: null, message: null };
    },
    async listSubdirectories(folderPath) {
      const prefix = folderPath.replace(/[\\/]+$/, "").toLowerCase();
      const directories = new Set<string>();
      for (const song of demoSongs) {
        if (!song.file_path.toLowerCase().startsWith(`${prefix}\\`)) continue;
        const remainder = song.file_path.slice(folderPath.replace(/[\\/]+$/, "").length + 1);
        const segment = remainder.split(/[\\/]/)[0];
        if (segment && remainder.includes("\\")) directories.add(`${folderPath.replace(/[\\/]+$/, "")}\\${segment}`);
      }
      return [...directories];
    },
    async planMoveFiles(_folder, paths, targetFolder) { return demoMoveReport(paths, targetFolder, false); },
    async dryRunRename(_folder, indices, pattern): Promise<DryRunResult> {
      return { description: `Vista previa: ${pattern}`, affected_count: indices.length, details: indices.map((index) => `${demoSongs[index]?.file_name ?? index} → ${pattern}`) };
    },
    async listPlaylists() { return clone(DEMO_PLAYLISTS); },
    async readPlaylist(playlistPath): Promise<PlaylistEntry[]> {
      const playlist = DEMO_PLAYLISTS.find((entry) => entry.path === playlistPath);
      const count = playlist?.count ?? 2;
      return demoSongs.slice(0, count).map((song) => ({ file_path: song.file_path }));
    },
    async listVdjConfigFiles() { return clone(DEMO_CONFIG_FILES); },
    async readVdjConfigFile(_folder, filePath) {
      if (filePath.endsWith(".vdjmap")) return `<mapper device="${DEMO_MAPPER.device}"><map value="PLAY" action="play_pause" /></mapper>`;
      if (filePath.endsWith(".vdjpad")) return "<pad name=\"Performance\"><button index=\"1\">hot_cue 1</button></pad>";
      return "<settings><autoBPMMatch>yes</autoBPMMatch></settings>";
    },
    async writeVdjConfigFile(_folder, filePath) { return `${filePath}.demo-backup`; },
    async getVdjSettings() { return clone(DEMO_SETTINGS); },
    async updateVdjSettings() { return `${DEMO_FOLDER}\\Backups\\settings.demo.xml`; },
    async getVdjMapper() { return clone(DEMO_MAPPER); },
    async updateVdjMapper(_folder, filePath) { return `${filePath}.demo-backup`; },
    async getVdjPadDocument() { return clone(DEMO_PAD); },
    async updateVdjPadDocument(_folder, filePath) { return `${filePath}.demo-backup`; },
  };
}

export function createRuntimeServices(demoMode: boolean): RuntimeServices {
  return demoMode ? createDemoRuntimeServices() : createTauriRuntimeServices();
}
