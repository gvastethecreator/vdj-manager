/** Cue marker data for waveform overlay rendering. */
export interface CueMarker {
  /** Position in seconds */
  pos: number;
  /** VDJ Poi type (cue, remix, etc.) */
  poi_type: string | null;
  /** User-assigned name */
  name: string | null;
  /** CSS hex color string */
  color: string | null;
  /** Cue number/slot */
  num: number | null;
}

/** Lightweight summary of a song entry, sent to the frontend. */
export interface SongSummary {
  /** Position index in the database */
  index: number;
  /** True when this entry belongs to database.xml (false = discovered from filesystem roots). */
  in_database: boolean;
  /** Absolute path on disk */
  file_path: string;
  /** File name with extension */
  file_name: string;
  /** Size in bytes (from database) */
  file_size: number | null;
  title: string | null;
  author: string | null;
  album: string | null;
  genre: string | null;
  year: string | null;
  /** Calculated BPM (60 / Scan.Bpm) */
  bpm: number | null;
  /** Musical key (e.g. "Am", "Ebm") */
  key: string | null;
  /** Song length in seconds */
  duration_secs: number | null;
  bitrate: string | null;
  play_count: number | null;
  /** Star rating (string representation) */
  stars: string | null;
  /** Number of cue/poi markers */
  cue_count: number;
  /** Cue markers with position data for waveform overlays */
  cue_markers: CueMarker[];
  // ── Extended tags (VDJ Tag Editor) ──
  remix: string | null;
  remixer: string | null;
  composer: string | null;
  /** Record label */
  label: string | null;
  track_number: string | null;
  grouping: string | null;
  comment: string | null;
  user1: string | null;
  user2: string | null;
  // ── Extended infos ──
  color: string | null;
  /** User-set colour tag (manual override, takes priority over auto-detected color) */
  user_color: string | null;
  /** Gain in dB */
  gain: string | null;
  first_seen: string | null;
  first_play: string | null;
  last_play: string | null;
  // ── Derived ──
  /** Whether a .vdjstems file exists alongside the audio */
  has_stems: boolean;
}

/** Compact waveform preview data for rendering inside song tables. */
export interface WaveformPreview {
  /** Normalized peak values, where 0 = silence and 255 = max local peak. */
  peaks: number[];
  /** Number of buckets returned for rendering. */
  bucket_count: number;
  /** Normalized FFT bands for a compact spectral overlay. */
  frequency_bands: number[];
  /** Number of frequency bands returned for rendering. */
  frequency_band_count: number;
  /** Optional per-bucket colors extracted from VirtualDJ's waveform cache. */
  colors: string[];
  /** VirtualDJ cache density, when the preview came from cache.db. */
  values_per_second: number | null;
  /** Source used by the backend, e.g. virtualdj-cache or decoded-audio. */
  source: string | null;
}

/** Aggregated statistics computed from the full database. */
export interface DatabaseStats {
  total_songs: number;
  total_size_bytes: number;
  /** Genre name → count, sorted desc */
  genres: [string, number][];
  /** Artist name → count, sorted desc */
  artists: [string, number][];
  /** Year → count, sorted asc */
  years: [string, number][];
  /** Average BPM across all songs with scan data */
  avg_bpm: number | null;
  songs_with_cues: number;
  songs_with_tags: number;
}

/** Result of verifying a single file's presence and size on disk. */
export interface FileVerification {
  file_path: string;
  title: string | null;
  author: string | null;
  /** Whether the physical file exists */
  exists: boolean;
  /** Whether the file size matches the database record */
  size_match: boolean;
  expected_size: number | null;
  actual_size: number | null;
}

/** A group of songs that share a duplicate key (name, size, or hash). */
export interface DuplicateGroup {
  /** The shared value that makes them duplicates */
  key: string;
  songs: SongSummary[];
}

/** Result of the duplicate analysis across three strategies. */
export interface DuplicateResult {
  by_name: DuplicateGroup[];
  by_size: DuplicateGroup[];
  by_hash: DuplicateGroup[];
}

/** Partial update payload for editing a song's tags. */
export interface SongUpdate {
  index: number;
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

/** Partial fields accepted by the path-identified inline patch writer. */
export interface InlineSongUpdate {
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

/** Machine-readable outcome of the single-song patch-in-place write. */
export interface UpdateSongTagsResult {
  status: "completed" | "failed_validation" | "not_found" | "unsafe_to_patch";
  originalFilePath: string;
  currentFilePath: string;
  updatedFields: string[];
}

/** All navigable pages in the app. */

export type Page =
  | "home"
  | "dashboard"
  | "songs"
  | "playlists"
  | "duplicates"
  | "missing"
  | "relink"
  | "orphans"
  | "batch"
  | "configs"
  | "pads"
  | "mappers";

/** Structured candidate scored and ordered by the backend relink engine. */
export interface SimilarFileCandidate {
  path: string;
  score: number;
  reasons: string[];
  sameExtension: boolean;
  sameStem: boolean;
  sameName: boolean;
  sizeMatch: boolean;
}

/** Candidate set for one original database path. */
export interface SimilarFileMatch {
  status: "completed" | "not_found" | "manual_review_required";
  originalFilePath: string;
  candidates: SimilarFileCandidate[];
  message: string | null;
}

export type RelinkFileStatus =
  | "completed"
  | "failed_validation"
  | "reference_collision"
  | "manual_review_required"
  | "not_found";

/** Typed outcome of a single-item path reconciliation. */
export interface RelinkFileResult {
  status: RelinkFileStatus;
  originalFilePath: string;
  newFilePath: string;
  fileSize: number | null;
  collisionPath: string | null;
  message: string | null;
}

/** Preview result of a batch dry-run operation. */
export interface DryRunResult {
  description: string;
  affected_count: number;
  details: string[];
}

/** Info about a VDJ playlist file (.m3u / .m3u8). */
export interface PlaylistInfo {
  /** Display name (file stem) */
  name: string;
  /** Absolute path to the .m3u/.m3u8 file */
  path: string;
  /** Subfolder inside Playlists/ (empty for root-level) */
  folder: string;
  /** Number of entries in the playlist */
  count: number;
  /** Playlist format extension (m3u, m3u8, vdjplaylist, vdjlist). */
  format: string;
}

/** A single entry from a parsed playlist. */
export interface PlaylistEntry {
  /** Absolute file path */
  file_path: string;
}

/** VirtualDJ editable config/mapping file metadata. */
export interface VdjConfigFileInfo {
  name: string;
  path: string;
  relative_path: string;
  size_bytes: number;
}

/** Curated VirtualDJ setting metadata and current value extracted from settings.xml. */
export interface VdjSettingEntry {
  key: string;
  label: string;
  description: string;
  category: string;
  value: string | null;
}

/** Single control binding inside a VirtualDJ mapper file. */
export interface VdjMapperBinding {
  value: string;
  action: string;
  other_attributes: Record<string, string>;
}

/** Structured representation of a `.vdjmap` controller mapping file. */
export interface VdjMapperDocument {
  device: string;
  author: string | null;
  version: string | null;
  date: string | null;
  priority: string | null;
  info: string | null;
  other_attributes: Record<string, string>;
  mappings: VdjMapperBinding[];
}

/** Generic XML node used for structured editing of pad files. */
export interface VdjXmlNode {
  name: string;
  attributes: Record<string, string>;
  text: string | null;
  children: VdjXmlNode[];
}
