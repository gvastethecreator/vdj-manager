import { useState, useCallback, useMemo } from "react";
import { useApp } from "../App";
import { getDirectory } from "../lib/api";
import { dedupeRemovalPaths, removalStatusLabel, summarizeRemoval } from "../lib/libraryRemoval";
import { moveStatusLabel, transferMethodLabel } from "../lib/moveReport";
import { SongMiniTable } from "../components/SongTable";
import { MutationBlockedNotice } from "../components/MutationBlockedNotice";
import { ConfirmDialog } from "../components/Dialog";
import type { DuplicateResult, DuplicateGroup, LibraryRemovalResult, MoveBatchReport } from "../types/database";

type DupTab = "by_name" | "by_size" | "by_hash";

type DeleteModal = { open: false } | { open: true; dbOnly: boolean };

/** Three-tab duplicate finder with selection, filters and bulk actions. */
export function Duplicates() {
    const { vdjFolder, reportUiError, reload, refreshRecovery, mutationsBlocked, services, updateIntegrity } = useApp();
    const [result, setResult] = useState<DuplicateResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<DupTab>("by_name");
    const [selected, setSelected] = useState<Set<number>>(new Set());
    // Filters
    const [filterLocation, setFilterLocation] = useState("");
    const [filterHotcues, setFilterHotcues] = useState(false);
    const [filterNoCues, setFilterNoCues] = useState(false);
    const [filterStems, setFilterStems] = useState(false);
    // Action state
    const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false });
    const [actionRunning, setActionRunning] = useState(false);
    const [removalResults, setRemovalResults] = useState<LibraryRemovalResult[]>([]);
    const [moveReport, setMoveReport] = useState<MoveBatchReport | null>(null);

    async function moveSelected() {
        if (mutationsBlocked) return;
        if (!vdjFolder || selected.size === 0) return;
        const folder = await services.selectDirectory({ purpose: "destination", title: "Mover archivos seleccionados a…" });
        if (!folder) return;
        setActionRunning(true);
        setRemovalResults([]);
        try {
            const report = await services.moveFilesOp(vdjFolder, selectedPaths, folder);
            setMoveReport(report);
            setSelected(new Set());
            if (report.summary.completed > 0) await reload();
            setLoading(true);
            const nextResult = await services.findDuplicates(vdjFolder);
            setResult(nextResult);
            updateIntegrity({ duplicateGroups: nextResult.by_name.length + nextResult.by_size.length + nextResult.by_hash.length });
        } catch (err) {
            reportUiError("No se pudieron mover los duplicados seleccionados.", err);
        } finally {
            await refreshRecovery();
            setLoading(false);
            setActionRunning(false);
        }
    }
    async function runScan() {
        if (!vdjFolder) return;
        setLoading(true);
        setResult(null);
        setSelected(new Set());
        setRemovalResults([]);
        setMoveReport(null);
        try {
            const r = await services.findDuplicates(vdjFolder);
            setResult(r);
            updateIntegrity({ duplicateGroups: r.by_name.length + r.by_size.length + r.by_hash.length });
        } catch (err) {
            reportUiError("No se pudo completar el análisis de duplicados.", err);
        } finally {
            setLoading(false);
        }
    }

    const toggleSelect = useCallback((index: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }, []);

    const tabs: { key: DupTab; label: string }[] = [
        { key: "by_name", label: "Por Nombre" },
        { key: "by_size", label: "Por Tamaño" },
        { key: "by_hash", label: "Por Hash (exactos)" },
    ];

    const groups = result ? result[tab] : [];

    const selectedPaths = useMemo(() => {
        if (!result || selected.size === 0) return [];
        const paths: string[] = [];
        for (const category of [result.by_name, result.by_size, result.by_hash]) {
            for (const group of category) {
                for (const song of group.songs) {
                    if (selected.has(song.index)) {
                        paths.push(song.file_path);
                    }
                }
            }
        }
        return dedupeRemovalPaths(paths);
    }, [result, selected]);

    const removalSummary = useMemo(
        () => summarizeRemoval(removalResults),
        [removalResults],
    );

    const allLocations = useMemo(() => {
        const locs = new Set<string>();
        for (const g of groups) {
            for (const s of g.songs) locs.add(getDirectory(s.file_path));
        }
        return Array.from(locs).sort();
    }, [groups]);

    const filteredGroups = useMemo(() => {
        return groups.map((g: DuplicateGroup) => {
            let songs = g.songs;
            if (filterLocation) songs = songs.filter((s) => getDirectory(s.file_path) === filterLocation);
            if (filterHotcues) songs = songs.filter((s) => s.cue_count > 0);
            if (filterNoCues) songs = songs.filter((s) => s.cue_count === 0);
            if (filterStems) songs = songs.filter((s) => s.has_stems);
            return { ...g, songs };
        }).filter((g: DuplicateGroup) => g.songs.length > 0);
    }, [groups, filterLocation, filterHotcues, filterNoCues, filterStems]);

    // ── Bulk selection helpers ──
    function selectByLocation(loc: string) {
        const next = new Set(selected);
        for (const g of filteredGroups)
            for (const s of g.songs)
                if (getDirectory(s.file_path) === loc) next.add(s.index);
        setSelected(next);
    }
    function selectWithHotcues() {
        const next = new Set(selected);
        for (const g of filteredGroups)
            for (const s of g.songs)
                if (s.cue_count > 0) next.add(s.index);
        setSelected(next);
    }
    function selectWithoutCues() {
        const next = new Set(selected);
        for (const g of filteredGroups)
            for (const s of g.songs)
                if (s.cue_count === 0) next.add(s.index);
        setSelected(next);
    }
    function selectWithStems() {
        const next = new Set(selected);
        for (const g of filteredGroups)
            for (const s of g.songs)
                if (s.has_stems) next.add(s.index);
        setSelected(next);
    }

    async function confirmDelete(deleteFiles: boolean) {
        if (mutationsBlocked) return;
        if (!vdjFolder || selectedPaths.length === 0) return;
        setActionRunning(true);
        setMoveReport(null);
        try {
            const outcomes = await services.removeLibraryEntries(
                vdjFolder,
                selectedPaths,
                deleteFiles ? "trash_then_unindex" : "db_only",
            );
            setRemovalResults(outcomes);
            setSelected(new Set());
            await reload();
            // Refresh duplicate groups without erasing the operation report.
            setLoading(true);
            const nextResult = await services.findDuplicates(vdjFolder);
            setResult(nextResult);
            updateIntegrity({ duplicateGroups: nextResult.by_name.length + nextResult.by_size.length + nextResult.by_hash.length });
        } catch (err) {
            reportUiError("No se pudieron eliminar las referencias seleccionadas.", err);
        } finally {
            await refreshRecovery();
            setLoading(false);
            setActionRunning(false);
            setDeleteModal({ open: false });
        }
    }

    return (
        <div className="space-y-3">
            <MutationBlockedNotice />
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text">Duplicados</h2>
                <button onClick={runScan} disabled={loading || !vdjFolder} className="btn btn-primary">
                    {loading ? "Analizando..." : "Buscar Duplicados"}
                </button>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <div className="spinner" />
                    Analizando la base de datos...
                </div>
            )}

            {!loading && result === null ? (
                <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
                    <h3 className="text-base font-semibold text-text">Todavía no se analizaron duplicados</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">El análisis compara nombre, tamaño y hash. Ningún resultado se interpreta como cero hasta ejecutar la búsqueda.</p>
                    <button type="button" onClick={() => void runScan()} disabled={!vdjFolder} className="btn btn-primary mt-4">Ejecutar análisis</button>
                </div>
            ) : null}

            {result && (
                <>
                    {/* Tabs */}
                    <div className="tab-group">
                        {tabs.map(({ key, label }) => (
                            <button key={key} onClick={() => setTab(key)}
                                className={`tab-item ${tab === key ? "tab-active" : ""}`}>
                                {label} ({result[key].length})
                            </button>
                        ))}
                    </div>

                    {/* Filters & selection */}
                    <div className="card flex flex-wrap items-center gap-2.5 p-2.5">
                        <span className="text-xs font-semibold text-text-muted">Filtrar:</span>
                        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                            <option value="">Todas las ubicaciones</option>
                            {allLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <input type="checkbox" checked={filterHotcues}
                                onChange={(e) => { setFilterHotcues(e.target.checked); if (e.target.checked) setFilterNoCues(false); }} />
                            Con hotcues
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <input type="checkbox" checked={filterNoCues}
                                onChange={(e) => { setFilterNoCues(e.target.checked); if (e.target.checked) setFilterHotcues(false); }} />
                            Sin hotcues
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <input type="checkbox" checked={filterStems}
                                onChange={(e) => setFilterStems(e.target.checked)} />
                            Con stems
                        </label>

                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-muted">Sel.:</span>
                            {filterLocation && (
                                <button onClick={() => selectByLocation(filterLocation)} className="btn btn-ghost btn-sm">
                                    En ubicación
                                </button>
                            )}
                            <button onClick={selectWithHotcues} className="btn btn-ghost btn-sm">Con cues</button>
                            <button onClick={selectWithoutCues} className="btn btn-ghost btn-sm">Sin cues</button>
                            <button onClick={selectWithStems} className="btn btn-ghost btn-sm">Con stems</button>
                            <button onClick={() => setSelected(new Set())} className="btn btn-danger btn-sm">
                                Limpiar ({selected.size})
                            </button>
                        </div>
                    </div>

                    {/* Actions panel */}
                    {selected.size > 0 && (
                        <div className="card flex flex-wrap items-center gap-3 border-warning/30 bg-warning/5 p-2.5">
                            <span className="text-[12px] font-semibold text-warning">
                                {selected.size} seleccionados
                            </span>
                            <button
                                onClick={moveSelected}
                                disabled={actionRunning || mutationsBlocked}
                                className="btn btn-ghost btn-sm"
                            >
                                Mover a directorio…
                            </button>
                            <button
                                onClick={() => setDeleteModal({ open: true, dbOnly: true })}
                                disabled={actionRunning || mutationsBlocked}
                                className="btn btn-ghost btn-sm"
                            >
                                Eliminar de la BD
                            </button>
                            <button
                                onClick={() => setDeleteModal({ open: true, dbOnly: false })}
                                disabled={actionRunning || mutationsBlocked}
                                className="btn btn-danger btn-sm"
                            >
                                Eliminar de BD + Papelera
                            </button>
                            {actionRunning && <span className="text-xs text-text-muted">Procesando...</span>}
                        </div>
                    )}

                    {moveReport && (
                        <div className="max-h-48 overflow-auto rounded-lg border border-border bg-surface p-2.5">
                            <div className="mb-2 text-xs font-semibold text-text">
                                Movimiento: {moveReport.summary.completed} completados · {moveReport.summary.blocked} bloqueados · {moveReport.summary.manualReview} revisión manual
                            </div>
                            {moveReport.items.map((item) => {
                                const method = transferMethodLabel(item.transferMethod);
                                return (
                                    <div key={`${item.originalFilePath}:${item.targetFilePath}`} className={`text-xs ${item.status === "db_committed" ? "text-success" : item.status === "manual_review_required" ? "text-error" : "text-warning"}`}>
                                        {moveStatusLabel(item.status)} · {item.originalFilePath} → {item.targetFilePath || "—"}{method ? ` · ${method}` : ""}{item.message ? ` — ${item.message}` : ""}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {removalResults.length > 0 && (
                        <div className="max-h-48 overflow-auto rounded-lg border border-border bg-surface p-2.5">
                            <div className="mb-2 text-xs font-semibold text-text">
                                Remoción: {removalSummary.completed} completadas · {removalSummary.attention} requieren atención
                            </div>
                            {removalResults.map((item) => (
                                <div
                                    key={`${item.mode}:${item.originalFilePath}`}
                                    className={`text-xs ${item.status === "completed" ? "text-success" : item.status === "trash_failed" ? "text-error" : "text-warning"}`}
                                >
                                    {item.mode === "db_only" ? "Sólo biblioteca" : "Papelera + biblioteca"} · {removalStatusLabel(item.status)} · {item.originalFilePath}{item.message ? ` — ${item.message}` : ""}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Groups */}
                    <div className="space-y-2.5">
                        {filteredGroups.length === 0 && (
                            <div className="card p-8 text-center text-sm text-text-muted">
                                No se encontraron duplicados en esta categoría
                            </div>
                        )}
                        {filteredGroups.map((group: DuplicateGroup, i: number) => (
                            <div key={i} className="card p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-warning">
                                        {group.songs.length} archivos — {group.key}
                                    </span>
                                </div>
                                <SongMiniTable
                                    songs={group.songs}
                                    selectable
                                    selected={selected}
                                    onToggle={toggleSelect}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}

            <ConfirmDialog
                open={deleteModal.open}
                title="Confirmar eliminación"
                description={deleteModal.open && deleteModal.dbOnly
                    ? `Se quitarán ${selectedPaths.length} canciones de database.xml. Los archivos físicos no serán afectados.`
                    : `Se enviarán ${selectedPaths.length} archivos a la papelera y también se quitarán de database.xml.`}
                confirmLabel={deleteModal.open && deleteModal.dbOnly ? "Eliminar de la biblioteca" : "Enviar a la papelera"}
                destructive
                busy={actionRunning}
                onCancel={() => setDeleteModal({ open: false })}
                onConfirm={() => confirmDelete(deleteModal.open && !deleteModal.dbOnly)}
            />
        </div>
    );
}
