/**
 * Tauri IPC wrappers for the VDJ database backend.
 * Each function maps to a `#[tauri::command]` handler in Rust.
 * @module api
 */
import { invoke } from "@tauri-apps/api/core";
import type {
  SongSummary,
  WaveformPreview,
  DatabaseStats,
  FileVerification,
  DuplicateResult,
  SimilarFileMatch,
  DryRunResult,
  PlaylistInfo,
  PlaylistEntry,
  VdjConfigFileInfo,
  VdjSettingEntry,
  VdjMapperDocument,
  VdjXmlNode,
  SongUpdate,
} from "../types/database";

/**
 * Load and parse the VDJ database.xml from a folder.
 * @param vdjFolder - Absolute path to the VirtualDJ folder
 * @returns Array of summarised song entries
 */
export async function loadDatabase(
  vdjFolder: string
): Promise<SongSummary[]> {
  return invoke<SongSummary[]>("load_database", { vdjFolder });
}

/**
 * Extract a compact waveform preview for a media file.
 * @param filePath - Absolute media path on disk
 * @param bucketCount - Number of amplitude buckets to return
 */
export async function getWaveformPreview(
  filePath: string,
  bucketCount = 64
): Promise<WaveformPreview> {
  return invoke<WaveformPreview>("get_waveform_preview", {
    filePath,
    bucketCount,
  });
}

/**
 * Compute aggregate statistics from the database.
 * @param vdjFolder - Absolute path to the VirtualDJ folder
 */
export async function getDatabaseStats(
  vdjFolder: string
): Promise<DatabaseStats> {
  return invoke<DatabaseStats>("get_database_stats", { vdjFolder });
}

/**
 * Save batch tag updates to the database (creates `.xml.bak` backup).
 * @param vdjFolder - Absolute path to the VirtualDJ folder
 * @param songsJson - JSON-serialised array of `SongUpdate` objects
 */
export async function saveDatabase(
  vdjFolder: string,
  songsJson: string
): Promise<void> {
  return invoke<void>("save_database", { vdjFolder, songsJson });
}

/**
 * Apply a batch of song updates in a single database write.
 */
export async function saveSongUpdates(
  vdjFolder: string,
  updates: SongUpdate[]
): Promise<void> {
  return saveDatabase(vdjFolder, JSON.stringify(updates));
}

/**
 * Update individual tag fields for a single song.
 * @param vdjFolder - Absolute path to the VirtualDJ folder
 * @param index - Song index in the database
 * @param tags - Partial tag fields to update
 */
export async function updateSongTags(
  vdjFolder: string,
  index: number,
  tags: {
    title?: string;
    author?: string;
    album?: string;
    genre?: string;
    year?: string;
    key?: string;
    bpm?: string;
    grouping?: string;
    label?: string;
    remix?: string;
    remixer?: string;
    composer?: string;
    trackNumber?: string;
    stars?: string;
    user1?: string;
    user2?: string;
    commentText?: string;
    color?: string;
    gain?: string;
  }
): Promise<void> {
  return invoke<void>("update_song_tags", { vdjFolder, index, ...tags });
}

/**
 * Remove songs from the database by index, optionally moving files to trash.
 * @param vdjFolder - VirtualDJ folder path
 * @param indices - Song indices to remove
 * @param deleteFiles - If true, move physical files to the OS recycle bin
 * @returns Array of result strings per action
 */
export async function deleteSongs(
  vdjFolder: string,
  indices: number[],
  deleteFiles: boolean
): Promise<string[]> {
  return invoke<string[]>("delete_songs", { vdjFolder, indices, deleteFiles });
}

/**
 * Verify that all database files exist on disk with correct sizes.
 * @param vdjFolder - Absolute path to the VirtualDJ folder
 */
export async function verifyFiles(
  vdjFolder: string
): Promise<FileVerification[]> {
  return invoke<FileVerification[]>("verify_files", { vdjFolder });
}

/**
 * Recursively scan a folder for audio/video files.
 * @param folderPath - Absolute path to scan
 */
export async function scanMusicFolder(
  folderPath: string
): Promise<string[]> {
  return invoke<string[]>("scan_music_folder", { folderPath });
}

/**
 * Rename a file on disk and update the database path.
 * @param vdjFolder - VirtualDJ folder path
 * @param songIndex - Song index in the database
 * @param newName - New filename (without path)
 * @returns The new absolute file path
 */
export async function renameFileOp(
  vdjFolder: string,
  songIndex: number,
  newName: string
): Promise<string> {
  return invoke<string>("rename_file_op", { vdjFolder, songIndex, newName });
}

/**
 * Move multiple songs to a target folder, updating database paths.
 * @param vdjFolder - VirtualDJ folder path
 * @param songIndices - Array of song indices to move
 * @param targetFolder - Destination directory
 * @returns Array of result strings per file ("OK: ..." or "Error: ...")
 */
export async function moveFilesOp(
  vdjFolder: string,
  songIndices: number[],
  targetFolder: string
): Promise<string[]> {
  return invoke<string[]>("move_files_op", {
    vdjFolder,
    songIndices,
    targetFolder,
  });
}

/**
 * Find audio files on disk that are not registered in the database.
 * @param vdjFolder - VirtualDJ folder path
 * @param scanFolder - Folder to scan for orphan files
 */
export async function findOrphanFiles(
  vdjFolder: string,
  scanFolder: string
): Promise<string[]> {
  return invoke<string[]>("find_orphan_files", { vdjFolder, scanFolder });
}

/**
 * Find duplicate songs using three strategies: name, size, and MD5 hash.
 * @param vdjFolder - VirtualDJ folder path
 */
export async function findDuplicates(
  vdjFolder: string
): Promise<DuplicateResult> {
  return invoke<DuplicateResult>("find_duplicates", { vdjFolder });
}

/**
 * Format seconds into `m:ss` display string.
 * @param secs - Duration in seconds, or null
 */
export function formatDuration(secs: number | null): string {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format bytes into a human-readable size string (B / KB / MB / GB).
 * @param bytes - Size in bytes, or null
 */
export function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── New commands ──

/**
 * Find files with similar names to missing entries, scanning a folder.
 */
export async function findSimilarFiles(
  vdjFolder: string,
  missingPaths: string[],
  scanFolder: string
): Promise<SimilarFileMatch[]> {
  return invoke<SimilarFileMatch[]>("find_similar_files", {
    vdjFolder,
    missingPaths,
    scanFolder,
  });
}

/**
 * Relocate a missing file by updating its path in the database.
 */
export async function relocateFile(
  vdjFolder: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  return invoke<void>("relocate_file", { vdjFolder, oldPath, newPath });
}

/**
 * List immediate subdirectories of a folder (for tree navigation).
 */
export async function listSubdirectories(
  folderPath: string
): Promise<string[]> {
  return invoke<string[]>("list_subdirectories", { folderPath });
}

/**
 * Dry-run preview of a move operation.
 */
export async function dryRunMove(
  vdjFolder: string,
  songIndices: number[],
  targetFolder: string
): Promise<DryRunResult> {
  return invoke<DryRunResult>("dry_run_move", {
    vdjFolder,
    songIndices,
    targetFolder,
  });
}

/**
 * Dry-run preview of a rename operation.
 */
export async function dryRunRename(
  vdjFolder: string,
  songIndices: number[],
  renamePattern: string
): Promise<DryRunResult> {
  return invoke<DryRunResult>("dry_run_rename", {
    vdjFolder,
    songIndices,
    renamePattern,
  });
}

/**
 * Extract the directory (parent folder) from a file path.
 */
export function getDirectory(filePath: string): string {
  const sep = filePath.includes("/") ? "/" : "\\";
  const parts = filePath.split(sep);
  parts.pop();
  return parts.join(sep);
}

/**
 * Convert VDJ's colour value to CSS hex.
 * VDJ stores colour in Windows COLORREF format (BGR): `(B << 16) | (G << 8) | R`.
 * Example: Red = 255 (0x0000FF → R=FF,G=00,B=00), Yellow = 65535, Blue = 16711680.
 * Also handles values already in "#RRGGBB" format (pass-through).
 * Returns null for empty / invalid / "0" (typically means "no colour").
 */
export function parseVdjColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("#")) return raw;
  const n = parseInt(raw, 10);
  if (isNaN(n) || n <= 0) return null; // 0 = usually "no colour"
  // Swap B↔R from COLORREF (BGR) to CSS (RGB)
  const r = n & 0xff;
  const g = (n >> 8) & 0xff;
  const b = (n >> 16) & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Get the effective display colour for a song.
 * Prefers `user_color` (manual tag) over `color` (auto-detected).
 */
export function getEffectiveColor(song: { color: string | null; user_color: string | null }): string | null {
  return parseVdjColor(song.user_color) ?? parseVdjColor(song.color);
}

// ── Playlists ──

/**
 * List all playlists found under `<vdjFolder>/Playlists/`.
 */
export async function listPlaylists(vdjFolder: string): Promise<PlaylistInfo[]> {
  return invoke<PlaylistInfo[]>("list_playlists", { vdjFolder });
}

/**
 * Read entries from a single playlist file.
 */
export async function readPlaylist(playlistPath: string): Promise<PlaylistEntry[]> {
  return invoke<PlaylistEntry[]>("read_playlist", { playlistPath });
}

// ── VirtualDJ config files ──

/**
 * List editable VirtualDJ config-related files (mappings, pads, settings, playlists, etc.).
 */
export async function listVdjConfigFiles(
  vdjFolder: string
): Promise<VdjConfigFileInfo[]> {
  return invoke<VdjConfigFileInfo[]>("list_vdj_config_files", { vdjFolder });
}

/**
 * Read a VirtualDJ config/mapping file content.
 */
export async function readVdjConfigFile(
  vdjFolder: string,
  filePath: string
): Promise<string> {
  return invoke<string>("read_vdj_config_file", { vdjFolder, filePath });
}

/**
 * Write a VirtualDJ config/mapping file content. Returns backup path if overwritten.
 */
export async function writeVdjConfigFile(
  vdjFolder: string,
  filePath: string,
  content: string
): Promise<string> {
  return invoke<string>("write_vdj_config_file", { vdjFolder, filePath, content });
}

/**
 * Read curated settings from VirtualDJ settings.xml.
 */
export async function getVdjSettings(
  vdjFolder: string
): Promise<VdjSettingEntry[]> {
  return invoke<VdjSettingEntry[]>("get_vdj_settings", { vdjFolder });
}

/**
 * Update selected VirtualDJ settings.xml values. Returns backup path.
 */
export async function updateVdjSettings(
  vdjFolder: string,
  updates: Record<string, string>
): Promise<string> {
  return invoke<string>("update_vdj_settings", {
    vdjFolder,
    updatesJson: JSON.stringify(updates),
  });
}

/**
 * Read a `.vdjmap` file as a structured mapper document.
 */
export async function getVdjMapper(
  vdjFolder: string,
  filePath: string
): Promise<VdjMapperDocument> {
  return invoke<VdjMapperDocument>("get_vdj_mapper", { vdjFolder, filePath });
}

/**
 * Save a structured mapper document back to disk. Returns backup path.
 */
export async function updateVdjMapper(
  vdjFolder: string,
  filePath: string,
  mapper: VdjMapperDocument
): Promise<string> {
  return invoke<string>("update_vdj_mapper", { vdjFolder, filePath, mapper });
}

/**
 * Read a `.vdjpad` file as a structured XML document tree.
 */
export async function getVdjPadDocument(
  vdjFolder: string,
  filePath: string
): Promise<VdjXmlNode> {
  return invoke<VdjXmlNode>("get_vdj_pad_document", { vdjFolder, filePath });
}

/**
 * Save a structured `.vdjpad` XML document. Returns backup path.
 */
export async function updateVdjPadDocument(
  vdjFolder: string,
  filePath: string,
  document: VdjXmlNode
): Promise<string> {
  return invoke<string>("update_vdj_pad_document", { vdjFolder, filePath, document });
}

/**
 * Derive the minimal set of root directories that cover all song paths.
 * E.g. if all songs live under D:\Music, returns ["D:\\Music"].
 * Accepts any SongSummary-shaped object with a `file_path` string.
 */
export function getMusicRoots(songs: { file_path: string }[]): string[] {
  // Collect unique parent directories
  const dirs = new Set<string>();
  for (const s of songs) {
    const p = s.file_path;
    const sep = p.includes("/") ? "/" : "\\";
    const idx = p.lastIndexOf(sep);
    if (idx > 0) dirs.add(p.slice(0, idx));
  }
  if (dirs.size === 0) return [];

  // Sort ascending by length so shortest (highest) paths come first
  const sorted = [...dirs].sort((a, b) => a.length - b.length);

  // Keep only paths not already covered by a shorter ancestor
  const roots: string[] = [];
  for (const dir of sorted) {
    const sep = dir.includes("/") ? "/" : "\\";
    const covered = roots.some((r) => dir === r || dir.startsWith(r + sep));
    if (!covered) roots.push(dir);
  }
  return roots;
}

/**
 * Normalize a folder path for case-insensitive dedupe/storage.
 */
export function normalizeFolderPath(folderPath: string): string {
  const trimmed = folderPath.trim();
  if (!trimmed) return "";

  const withoutTrailing = trimmed.replace(/[\\/]+$/, "");
  if (/^[A-Za-z]:$/.test(withoutTrailing)) {
    return `${withoutTrailing}\\`;
  }

  return withoutTrailing || trimmed;
}

/**
 * Merge multiple folder lists preserving order and removing duplicates.
 */
export function mergeFolderLists(...folderLists: string[][]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const folderList of folderLists) {
    for (const folder of folderList) {
      const normalized = normalizeFolderPath(folder);
      if (!normalized) continue;

      const dedupeKey = normalized.toLowerCase();
      if (seen.has(dedupeKey)) continue;

      seen.add(dedupeKey);
      merged.push(normalized);
    }
  }

  return merged;
}

/**
 * Combine roots derived from songs with user-configured music folders.
 */
export function getConfiguredMusicRoots(
  songs: { file_path: string }[],
  vdjFolder: string | null,
  musicFolders: string[]
): string[] {
  const derivedRoots = getMusicRoots(songs);
  const fallbackRoots = derivedRoots.length > 0
    ? derivedRoots
    : vdjFolder
      ? [vdjFolder]
      : [];

  return mergeFolderLists(fallbackRoots, musicFolders);
}
