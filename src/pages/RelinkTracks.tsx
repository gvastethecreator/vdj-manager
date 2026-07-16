import { useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Link2, RefreshCw, Search } from "lucide-react";
import { useApp } from "../App";
import {
  formatSize,
  mergeFolderLists,
} from "../lib/api";
import { isRelinkMatchForPath, relinkReasonLabel } from "../lib/relink";
import { getPathLeafName, normalizePathSeparators } from "../lib/pathUtils";
import { MutationBlockedNotice } from "../components/MutationBlockedNotice";
import { ConfirmDialog } from "../components/Dialog";
import type {
  FileVerification,
  RelinkFileResult,
  SimilarFileCandidate,
  SongSummary,
} from "../types/database";

type RelinkItem = {
  verification: FileVerification;
  song: SongSummary | null;
};

type PendingRelink = {
  originalFilePath: string;
  newFilePath: string;
  candidate: SimilarFileCandidate | null;
};

function pathKey(path: string): string {
  return normalizePathSeparators(path).replace(/[\\]+$/g, "").toLocaleLowerCase();
}

function resultMessage(result: RelinkFileResult): string {
  if (result.message) return result.message;
  switch (result.status) {
    case "reference_collision": return "La ruta destino ya pertenece a otra entrada catalogada.";
    case "not_found": return "No se encontró la entrada con la ruta original.";
    case "failed_validation": return "La ruta destino no pasó la validación.";
    case "manual_review_required": return "La reconciliación requiere revisión manual.";
    default: return "No se pudo reconciliar la ruta.";
  }
}

/** Owner of single-item, explicitly confirmed path reconciliation. */
export function RelinkTracks() {
  const {
    vdjFolder,
    songs,
    clearUiError,
    reportUiError,
    reload,
    musicFolders,
    addMusicFolder,
    selectMusicFolder,
    mutationsBlocked,
    refreshRecovery,
    services,
    updateIntegrity,
    relinkTargetPath,
    clearRelinkTarget,
  } = useApp();
  const [results, setResults] = useState<FileVerification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [relocating, setRelocating] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(relinkTargetPath);
  const selectedPathRef = useRef<string | null>(relinkTargetPath);
  const autoSearchRef = useRef<string | null>(null);
  const [candidateMatch, setCandidateMatch] = useState<{
    originalFilePath: string;
    status: "completed" | "not_found" | "manual_review_required";
    candidates: SimilarFileCandidate[];
    message: string | null;
  } | null>(null);
  const [pending, setPending] = useState<PendingRelink | null>(null);

  const configuredSearchFolders = useMemo(() => mergeFolderLists(musicFolders), [musicFolders]);
  const songsByPath = useMemo(
    () => new Map(songs.map((song) => [pathKey(song.file_path), song])),
    [songs],
  );
  const relinkItems = useMemo<RelinkItem[]>(
    () => (results ?? [])
      .filter((entry) => !entry.exists)
      .map((verification) => ({
        verification,
        song: songsByPath.get(pathKey(verification.file_path)) ?? null,
      })),
    [results, songsByPath],
  );
  const selectedItem = useMemo(
    () => relinkItems.find((item) => pathKey(item.verification.file_path) === pathKey(selectedPath ?? "")) ?? null,
    [relinkItems, selectedPath],
  );
  const candidates = candidateMatch && selectedItem && isRelinkMatchForPath(candidateMatch, selectedItem.verification.file_path)
    ? candidateMatch.candidates
    : [];

  function selectPath(path: string | null) {
    selectedPathRef.current = path;
    setSelectedPath(path);
    setCandidateMatch(null);
    setPending(null);
  }

  async function runVerify() {
    if (!vdjFolder) return;
    setLoading(true);
    clearUiError();
    try {
      const verification = await services.verifyFiles(vdjFolder);
      setResults(verification);
      updateIntegrity({
        missing: verification.filter((entry) => !entry.exists).length,
        mismatched: verification.filter((entry) => entry.exists && !entry.size_match).length,
      });
      setSelectedPath((current) => (
        current && verification.some((entry) => !entry.exists && pathKey(entry.file_path) === pathKey(current))
          ? current
          : (verification.find((entry) => !entry.exists)?.file_path ?? null)
      ));
      const nextSelected = selectedPathRef.current && verification.some(
        (entry) => !entry.exists && pathKey(entry.file_path) === pathKey(selectedPathRef.current ?? ""),
      )
        ? selectedPathRef.current
        : (verification.find((entry) => !entry.exists)?.file_path ?? null);
      selectedPathRef.current = nextSelected;
      setCandidateMatch(null);
    } catch (error) {
      reportUiError("No se pudo verificar la biblioteca antes de reconciliar.", error);
    } finally {
      setLoading(false);
    }
  }

  async function searchCandidates(scanFolders: string[] = configuredSearchFolders) {
    if (!vdjFolder || !selectedItem) return;
    let roots = scanFolders;
    if (roots.length === 0) {
      const selected = await selectMusicFolder();
      if (!selected) return;
      addMusicFolder(selected);
      roots = [selected];
    }
    setSearching(true);
    clearUiError();
    const requestedPath = selectedItem.verification.file_path;
    try {
      const match = await services.findRelinkCandidates(vdjFolder, requestedPath, roots);
      if (!isRelinkMatchForPath(match, selectedPathRef.current)) return;
      setCandidateMatch(match);
      if (match.status !== "completed") {
        reportUiError("No se encontraron candidatos seguros.", match.message ?? "La referencia requiere revisión manual.");
      }
    } catch (error) {
      reportUiError("No se pudieron buscar candidatos de reconciliación.", error);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!relinkTargetPath || !selectedItem || searching) return;
    if (pathKey(selectedItem.verification.file_path) !== pathKey(relinkTargetPath)) return;
    if (autoSearchRef.current === pathKey(relinkTargetPath)) return;
    autoSearchRef.current = pathKey(relinkTargetPath);
    void searchCandidates().finally(clearRelinkTarget);
  }, [clearRelinkTarget, relinkTargetPath, searching, selectedItem]);

  function requestRelink(newFilePath: string, candidate: SimilarFileCandidate | null = null) {
    if (!selectedItem || mutationsBlocked) return;
    setPending({
      originalFilePath: selectedItem.verification.file_path,
      newFilePath,
      candidate,
    });
  }

  async function confirmRelink() {
    if (!vdjFolder || !pending || mutationsBlocked) return;
    setRelocating(true);
    try {
      const result = await services.relocateFile(vdjFolder, pending.originalFilePath, pending.newFilePath);
      if (result.status !== "completed") {
        reportUiError("No se pudo reconciliar la ruta.", resultMessage(result));
        setPending(null);
        return;
      }
      setPending(null);
      await runVerify();
      await reload();
    } catch (error) {
      reportUiError("No se pudo guardar la ruta reconciliada.", error);
      setPending(null);
    } finally {
      await refreshRecovery();
      setRelocating(false);
    }
  }

  async function manualRelocate() {
    if (!selectedItem) return;
    const file = await services.selectFile({
      title: `Elegir destino: ${getPathLeafName(selectedItem.verification.file_path)}`,
      extensions: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "aif", "opus", "mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"],
    });
    if (file) requestRelink(file);
  }

  useEffect(() => {
    if (!vdjFolder) {
      setResults(null);
      selectPath(null);
      return;
    }
    void runVerify();
  }, [vdjFolder]);

  const counts = {
    missing: relinkItems.length,
    candidates: candidates.length,
  };

  return (
    <div className="flex h-full min-h-0 gap-0">
      <aside className="flex w-80 shrink-0 flex-col border-r-2 border-border bg-surface">
        <div className="border-b-2 border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary-light" />
            <h2 className="text-sm font-bold text-text">Reconciliación de rutas</h2>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Revisa una entrada faltante, elige un candidato y confirma el cambio de ruta y tamaño físico.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b-2 border-border px-3 py-3">
          <div className="rounded-lg border border-border bg-background px-2.5 py-2 text-center">
            <div className="text-lg font-bold text-error">{counts.missing}</div>
            <div className="text-xs text-text-muted">Pendientes</div>
          </div>
          <div className="rounded-lg border border-border bg-background px-2.5 py-2 text-center">
            <div className="text-lg font-bold text-warning">{counts.candidates}</div>
            <div className="text-xs text-text-muted">Candidatos</div>
          </div>
        </div>

        <div className="flex gap-2 border-b-2 border-border px-3 py-3">
          <button type="button" onClick={() => void runVerify()} disabled={loading || !vdjFolder} className="btn btn-primary btn-sm flex-1">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Verificando..." : "Verificar"}
          </button>
          <button type="button" onClick={() => void searchCandidates()} disabled={searching || !selectedItem} className="btn btn-warning btn-sm flex-1">
            <Search className="h-3.5 w-3.5" />
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {relinkItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-[12px] text-text-muted">
              {results ? "No hay referencias faltantes." : "Verifica la Biblioteca VirtualDJ para comenzar."}
            </div>
          ) : (
            <div className="space-y-1.5">
              {relinkItems.map(({ verification, song }) => {
                const isSelected = selectedItem?.verification.file_path === verification.file_path;
                return (
                  <button
                    key={verification.file_path}
                    type="button"
                    onClick={() => selectPath(verification.file_path)}
                    className={`w-full rounded-lg border p-2.5 text-left transition-colors ${isSelected ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-surface-hover"}`}
                  >
                    <div className="truncate text-[12px] font-semibold text-text">{song?.title ?? verification.title ?? getPathLeafName(verification.file_path)}</div>
                    <div className="truncate text-xs text-text-secondary">{song?.author ?? verification.author ?? "Artista desconocido"}</div>
                    <div className="mt-1 truncate text-xs text-text-muted" title={verification.file_path}>{verification.file_path}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-auto p-4">
        <MutationBlockedNotice />
        {!selectedItem ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 text-center text-text-muted">
            Selecciona una entrada faltante para revisar candidatos.
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="card space-y-3 p-4">
              <div>
                <h3 className="text-lg font-bold text-text">{selectedItem.song?.title ?? selectedItem.verification.title ?? getPathLeafName(selectedItem.verification.file_path)}</h3>
                <p className="mt-1 text-sm text-text-secondary">{selectedItem.song?.author ?? selectedItem.verification.author ?? "Artista desconocido"}</p>
              </div>
              <div className="rounded-lg border border-error/30 bg-error/6 px-3 py-2.5 text-[12px] text-text" title={selectedItem.verification.file_path}>
                <div className="text-xs uppercase tracking-wide text-error">Ruta original faltante</div>
                <div className="mt-1 break-all">{selectedItem.verification.file_path}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-text-muted">Tamaño registrado</div>
                  <div className="mt-1 text-[12px] font-medium text-text">{formatSize(selectedItem.verification.expected_size)}</div>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-text-muted">Carpetas consultadas</div>
                  <div className="mt-1 text-[12px] font-medium text-text">{configuredSearchFolders.length}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void searchCandidates()} disabled={searching} className="btn btn-warning btn-sm">
                  <Search className="h-3.5 w-3.5" />
                  {searching ? "Buscando candidatos..." : "Buscar candidatos"}
                </button>
                <button type="button" onClick={() => void manualRelocate()} disabled={relocating || mutationsBlocked} className="btn btn-ghost btn-sm">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Elegir archivo manualmente
                </button>
              </div>
            </div>

            <div className="card space-y-3 p-4">
              <div>
                <h3 className="text-sm font-bold text-text">Candidatos del backend</h3>
                <p className="mt-1 text-xs text-text-muted">Ordenados por señales de nombre, extensión, tamaño y metadata. La app no recalcula ni reordena el score.</p>
              </div>
              {candidates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-[12px] text-text-muted">
                  Todavía no hay candidatos. Busca en las carpetas configuradas o elige un archivo manualmente.
                </div>
              ) : (
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <div key={candidate.path} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="break-all text-[13px] font-semibold text-text">{getPathLeafName(candidate.path)}</div>
                          <div className="mt-0.5 break-all text-xs text-text-secondary">{candidate.path}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="badge bg-primary/12 text-primary-light">score {candidate.score}</span>
                            {candidate.reasons.map((reason) => <span key={reason} className="badge bg-success/15 text-success">{relinkReasonLabel(reason)}</span>)}
                          </div>
                        </div>
                        <button type="button" onClick={() => requestRelink(candidate.path, candidate)} disabled={relocating || mutationsBlocked} className="btn btn-success btn-sm shrink-0">
                          Confirmar ruta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ConfirmDialog
              open={pending !== null}
              title="Confirmar reconciliación"
              description="Se actualizarán únicamente FilePath y FileSize de esta entrada. No se reinterpretará la metadata musical."
              confirmLabel="Confirmar y guardar"
              busy={relocating}
              onCancel={() => setPending(null)}
              onConfirm={confirmRelink}
            >
              {pending ? (
                <div className="space-y-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <div><span className="text-text-muted">Original: </span><span className="break-all text-text">{pending.originalFilePath}</span></div>
                  <div><span className="text-text-muted">Destino: </span><span className="break-all text-text">{pending.newFilePath}</span></div>
                </div>
              ) : null}
            </ConfirmDialog>
          </div>
        )}
      </section>
    </div>
  );
}
