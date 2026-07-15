import { useState, useCallback, useMemo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useApp } from "../App";
import { SongTable } from "../components/SongTable";
import { FolderTree } from "../components/FolderTree";
import {
    moveFilesOp, renameFileOp, saveSongUpdates,
    planMoveFiles, getConfiguredMusicRoots,
} from "../lib/api";
import { moveStatusLabel, transferMethodLabel } from "../lib/moveReport";
import type { DryRunResult, MoveBatchReport, RenameFileResult, SongUpdate } from "../types/database";

type BatchAction = "move" | "rename" | "tag";

/** Batch operations page: move, rename, and tag-edit selected songs. */
export function BatchOperations() {
    const { songs, vdjFolder, setError, reload, musicFolders, addMusicFolder, selectMusicFolder } = useApp();
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [action, setAction] = useState<BatchAction>("move");
    const [targetFolder, setTargetFolder] = useState("");
    const [renameFileName, setRenameFileName] = useState("");
    const [tagForm, setTagForm] = useState({
        title: "", author: "", album: "", genre: "", year: "",
        remix: "", remixer: "", composer: "", label: "", trackNumber: "",
        grouping: "", bpm: "", key: "", stars: "", color: "",
        gain: "", user1: "", user2: "", commentText: "",
    });
    const setTag = (field: keyof typeof tagForm, value: string) =>
        setTagForm((prev) => ({ ...prev, [field]: value }));
    const running_tag_fields = Object.entries(tagForm).filter(([, v]) => v !== "");
    const [running, setRunning] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [dryResult, setDryResult] = useState<DryRunResult | null>(null);
    const [moveReport, setMoveReport] = useState<MoveBatchReport | null>(null);

    // Derive tree roots from actual music paths; fall back to VDJ folder
    const treeRoots = useMemo(
        () => getConfiguredMusicRoots(songs, vdjFolder, musicFolders),
        [songs, vdjFolder, musicFolders],
    );

    const toggleSelect = useCallback((index: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }, []);
    const selectAll = useCallback(() => setSelected(new Set(songs.map((s) => s.index))), [songs]);
    const deselectAll = useCallback(() => setSelected(new Set()), []);
    const selectedPaths = useMemo(
        () => songs.filter((song) => selected.has(song.index)).map((song) => song.file_path),
        [selected, songs],
    );

    async function pickTarget() {
        const folder = await open({ directory: true, title: "Seleccionar carpeta destino" });
        if (folder) {
            setTargetFolder(folder);
            addMusicFolder(folder);
        }
    }

    async function pickTreeRoot() {
        await selectMusicFolder();
    }

    async function runDryRun() {
        if (!vdjFolder || selected.size === 0) return;
        const indices = Array.from(selected);
        try {
            if (action === "move" && targetFolder) {
                setMoveReport(await planMoveFiles(vdjFolder, selectedPaths, targetFolder));
                setDryResult(null);
                return;
            }
            let result: DryRunResult;
            if (action === "move") {
                return;
            } else if (action === "rename") {
                if (selected.size !== 1 || renameFileName.length === 0) return;
                const song = songs.find((item) => item.index === indices[0]);
                if (!song) return;
                result = {
                    description: "Renombrar un archivo con el nombre literal indicado",
                    affected_count: 1,
                    details: [`${song.file_name} → ${renameFileName}`],
                };
            } else {
                const fieldList = running_tag_fields.map(([k, v]) => `${k}="${v}"`).join(", ");
                result = {
                    description: `Editar ${running_tag_fields.length} campo(s) en ${indices.length} cancion(es)`,
                    affected_count: indices.length,
                    details: indices.map((idx) => {
                        const s = songs.find((x) => x.index === idx);
                        return s ? `${s.file_name}: ${fieldList}` : `Índice ${idx}: ${fieldList}`;
                    }),
                };
            }
            setDryResult(result);
        } catch (err) {
            setError(String(err));
        }
    }

    async function execute() {
        if (!vdjFolder || selected.size === 0) return;
        setRunning(true);
        setLog([]);
        setDryResult(null);
        setMoveReport(null);
        try {
            const indices = Array.from(selected);
            if (action === "move" && targetFolder) {
                const report = await moveFilesOp(vdjFolder, selectedPaths, targetFolder);
                setMoveReport(report);
                if (report.summary.completed > 0) {
                    setSelected(new Set());
                    await reload();
                }
            } else if (action === "rename") {
                if (selected.size !== 1 || renameFileName.length === 0) return;
                const song = songs.find((item) => item.index === indices[0]);
                if (!song) return;
                const result: RenameFileResult = await renameFileOp(
                    vdjFolder,
                    song.file_path,
                    renameFileName,
                );
                setLog([
                    `${result.status} · fase=${result.phase ?? "—"} · journal=${result.journalId ?? "—"}`,
                    result.message ?? `${result.originalFilePath} → ${result.newFilePath}`,
                ]);
                if (result.status === "completed") await reload();
            } else if (action === "tag" && running_tag_fields.length > 0) {
                const patch = Object.fromEntries(running_tag_fields) as Omit<SongUpdate, "index">;
                const updates: SongUpdate[] = indices.map((index) => ({ index, ...patch }));
                await saveSongUpdates(vdjFolder, updates);
                const results = indices.map((idx) => `OK: ${songs.find((x) => x.index === idx)?.file_name ?? idx}`);
                setLog(results);
            }
            if (action === "tag") await reload();
        } catch (err) {
            setError(String(err));
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="flex h-full gap-0">
            {/* ── Left side panel: folder tree ── */}
            <div className="flex w-56 shrink-0 flex-col border-r-2 border-border bg-surface">
                <div className="flex items-center justify-between border-b-2 border-border px-3 py-2">
                    <span className="text-[11px] font-semibold text-text-muted">Carpetas</span>
                    <button type="button" onClick={pickTreeRoot}
                        className="text-[11px] text-primary-light hover:underline">
                        + Agregar
                    </button>
                </div>
                {targetFolder && (
                    <div className="border-b-2 border-border/50 px-3 py-1.5">
                        <p className="text-[10px] text-text-muted">Destino seleccionado:</p>
                        <p className="truncate text-[11px] text-primary-light" title={targetFolder}>
                            {targetFolder.split("\\").pop() ?? targetFolder}
                        </p>
                    </div>
                )}
                <div className="flex-1 overflow-auto p-1">
                    <FolderTree
                        roots={treeRoots}
                        onSelect={setTargetFolder}
                        selectedPath={targetFolder}
                        maxHeightClass="max-h-full"
                    />
                </div>
            </div>

            {/* ── Right: main content ── */}
            <div className="min-w-0 flex-1 space-y-3 overflow-auto p-3">
                <h2 className="text-lg font-bold text-text">Operaciones en Lote</h2>

                {/* Action tabs */}
                <div className="tab-group">
                    {([
                        { key: "move", label: "Mover Archivos" },
                        { key: "rename", label: "Renombrar" },
                        { key: "tag", label: "Editar Tag" },
                    ] as const).map(({ key, label }) => (
                        <button key={key} type="button"
                            onClick={() => { setAction(key); setDryResult(null); setMoveReport(null); }}
                            className={`tab-item flex-1 ${action === key ? "tab-active" : ""}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Action config */}
                <div className="card p-3">
                    {action === "move" && (
                        <div>
                            <label className="mb-1 block text-[11px] text-text-muted">Carpeta destino</label>
                            <div className="flex gap-2">
                                <input type="text" value={targetFolder}
                                    onChange={(e) => setTargetFolder(e.target.value)}
                                    placeholder="Selecciona en el árbol o escribe una ruta"
                                    className="input flex-1" />
                                <button type="button" onClick={pickTarget} className="btn btn-ghost">
                                    Explorar...
                                </button>
                            </div>
                        </div>
                    )}

                    {action === "rename" && (
                        <div>
                            <label className="mb-1 block text-[11px] text-text-muted">
                                Nombre de archivo destino (literal, con extensión)
                            </label>
                            <input type="text" value={renameFileName}
                                onChange={(e) => setRenameFileName(e.target.value)}
                                placeholder="ejemplo.mp3"
                                className="input w-full" />
                            <p className="mt-1 text-[10px] text-text-muted">
                                Selecciona exactamente una canción. El backend valida el nombre sin sanitizarlo.
                            </p>
                        </div>
                    )}

                    {action === "tag" && (
                        <div className="space-y-2">
                            <p className="text-[11px] text-text-muted">
                                Deja en blanco los campos que <strong>no</strong> quieres modificar.
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {([
                                    ["title", "Título"], ["author", "Artista"], ["album", "Álbum"],
                                    ["genre", "Género"], ["year", "Año"], ["remix", "Remix"],
                                    ["remixer", "Remixer"], ["composer", "Compositor"], ["label", "Disquera"],
                                    ["trackNumber", "Pista #"], ["grouping", "Agrupación"], ["bpm", "BPM"],
                                    ["key", "Tono"], ["stars", "Puntuación"], ["gain", "Ganancia dB"],
                                    ["user1", "Usuario 1"], ["user2", "Usuario 2"], ["commentText", "Comentario"],
                                ] as [keyof typeof tagForm, string][]).map(([field, label]) => (
                                    <div key={field}>
                                        <label className="mb-0.5 block text-[10px] text-text-muted">{label}</label>
                                        <input type="text" value={tagForm[field]}
                                            onChange={(e) => setTag(field, e.target.value)}
                                            placeholder="—" className="input w-full text-[11px]" />
                                    </div>
                                ))}
                                {/* Color — swatch picker + hex text */}
                                <div>
                                    <label className="mb-0.5 block text-[10px] text-text-muted">Color</label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="color"
                                            value={tagForm.color || "#ffffff"}
                                            onChange={(e) => setTag("color", e.target.value)}
                                            className="color-picker-input"
                                            title="Elegir color"
                                        />
                                        <input
                                            type="text"
                                            value={tagForm.color}
                                            onChange={(e) => setTag("color", e.target.value)}
                                            placeholder="—"
                                            className="input flex-1 font-mono text-[11px]"
                                            maxLength={9}
                                        />
                                    </div>
                                </div>
                            </div>
                            {running_tag_fields.length > 0 && (
                                <p className="text-[11px] text-success">
                                    {running_tag_fields.length} campo(s) activo(s):{" "}
                                    {running_tag_fields.map(([k]) => k).join(", ")}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-[13px] text-text-muted">{selected.size} canciones seleccionadas</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={runDryRun}
                                disabled={running || selected.size === 0 || (action === "move" && targetFolder.length === 0) || (action === "rename" && (selected.size !== 1 || renameFileName.length === 0)) || (action === "tag" && running_tag_fields.length === 0)}
                                className="btn btn-warning">Vista Previa</button>
                            <button type="button" onClick={execute}
                                disabled={running || selected.size === 0 || (action === "move" && targetFolder.length === 0) || (action === "rename" && (selected.size !== 1 || renameFileName.length === 0)) || (action === "tag" && running_tag_fields.length === 0)}
                                className="btn btn-primary">
                                {running ? "Ejecutando..." : "Ejecutar"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dry-run preview */}
                {dryResult && (
                    <div className="card space-y-1.5 border-warning/30 bg-warning/5 p-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-warning">Vista Previa (Dry Run)</h4>
                            <span className="text-[11px] text-text-muted">
                                {dryResult.affected_count} de {dryResult.details.length} afectados
                            </span>
                        </div>
                        <p className="text-[11px] text-text-secondary">{dryResult.description}</p>
                        <div className="max-h-48 overflow-auto rounded-[5px] border-2 border-border bg-surface p-2">
                            {dryResult.details.map((line, i) => (
                                <div key={i} className={`text-[11px] ${line.startsWith("✓") ? "text-success" : line.startsWith("⚠") ? "text-warning" : "text-text-secondary"}`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {moveReport && (
                    <div className="card space-y-2 border-info/30 bg-info/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-xs font-bold text-info">Reporte de movimiento</h4>
                            <span className="text-[11px] text-text-muted">
                                {moveReport.summary.completed} completados · {moveReport.summary.ready} listos · {moveReport.summary.blocked} bloqueados · {moveReport.summary.manualReview} revisión manual
                            </span>
                        </div>
                        <div className="max-h-52 overflow-auto rounded-[5px] border-2 border-border bg-surface p-2">
                            {moveReport.items.map((item) => {
                                const method = transferMethodLabel(item.transferMethod);
                                return (
                                    <div key={`${item.originalFilePath}:${item.targetFilePath}`} className={`text-[11px] ${item.status === "db_committed" || item.status === "ready" ? "text-success" : item.status === "manual_review_required" ? "text-error" : "text-warning"}`}>
                                        {moveStatusLabel(item.status)} · {item.originalFilePath} → {item.targetFilePath || "—"}{method ? ` · ${method}` : ""}{item.message ? ` — ${item.message}` : ""}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Log */}
                {log.length > 0 && (
                    <div className="card max-h-48 overflow-auto p-2.5">
                        <h4 className="mb-1.5 text-[11px] font-semibold text-text-muted">Resultados</h4>
                        {log.map((line, i) => (
                            <div key={i} className={`text-[11px] ${line.startsWith("OK") ? "text-success" : line.startsWith("Error") ? "text-error" : "text-text-secondary"}`}>
                                {line}
                            </div>
                        ))}
                    </div>
                )}

                <SongTable songs={songs} selectable selected={selected}
                    onToggle={toggleSelect} onSelectAll={selectAll} onDeselectAll={deselectAll}
                    storageKey="batch" />
            </div>
        </div>
    );
}
