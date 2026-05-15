import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Link2, Music, RefreshCw, Search, X } from "lucide-react";
import { useApp } from "../App";
import { SongDetailsCard } from "../components/SongDetailsCard";
import { findSimilarFiles, formatSize, mergeFolderLists, relocateFile, verifyFiles } from "../lib/api";
import { compareDriveAwarePaths } from "../lib/pathUtils";
import type { FileVerification, SimilarFileMatch, SongSummary } from "../types/database";

function getFileName(filePath: string): string {
    return filePath.split(/[/\\]/).pop() ?? filePath;
}

function getDirectory(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    parts.pop();
    return parts.join("\\");
}

function getStem(filePath: string): string {
    const fileName = getFileName(filePath);
    const dotIndex = fileName.lastIndexOf(".");
    return (dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName).toLowerCase();
}

function getExtension(filePath: string): string {
    const fileName = getFileName(filePath);
    const dotIndex = fileName.lastIndexOf(".");
    return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}

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

function scoreCandidate(missingPath: string, candidatePath: string) {
    const missingName = getFileName(missingPath).toLowerCase();
    const candidateName = getFileName(candidatePath).toLowerCase();
    const missingStem = getStem(missingPath);
    const candidateStem = getStem(candidatePath);
    const sameName = missingName === candidateName;
    const sameStem = missingStem === candidateStem;
    const similarStem = !sameStem && (candidateStem.includes(missingStem) || missingStem.includes(candidateStem));
    const sameExtension = getExtension(missingPath) === getExtension(candidatePath);

    const score =
        (sameName ? 300 : 0)
        + (sameStem ? 180 : 0)
        + (similarStem ? 90 : 0)
        + (sameExtension ? 25 : 0);

    const relation = sameName
        ? "Mismo nombre, otra ubicación"
        : sameStem
            ? "Mismo tema, nombre equivalente"
            : similarStem
                ? "Posible renombrado"
                : "Coincidencia aproximada";

    return { score, sameName, sameStem, similarStem, sameExtension, relation };
}

type RelinkItem = {
    verification: FileVerification;
    song: SongSummary | null;
    candidates: string[];
};

type MatchFilter = "all" | "withCandidates" | "unresolved" | "selected";

/** Dedicated workflow to repair database entries whose files were moved or renamed on disk. */
export function RelinkTracks() {
    const {
        vdjFolder,
        songs,
        setError,
        reload,
        musicFolders,
        addMusicFolder,
        removeMusicFolder,
        selectMusicFolder,
    } = useApp();

    const [results, setResults] = useState<FileVerification[] | null>(null);
    const [matches, setMatches] = useState<SimilarFileMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [relocating, setRelocating] = useState<string | null>(null);
    const [selectedMissingPath, setSelectedMissingPath] = useState<string | null>(null);
    const [selectedMissingPaths, setSelectedMissingPaths] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState("");
    const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");

    const configuredSearchFolders = useMemo(
        () => mergeFolderLists(musicFolders),
        [musicFolders],
    );

    const songsByPath = useMemo(
        () => new Map(songs.map((song) => [song.file_path.toLowerCase(), song])),
        [songs],
    );

    async function runVerify() {
        if (!vdjFolder) return null;
        setLoading(true);
        try {
            const verification = await verifyFiles(vdjFolder);
            setResults(verification);
            setMatches([]);
            return verification;
        } catch (err) {
            setError(String(err));
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function searchInFolders(scanFolders: string[]) {
        if (!vdjFolder || scanFolders.length === 0) return;

        let verification = results;
        if (!verification) {
            verification = await runVerify();
        }
        if (!verification) return;

        const missingPaths = verification.filter((entry) => !entry.exists).map((entry) => entry.file_path);
        if (missingPaths.length === 0) {
            setMatches([]);
            return;
        }

        setSearching(true);
        try {
            const foundLists = await Promise.all(
                scanFolders.map((scanFolder) => findSimilarFiles(vdjFolder, missingPaths, scanFolder)),
            );
            setMatches(mergeSimilarMatchLists(foundLists));
        } catch (err) {
            setError(String(err));
        } finally {
            setSearching(false);
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
        const scanFolder = await open({ directory: true, title: "Seleccionar carpeta para buscar tracks reubicados" });
        if (!scanFolder) return;

        addMusicFolder(scanFolder);
        await searchInFolders([scanFolder]);
    }

    async function handleRelocate(oldPath: string, newPath: string) {
        if (!vdjFolder) return;
        setRelocating(oldPath);
        try {
            await relocateFile(vdjFolder, oldPath, newPath);
            const verification = await verifyFiles(vdjFolder);
            setResults(verification);
            setMatches((prev) => prev.filter((entry) => entry.missing_path !== oldPath));
            await reload();
        } catch (err) {
            setError(String(err));
        } finally {
            setRelocating(null);
        }
    }

    async function handleBulkBestMatches() {
        if (!vdjFolder) return;
        const selectedItems = relinkItems.filter((item) => selectedMissingPaths.has(item.verification.file_path));
        const actionable = selectedItems.filter((item) => item.candidates[0]);

        if (actionable.length === 0) {
            setError("No hay tracks seleccionados con candidatos para corregir en lote.");
            return;
        }

        setRelocating("__bulk__");
        const relocatedPaths = new Set<string>();
        const errors: string[] = [];

        for (const item of actionable) {
            const newPath = item.candidates[0];
            try {
                await relocateFile(vdjFolder, item.verification.file_path, newPath);
                relocatedPaths.add(item.verification.file_path);
            } catch (err) {
                errors.push(`${getFileName(item.verification.file_path)}: ${String(err)}`);
            }
        }

        try {
            const verification = await verifyFiles(vdjFolder);
            setResults(verification);
            setMatches((prev) => prev.filter((entry) => !relocatedPaths.has(entry.missing_path)));
            setSelectedMissingPaths((prev) => {
                const next = new Set(prev);
                for (const path of relocatedPaths) next.delete(path);
                return next;
            });
            await reload();
        } catch (err) {
            errors.push(String(err));
        } finally {
            setRelocating(null);
        }

        if (errors.length > 0) {
            setError(`Algunas rutas no se pudieron corregir: ${errors.slice(0, 3).join(" | ")}${errors.length > 3 ? " ..." : ""}`);
        }
    }

    async function manualRelocate(oldPath: string) {
        const file = await open({
            title: `Corregir ruta: ${getFileName(oldPath)}`,
            filters: [{ name: "Audio/Video", extensions: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "aif", "opus", "mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"] }],
        });

        if (file) {
            await handleRelocate(oldPath, file);
        }
    }

    useEffect(() => {
        if (!vdjFolder) {
            setResults(null);
            setMatches([]);
            setSelectedMissingPath(null);
            return;
        }

        void runVerify();
    }, [vdjFolder]);

    const relinkItems = useMemo<RelinkItem[]>(() => {
        if (!results) return [];

        const matchMap = new Map<string, string[]>();
        for (const match of matches) {
            const sortedCandidates = [...match.candidates].sort((a, b) => {
                const scoreA = scoreCandidate(match.missing_path, a);
                const scoreB = scoreCandidate(match.missing_path, b);
                return scoreB.score - scoreA.score || a.localeCompare(b);
            });
            matchMap.set(match.missing_path, sortedCandidates);
        }

        return results
            .filter((entry) => !entry.exists)
            .map((verification) => ({
                verification,
                song: songsByPath.get(verification.file_path.toLowerCase()) ?? null,
                candidates: matchMap.get(verification.file_path) ?? [],
            }))
            .sort((a, b) => compareDriveAwarePaths(a.verification.file_path, b.verification.file_path));
    }, [matches, results, songsByPath]);

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return relinkItems.filter(({ verification, song, candidates }) => {
            if (matchFilter === "withCandidates" && candidates.length === 0) return false;
            if (matchFilter === "unresolved" && candidates.length > 0) return false;
            if (matchFilter === "selected" && !selectedMissingPaths.has(verification.file_path)) return false;
            if (!normalizedQuery) return true;

            const haystack = [
                verification.file_path,
                verification.title,
                verification.author,
                song?.album,
                ...candidates,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [query, relinkItems, matchFilter, selectedMissingPaths]);

    useEffect(() => {
        const available = new Set(relinkItems.map((item) => item.verification.file_path));
        setSelectedMissingPaths((prev) => {
            const next = new Set([...prev].filter((path) => available.has(path)));
            return next.size === prev.size ? prev : next;
        });
    }, [relinkItems]);

    useEffect(() => {
        setSelectedMissingPath((prev) => (
            prev && filteredItems.some((item) => item.verification.file_path === prev)
                ? prev
                : (filteredItems[0]?.verification.file_path ?? null)
        ));
    }, [filteredItems]);

    const selectedItem = useMemo(
        () => filteredItems.find((item) => item.verification.file_path === selectedMissingPath) ?? null,
        [filteredItems, selectedMissingPath],
    );

    const counts = useMemo(() => ({
        missing: relinkItems.length,
        withCandidates: relinkItems.filter((item) => item.candidates.length > 0).length,
        unresolved: relinkItems.filter((item) => item.candidates.length === 0).length,
        selected: selectedMissingPaths.size,
    }), [relinkItems, selectedMissingPaths.size]);

    function toggleSelected(path: string) {
        setSelectedMissingPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    }

    function selectVisibleItems() {
        setSelectedMissingPaths((prev) => {
            const next = new Set(prev);
            for (const item of filteredItems) next.add(item.verification.file_path);
            return next;
        });
    }

    return (
        <div className="flex h-full gap-0">
            <aside className="flex w-80 shrink-0 flex-col border-r-2 border-border bg-surface">
                <div className="border-b-2 border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary-light" />
                        <h2 className="text-sm font-bold text-text">Tracks movidos o renombrados</h2>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted">
                        Detecta entradas rotas en `database.xml` y corrige su ruta cuando el archivo fue movido o cambió de nombre.
                    </p>
                </div>

                <div className="space-y-2 border-b-2 border-border px-3 py-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-border bg-background px-2.5 py-2 text-center">
                            <div className="text-lg font-bold text-error">{counts.missing}</div>
                            <div className="text-[10px] text-text-muted">Pendientes</div>
                        </div>
                        <div className="rounded-lg border border-border bg-background px-2.5 py-2 text-center">
                            <div className="text-lg font-bold text-warning">{counts.withCandidates}</div>
                            <div className="text-[10px] text-text-muted">Con candidato</div>
                        </div>
                        <div className="rounded-lg border border-border bg-background px-2.5 py-2 text-center">
                            <div className="text-lg font-bold text-text">{counts.unresolved}</div>
                            <div className="text-[10px] text-text-muted">Sin detectar</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => void runVerify()} disabled={loading || !vdjFolder} className="btn btn-primary btn-sm flex-1">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            {loading ? "Verificando..." : "Verificar"}
                        </button>
                        <button onClick={searchConfiguredFolders} disabled={searching || !vdjFolder} className="btn btn-warning btn-sm flex-1">
                            <Search className="h-3.5 w-3.5" />
                            {searching ? "Buscando..." : "Buscar"}
                        </button>
                    </div>

                    <button onClick={searchManualFolder} disabled={searching || !vdjFolder} className="btn btn-ghost btn-sm w-full">
                        <FolderOpen className="h-3.5 w-3.5" />
                        Explorar carpeta manualmente
                    </button>

                    <div className="grid grid-cols-4 gap-1">
                        {(
                            [
                                ["all", "Todos", counts.missing],
                                ["withCandidates", "Match", counts.withCandidates],
                                ["unresolved", "Sin", counts.unresolved],
                                ["selected", "Sel.", counts.selected],
                            ] as const
                        ).map(([key, label, count]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setMatchFilter(key)}
                                className={`rounded border px-1.5 py-1 text-[10px] font-semibold transition-colors ${matchFilter === key
                                    ? "border-primary bg-primary/12 text-primary-light"
                                    : "border-border bg-background text-text-muted hover:bg-surface-hover"
                                    }`}
                            >
                                {label} <span className="tabular-nums">{count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1.5">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filtrar por archivo, artista o candidato..."
                            className="input min-w-0 flex-1"
                        />
                        <button type="button" onClick={() => setQuery("")} className="btn btn-ghost btn-sm" disabled={!query}>
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                        <button type="button" onClick={selectVisibleItems} disabled={filteredItems.length === 0} className="btn btn-ghost btn-sm">
                            Seleccionar visibles
                        </button>
                        <button type="button" onClick={() => setSelectedMissingPaths(new Set())} disabled={selectedMissingPaths.size === 0} className="btn btn-ghost btn-sm">
                            Limpiar
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleBulkBestMatches()}
                            disabled={selectedMissingPaths.size === 0 || relocating === "__bulk__"}
                            className="btn btn-success btn-sm"
                        >
                            {relocating === "__bulk__" ? "Corrigiendo..." : "Auto lote"}
                        </button>
                    </div>
                </div>

                <div className="border-b-2 border-border px-3 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xs font-bold text-text">Carpetas musicales</h3>
                            <p className="mt-0.5 text-[10px] text-text-muted">Se usan para encontrar tracks reubicados automáticamente.</p>
                        </div>
                        <button onClick={selectMusicFolder} className="btn btn-ghost btn-sm shrink-0">
                            <Music className="h-3.5 w-3.5" />
                            Agregar
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
                                    <span className="min-w-0 flex-1 truncate text-[11px] text-text" title={folder}>{folder}</span>
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

                <div className="min-h-0 flex-1 overflow-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="rounded-[5px] border border-dashed border-border/70 bg-surface-hover/30 px-3 py-8 text-center text-[12px] text-text-muted">
                            {results ? "No hay tracks pendientes en esta búsqueda." : "Verifica la base para comenzar."}
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filteredItems.map((item) => {
                                const isSelected = item.verification.file_path === selectedMissingPath;
                                const isChecked = selectedMissingPaths.has(item.verification.file_path);
                                const title = item.song?.title ?? item.verification.title ?? getFileName(item.verification.file_path);
                                const artist = item.song?.author ?? item.verification.author ?? "Artista desconocido";
                                return (
                                    <button
                                        key={item.verification.file_path}
                                        type="button"
                                        onClick={() => setSelectedMissingPath(item.verification.file_path)}
                                        className={`w-full rounded-lg border p-2.5 text-left transition-colors ${isSelected
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-background hover:bg-surface-hover"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    toggleSelected(item.verification.file_path);
                                                }}
                                                onClick={(event) => event.stopPropagation()}
                                                className="mt-0.5 accent-primary"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-[12px] font-semibold text-text">{title}</div>
                                                <div className="truncate text-[11px] text-text-secondary">{artist}</div>
                                                <div className="mt-1 truncate text-[10px] text-text-muted" title={item.verification.file_path}>
                                                    {getFileName(item.verification.file_path)}
                                                </div>
                                            </div>
                                            <span className={`badge ${item.candidates.length > 0 ? "bg-warning/15 text-warning" : "bg-error/15 text-error"}`}>
                                                {item.candidates.length > 0 ? `${item.candidates.length} cand.` : "sin match"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>

            <section className="min-w-0 flex-1 overflow-auto p-4">
                {!selectedItem ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 text-center text-text-muted">
                        Selecciona un track faltante para revisar candidatos y corregir su ruta.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {selectedItem.song ? (
                            <SongDetailsCard song={selectedItem.song} />
                        ) : (
                            <div className="card p-4">
                                <h3 className="text-lg font-bold text-text">{selectedItem.verification.title ?? getFileName(selectedItem.verification.file_path)}</h3>
                                <p className="mt-1 text-sm text-text-secondary">{selectedItem.verification.author ?? "Artista desconocido"}</p>
                            </div>
                        )}

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                            <div className="card space-y-3 p-4">
                                <div>
                                    <h3 className="text-sm font-bold text-text">Ruta registrada en la base</h3>
                                    <p className="mt-1 text-[11px] text-text-muted">
                                        Esta es la ubicación guardada actualmente en `database.xml` y ya no existe en disco.
                                    </p>
                                </div>

                                <div className="rounded-[5px] border border-error/30 bg-error/6 px-3 py-2.5 text-[12px] text-text" title={selectedItem.verification.file_path}>
                                    {selectedItem.verification.file_path}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                                        <div className="text-[10px] uppercase tracking-wide text-text-muted">Archivo esperado</div>
                                        <div className="mt-1 truncate text-[12px] font-medium text-text">{getFileName(selectedItem.verification.file_path)}</div>
                                    </div>
                                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                                        <div className="text-[10px] uppercase tracking-wide text-text-muted">Tamaño registrado</div>
                                        <div className="mt-1 text-[12px] font-medium text-text">{formatSize(selectedItem.verification.expected_size)}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => void searchConfiguredFolders()}
                                        disabled={searching}
                                        className="btn btn-warning btn-sm"
                                    >
                                        <Search className="h-3.5 w-3.5" />
                                        {searching ? "Buscando..." : "Buscar coincidencias"}
                                    </button>
                                    <button
                                        onClick={() => void manualRelocate(selectedItem.verification.file_path)}
                                        disabled={relocating === selectedItem.verification.file_path}
                                        className="btn btn-ghost btn-sm"
                                    >
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        Elegir archivo manualmente
                                    </button>
                                </div>
                            </div>

                            <div className="card space-y-3 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-text">Coincidencias sugeridas</h3>
                                        <p className="mt-1 text-[11px] text-text-muted">
                                            Se priorizan coincidencias por nombre/stem, tamaño real del archivo y señales de metadata (título/artista) dentro de tus carpetas musicales.
                                        </p>
                                    </div>
                                    {selectedItem.candidates[0] && (
                                        <button
                                            onClick={() => void handleRelocate(selectedItem.verification.file_path, selectedItem.candidates[0])}
                                            disabled={relocating === selectedItem.verification.file_path}
                                            className="btn btn-success btn-sm shrink-0"
                                        >
                                            {relocating === selectedItem.verification.file_path ? "Corrigiendo..." : "Usar mejor match"}
                                        </button>
                                    )}
                                </div>

                                {selectedItem.candidates.length === 0 ? (
                                    <div className="rounded-[5px] border border-dashed border-border/70 bg-surface-hover/30 px-3 py-6 text-center text-[12px] text-text-muted">
                                        No se encontraron coincidencias todavía. Prueba otra carpeta o corrige la ruta manualmente.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedItem.candidates.map((candidatePath) => {
                                            const candidateInfo = scoreCandidate(selectedItem.verification.file_path, candidatePath);
                                            return (
                                                <div key={candidatePath} className="rounded-lg border border-border bg-background p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-[13px] font-semibold text-text" title={candidatePath}>
                                                                {getFileName(candidatePath)}
                                                            </div>
                                                            <div className="mt-0.5 truncate text-[11px] text-text-secondary" title={candidatePath}>
                                                                {getDirectory(candidatePath)}
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                <span className="badge bg-primary/12 text-primary-light">{candidateInfo.relation}</span>
                                                                {candidateInfo.sameName && <span className="badge bg-success/15 text-success">mismo nombre</span>}
                                                                {!candidateInfo.sameName && candidateInfo.sameStem && <span className="badge bg-success/15 text-success">mismo stem</span>}
                                                                {candidateInfo.sameExtension && <span className="badge bg-warning/15 text-warning">misma extensión</span>}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => void handleRelocate(selectedItem.verification.file_path, candidatePath)}
                                                            disabled={relocating === selectedItem.verification.file_path}
                                                            className="btn btn-success btn-sm shrink-0"
                                                        >
                                                            Corregir ruta
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
