import type { SongSummary } from "../types/database";

const WINDOWS_DRIVE_RE = /^[A-Za-z]:[\\/]?/;

export function normalizePathSeparators(path: string): string {
  return path.replace(/\//g, "\\");
}

export function getDriveRoot(path: string): string {
  const normalized = normalizePathSeparators(path.trim());
  const driveMatch = normalized.match(WINDOWS_DRIVE_RE);
  if (driveMatch) {
    return `${driveMatch[0][0].toUpperCase()}:\\`;
  }

  if (normalized.startsWith("\\\\")) {
    const parts = normalized.split("\\").filter(Boolean);
    return parts.length >= 2 ? `\\\\${parts[0]}\\${parts[1]}\\` : normalized;
  }

  if (normalized.startsWith("\\")) {
    return "\\";
  }

  return "";
}

export function getPathLeafName(path: string): string {
  const normalized = normalizePathSeparators(path).replace(/[\\]+$/, "");
  if (/^[A-Za-z]:$/.test(normalized)) {
    return `${normalized.toUpperCase()}\\`;
  }
  return normalized.split("\\").pop() || normalized || path;
}

export function getParentDirectory(path: string): string {
  const normalized = normalizePathSeparators(path).replace(/[\\]+$/, "");
  const driveRoot = getDriveRoot(normalized);
  if (driveRoot && normalized.toUpperCase() === driveRoot.replace(/[\\]+$/, "").toUpperCase()) {
    return "";
  }

  const index = normalized.lastIndexOf("\\");
  if (index < 0) return "";
  if (index === 2 && /^[A-Za-z]:/.test(normalized)) return `${normalized.slice(0, 2)}\\`;
  return normalized.slice(0, index);
}

export function compareDriveAwarePaths(a: string, b: string): number {
  const driveA = getDriveRoot(a).toLowerCase();
  const driveB = getDriveRoot(b).toLowerCase();
  const driveCompare = driveA.localeCompare(driveB, undefined, { numeric: true, sensitivity: "base" });
  if (driveCompare !== 0) return driveCompare;

  return normalizePathSeparators(a).localeCompare(
    normalizePathSeparators(b),
    undefined,
    { numeric: true, sensitivity: "base" },
  );
}

export function compareSongsByDrivePath(a: SongSummary, b: SongSummary): number {
  return compareDriveAwarePaths(a.file_path, b.file_path)
    || a.file_name.localeCompare(b.file_name, undefined, { numeric: true, sensitivity: "base" });
}

export function isPathInsideFolder(filePath: string, folderPath: string): boolean {
  const normalizedFile = normalizePathSeparators(filePath).toLowerCase();
  const normalizedFolder = normalizePathSeparators(folderPath).replace(/[\\]+$/, "").toLowerCase();
  return normalizedFile === normalizedFolder || normalizedFile.startsWith(`${normalizedFolder}\\`);
}
