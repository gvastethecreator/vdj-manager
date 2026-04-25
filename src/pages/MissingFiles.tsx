import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Music, X } from "lucide-react";
import { useApp } from "../App";
import { verifyFiles, findSimilarFiles, relocateFile, mergeFolderLists } from "../lib/api";
import { formatSize } from "../lib/api";
import type { FileVerification, SimilarFileMatch } from "../types/database";

function mergeSimilarMatchLists(matchLists: SimilarFileMatch[][]): SimilarFileMatch[] {
    const merged = new Map<string, Map<string, string>>();

    for (const matchList of matchLists) {
        for (const match of matchList) {
            let candidateMap = merged.get(match.missing_path);
            if (!candidateMap) {
                candidateMap = new Map<string, string>();
                merged.set(match.missing_path, candidateMap);
            }

            for (const candidate of match.candidates) {
                candidateMap.set(candidate.toLowerCase(), candidate);
            }
        }
    }

    return Array.from(merged.entries())
        .map(([missing_path, candidates]) => ({
            missing_path,
            candidates: Array.from(candidates.values()).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.missing_path.localeCompare(b.missing_path));
}

/** File verification page: checks existence/size and supports relocating missing files. */
export function MissingFiles() {
    const {
        vdjFolder,
        setError,
        reload,
        musicFolders,
        addMusicFolder,
        removeMusicFolder,
        selectMusicFolder,
    } = useApp();
    const [results, setResults] = useState<FileVerification[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<"all" | "missing" | "mismatch" | "ok">("missing");
    // Relocate state
    const [searchingFolder, setSearchingFolder] = useState(false);
    const [matches, setMatches] = useState<SimilarFileMatch[]>([]);
    const [relocating, setRelocating] = useState<string | null>(null);

    const configuredSearchFolders = useMemo(
        () => mergeFolderLists(musicFolders),
        [musicFolders],
    );

    async function runVerify() {
        if (!vdjFolder) return;
        setLoading(true);
        setResults(null);
        setMatches([]);
        try {
            const r = await verifyFiles(vdjFolder);
            setResults(r);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }

    async function searchInFolders(scanFolders: string[]) {
        if (!vdjFolder || !results || scanFolders.length === 0) return;
        setSearchingFolder(true);
        try {
            const missingPaths = results.filter((r) => !r.exists).map((r) => r.file_path);
            const foundLists = await Promise.all(
                scanFolders.map((scanFolder) => findSimilarFiles(vdjFolder, missingPaths, scanFolder)),
            );
            setMatches(mergeSimilarMatchLists(foundLists));
        } catch (err) {
            setError(String(err));
        } finally {
            setSearchingFolder(false);
        }
    }

    async function searchConfiguredFolders() {
        let scanFolders = configuredSearchFolders;
        if (scanFolders.length === 0) {
            const selected = await selectMusicFolder();
            if (!selected) return;
            scanFolders = [selected];
        }

        await searchInFolders(scanFolders);
    }

    async function searchManualFolder() {
        const scanFolder = await open({ directory: true, title: "Seleccionar carpeta para buscar archivos" });
        if (!scanFolder) return;

        addMusicFolder(scanFolder);
        await searchInFolders([scanFolder]);
    }

    async function handleRelocate(oldPath: string, newPath: string) {
        if (!vdjFolder) return;
        setRelocating(oldPath);
        try {
            await relocateFile(vdjFolder, oldPath, newPath);
            // Re-verify after relocation
            const r = await verifyFiles(vdjFolder);
            setResults(r);
            // Remove from matches
            setMatches((prev) => prev.filter((m) => m.missing_path !== oldPath));
            await reload();
        } catch (err) {
            setError(String(err));
        } finally {
            setRelocating(null);
        }
    }

    async function manualRelocate(oldPath: string) {
        const file = await open({
            title: `Reubicar: ${oldPath.split("\\").pop()}`,
            filters: [{ name: "Audio/Video", extensions: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "mp4", "avi", "mkv", "mov"] }],
        });
        if (file) {
            await handleRelocate(oldPath, file);
        }
    }

    const filtered = results?.filter((r) => {
        if (filter === "missing") return !r.exists;
        if (filter === "mismatch") return r.exists && !r.size_match;
        if (filter === "ok") return r.exists && r.size_match;
        return true;
    });

    const counts = results
        ? {
            all: results.length,
            missing: results.filter((r) => !r.exists).length,
            mismatch: results.filter((r) => r.exists && !r.size_match).length,
            ok: results.filter((r) => r.exists && r.size_match).length,
        }
        : null;

    // Build lookup for matches
    const matchMap = new Map<string, string[]>();
    for (const m of matches) {
        matchMap.set(m.missing_path, m.candidates);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text">Verificación de Archivos</h2>
                <div className="flex gap-2">
                    {counts && counts.missing > 0 && (
                        <>
                            <button
                                onClick={searchConfiguredFolders}
                                disabled={searchingFolder}
                                className="btn btn-warning"
                            >
                                {searchingFolder ? "Buscando..." : "Buscar en carpetas configuradas"}
                            </button>
                            <button
                                onClick={searchManualFolder}
                                disabled={searchingFolder}
                                className="btn btn-ghost"
                            >
                                Explorar carpeta...
                            </button>
                        </>
                    )}
                    <button
                        onClick={runVerify}
                        disabled={loading || !vdjFolder}
                        className="btn btn-primary"
                    >
                        {loading ? "Verificando..." : "Verificar Archivos"}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <div className="spinner" />
                    Verificando archivos en disco...
                </div>
            )}

            {counts && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3">
                        {(
                            [
                                { key: "all", label: "Total", color: "text-text" },
                                { key: "ok", label: "OK", color: "text-success" },
                                { key: "missing", label: "Faltantes", color: "text-error" },
                                { key: "mismatch", label: "Tamaño diferente", color: "text-warning" },
                            ] as const
                        ).map(({ key, label, color }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`rounded-lg border p-3 text-center transition-colors ${filter === key
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-surface hover:bg-surface-hover"
                                    }`}
                            >
                                <div className={`text-xl font-bold ${color}`}>{counts[key]}</div>
                                <div className="text-xs text-text-muted">{label}</div>
                            </button>
                        ))}
                    </div>

                    <div className="card mt-3 space-y-2.5 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xs font-bold text-text">Carpetas musicales configuradas</h3>
                                <p className="mt-1 text-[11px] text-text-muted">
                                    Se usan para localizar archivos faltantes sin tener que elegir siempre la misma ruta.
                                </p>
                            </div>
                            <button onClick={selectMusicFolder} className="btn btn-ghost btn-sm">
                                <Music className="h-4 w-4" />
                                Agregar carpeta
                            </button>
                        </div>

                        {configuredSearchFolders.length === 0 ? (
                            <div className="rounded-[5px] border border-dashed border-border/70 bg-surface-hover/30 px-3 py-2 text-[11px] text-text-muted">
                                No hay carpetas configuradas todavía.
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {configuredSearchFolders.map((folder) => (
                                    <div key={folder} className="flex items-center gap-2 rounded-[5px] border border-border/70 bg-surface-hover/35 px-2.5 py-2">
                                        <Music className="h-3.5 w-3.5 shrink-0 text-primary-light" />
                                        <span className="min-w-0 flex-1 truncate text-[11px] text-text" title={folder}>
                                            {folder}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeMusicFolder(folder)}
                                            className="btn btn-ghost btn-sm shrink-0"
                                            title="Quitar carpeta"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Similar file matches */}
                    {matches.length > 0 && (
                        <div className="card border-warning/30 bg-warning/5 p-3 space-y-2.5">
                            <h3 className="text-xs font-bold text-warning">
                                Archivos similares encontrados ({matches.length})
                            </h3>
                            <div className="max-h-64 overflow-auto space-y-1.5">
                                {matches.map((m) => (
                                    <div key={m.missing_path} className="card p-2.5">
                                        <div className="mb-1 text-[11px] text-error truncate" title={m.missing_path}>
                                            Falta: {m.missing_path.split("\\").pop()}
                                        </div>
                                        <div className="space-y-1">
                                            {m.candidates.map((c) => (
                                                <div key={c} className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-[11px] text-text-secondary" title={c}>
                                                        {c}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRelocate(m.missing_path, c)}
                                                        disabled={relocating === m.missing_path}
                                                        className="btn btn-success btn-sm"
                                                    >
                                                        {relocating === m.missing_path ? "..." : "Usar este"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results table */}
                    <div className="max-h-[calc(100vh-300px)] overflow-auto rounded-[5px] border-2 border-border">
                        <table className="w-full text-[13px]">
                            <thead className="sticky top-0 bg-surface-hover">
                                <tr>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Estado</th>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Archivo</th>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Título</th>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Artista</th>
                                    <th className="px-2.5 py-1.5 text-right text-[11px] font-medium text-text-muted">Esperado</th>
                                    <th className="px-2.5 py-1.5 text-right text-[11px] font-medium text-text-muted">Real</th>
                                    <th className="px-2.5 py-1.5 text-center text-[11px] font-medium text-text-muted">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered?.map((r, i) => {
                                    const candidates = matchMap.get(r.file_path);
                                    return (
                                        <tr key={i} className="border-t-2 border-border/40 hover:bg-surface-hover">
                                            <td className="px-2.5 py-1">
                                                {!r.exists ? (
                                                    <span className="badge bg-error/15 text-error">Falta</span>
                                                ) : !r.size_match ? (
                                                    <span className="badge bg-warning/15 text-warning">Diferente</span>
                                                ) : (
                                                    <span className="badge bg-success/15 text-success">OK</span>
                                                )}
                                            </td>
                                            <td className="max-w-xs truncate px-2.5 py-1 text-text" title={r.file_path}>
                                                {r.file_path.split("\\").pop()}
                                            </td>
                                            <td className="max-w-37.5 truncate px-2.5 py-1">{r.title ?? "—"}</td>
                                            <td className="max-w-30 truncate px-2.5 py-1">{r.author ?? "—"}</td>
                                            <td className="px-2.5 py-1 text-right tabular-nums">{formatSize(r.expected_size)}</td>
                                            <td className="px-2.5 py-1 text-right tabular-nums">{formatSize(r.actual_size)}</td>
                                            <td className="px-2.5 py-1 text-center">
                                                {!r.exists && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        {candidates && candidates.length > 0 ? (
                                                            <button
                                                                onClick={() => handleRelocate(r.file_path, candidates[0])}
                                                                disabled={relocating === r.file_path}
                                                                className="btn btn-success btn-sm"
                                                                title={`Reubicar a: ${candidates[0]}`}
                                                            >
                                                                Auto
                                                            </button>
                                                        ) : null}
                                                        <button
                                                            onClick={() => manualRelocate(r.file_path)}
                                                            className="btn btn-ghost btn-sm"
                                                        >
                                                            Manual
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered?.length === 0 && (
                            <div className="py-8 text-center text-text-muted">
                                No hay resultados en esta categoría
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
