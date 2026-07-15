import type { SimilarFileCandidate, SimilarFileMatch } from "../types/database";

function pathKey(path: string): string {
  return path.replace(/\//g, "\\").replace(/\\+$/g, "").toLocaleLowerCase();
}

/** True when an async candidate response still belongs to the selected entry. */
export function isRelinkMatchForPath(
  match: Pick<SimilarFileMatch, "originalFilePath">,
  selectedPath: string | null,
): boolean {
  return selectedPath !== null && pathKey(match.originalFilePath) === pathKey(selectedPath);
}

/**
 * Merge candidate responses without inventing a frontend score or order.
 *
 * The first response/first candidate wins ties, while duplicate paths are
 * collapsed case-insensitively. This is useful for callers that still scan
 * roots independently; the primary RelinkTracks flow uses the backend's
 * multi-root command directly.
 */
export function mergeRelinkCandidateLists(
  matchLists: SimilarFileMatch[][],
): SimilarFileMatch[] {
  const merged = new Map<string, SimilarFileMatch>();

  for (const matchList of matchLists) {
    for (const match of matchList) {
      const originalKey = pathKey(match.originalFilePath);
      const existing = merged.get(originalKey);
      if (!existing) {
        merged.set(originalKey, {
          status: match.status,
          originalFilePath: match.originalFilePath,
          candidates: [...match.candidates],
          message: match.message,
        });
        continue;
      }

      const seenCandidates = new Set(existing.candidates.map((candidate) => pathKey(candidate.path)));
      for (const candidate of match.candidates) {
        if (!seenCandidates.has(pathKey(candidate.path))) {
          existing.candidates.push(candidate);
          seenCandidates.add(pathKey(candidate.path));
        }
      }
    }
  }

  return [...merged.values()];
}

/** Human-readable labels for backend reason codes. */
export function relinkReasonLabel(reason: string): string {
  switch (reason) {
    case "same_name": return "mismo nombre";
    case "same_stem": return "mismo stem";
    case "similar_stem": return "stem parecido";
    case "same_extension": return "misma extensión";
    case "size_match": return "mismo tamaño";
    case "size_close": return "tamaño cercano";
    case "title_match": return "título coincide";
    case "author_match": return "artista coincide";
    default: return reason;
  }
}

export type { SimilarFileCandidate };
