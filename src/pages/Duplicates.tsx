import { useState, useCallback, useMemo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useApp } from "../App";
import { findDuplicates, getDirectory, deleteSongs, moveFilesOp } from "../lib/api";
import { SongMiniTable } from "../components/SongTable";
import type { DuplicateResult, DuplicateGroup } from "../types/database";

type DupTab = "by_name" | "by_size" | "by_hash";

type DeleteModal = { open: false } | { open: true; dbOnly: boolean };

/** Three-tab duplicate finder with selection, filters and bulk actions. */
export function Duplicates() {
    const { vdjFolder, setError, reload } = useApp();
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
    const [actionLog, setActionLog] = useState<string[]>([]);

    async function moveSelected() {
        if (!vdjFolder || selected.size === 0) return;
        const folder = await open({ directory: true, title: "Mover archivos seleccionados a…" });
        if (!folder) return;
        setActionRunning(true);
        setActionLog([]);
        try {
            const log = await moveFilesOp(vdjFolder, Array.from(selected), folder);
            setActionLog(log);
            setSelected(new Set());
            await reload();
            await runScan();
        } catch (err) {
            setError(String(err));
        } finally {
            setActionRunning(false);
        }
    }
    async function runScan() {
        if (!vdjFolder) return;
        setLoading(true);
        setResult(null);
        setSelected(new Set());
        setActionLog([]);
        try {
            const r = await findDuplicates(vdjFolder);
            setResult(r);
        } catch (err) {
            setError(String(err));
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
        if (!vdjFolder || selected.size === 0) return;
        setDeleteModal({ open: false });
        setActionRunning(true);
        setActionLog([]);
        try {
            const log = await deleteSongs(vdjFolder, Array.from(selected), deleteFiles);
            setActionLog(log);
            setSelected(new Set());
            await reload();
            // Re-scan to refresh duplicates
            await runScan();
        } catch (err) {
            setError(String(err));
        } finally {
            setActionRunning(false);
        }
    }

    return (
        <div className="space-y-3">
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
                        <span className="text-[11px] font-semibold text-text-muted">Filtrar:</span>
                        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                            <option value="">Todas las ubicaciones</option>
                            {allLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <label className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                            <input type="checkbox" checked={filterHotcues}
                                onChange={(e) => { setFilterHotcues(e.target.checked); if (e.target.checked) setFilterNoCues(false); }} />
                            Con hotcues
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                            <input type="checkbox" checked={filterNoCues}
                                onChange={(e) => { setFilterNoCues(e.target.checked); if (e.target.checked) setFilterHotcues(false); }} />
                            Sin hotcues
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                            <input type="checkbox" checked={filterStems}
                                onChange={(e) => setFilterStems(e.target.checked)} />
                            Con stems
                        </label>

                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-text-muted">Sel.:</span>
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
                                disabled={actionRunning}
                                className="btn btn-ghost btn-sm"
                            >
                                Mover a directorio…
                            </button>
                            <button
                                onClick={() => setDeleteModal({ open: true, dbOnly: true })}
                                disabled={actionRunning}
                                className="btn btn-ghost btn-sm"
                            >
                                Eliminar de la BD
                            </button>
                            <button
                                onClick={() => setDeleteModal({ open: true, dbOnly: false })}
                                disabled={actionRunning}
                                className="btn btn-danger btn-sm"
                            >
                                Eliminar de BD + Papelera
                            </button>
                            {actionRunning && <span className="text-[11px] text-text-muted">Procesando...</span>}
                        </div>
                    )}

                    {/* Action log */}
                    {actionLog.length > 0 && (
                        <div className="max-h-40 overflow-auto rounded-lg border border-border bg-surface p-2.5">
                            {actionLog.map((line, i) => (
                                <div key={i} className={`text-[11px] ${line.startsWith("✓") ? "text-success" : line.startsWith("⚠") ? "text-warning" : "text-text-secondary"}`}>
                                    {line}
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

            {/* Delete confirmation modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="card w-105 p-5 shadow-xl space-y-3">
                        <h3 className="text-base font-bold text-text">Confirmar eliminación</h3>
                        <p className="text-sm text-text-secondary">
                            {deleteModal.dbOnly
                                ? <>Eliminar <strong>{selected.size}</strong> canciones de la base de datos.<br />Los archivos físicos <strong>no</strong> serán afectados.</>
                                : <>Enviar <strong>{selected.size}</strong> archivos a la papelera del sistema<br />y eliminarlos de la base de datos.</>
                            }
                        </p>
                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setDeleteModal({ open: false })} className="btn btn-ghost">
                                Cancelar
                            </button>
                            <button
                                onClick={() => confirmDelete(!deleteModal.dbOnly)}
                                className="btn btn-danger"
                            >
                                {deleteModal.dbOnly ? "Eliminar de BD" : "Enviar a Papelera"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
