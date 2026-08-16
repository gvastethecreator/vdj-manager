import { useState, useCallback, useMemo, useRef } from "react";
import { Eye, PanelLeftClose, PanelLeftOpen, Play } from "lucide-react";
import { useApp } from "../App";
import { SongTable } from "../components/SongTable";
import { FolderTree } from "../components/FolderTree";
import { MutationBlockedNotice } from "../components/MutationBlockedNotice";
import { ConfirmDialog } from "../components/Dialog";
import { getConfiguredMusicRoots } from "../lib/api";
import { moveStatusLabel, transferMethodLabel } from "../lib/moveReport";
import type { DryRunResult, InlineSongUpdate, MoveBatchReport, RenameFileResult } from "../types/database";

type BatchAction = "move" | "rename" | "tag";

/** Batch operations page: move, rename, and tag-edit selected songs. */
export function BatchOperations() {
    const { songs, vdjFolder, reportUiError, reload, refreshRecovery, musicFolders, addMusicFolder, selectMusicFolder, mutationsBlocked, services } = useApp();
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
    const [running, setRunning] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [dryResult, setDryResult] = useState<DryRunResult | null>(null);
    const [moveReport, setMoveReport] = useState<MoveBatchReport | null>(null);
    const [validatedPreviewKey, setValidatedPreviewKey] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [treeOpen, setTreeOpen] = useState(true);
    const previewRequestVersion = useRef(0);

    const invalidatePreview = useCallback(() => {
        previewRequestVersion.current += 1;
        setValidatedPreviewKey(null);
        setDryResult(null);
        setMoveReport(null);
    }, []);
    const setTag = (field: keyof typeof tagForm, value: string) => {
        setTagForm((prev) => ({ ...prev, [field]: value }));
        invalidatePreview();
    };
    const running_tag_fields = Object.entries(tagForm).filter(([, v]) => v !== "");

    // Derive tree roots from actual music paths; fall back to VDJ folder
    const treeRoots = useMemo(
        () => getConfiguredMusicRoots(songs, vdjFolder, musicFolders),
        [songs, vdjFolder, musicFolders],
    );

    const toggleSelect = useCallback((index: number) => {
        invalidatePreview();
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }, [invalidatePreview]);
    const selectAll = useCallback(() => {
        invalidatePreview();
        setSelected(new Set(songs.map((s) => s.index)));
    }, [invalidatePreview, songs]);
    const deselectAll = useCallback(() => {
        invalidatePreview();
        setSelected(new Set());
    }, [invalidatePreview]);
    const selectedPaths = useMemo(
        () => songs.filter((song) => selected.has(song.index)).map((song) => song.file_path),
        [selected, songs],
    );
    const previewKey = useMemo(() => JSON.stringify({
        action,
        selectedPaths,
        targetFolder: action === "move" ? targetFolder : "",
        renameFileName: action === "rename" ? renameFileName : "",
        tagForm: action === "tag" ? tagForm : {},
    }), [action, renameFileName, selectedPaths, tagForm, targetFolder]);
    const currentPreviewKey = useRef(previewKey);
    currentPreviewKey.current = previewKey;
    const hasFreshPreview = validatedPreviewKey === previewKey
        && (action === "move" ? moveReport !== null : dryResult !== null);

    async function pickTarget() {
        const folder = await services.selectDirectory({ purpose: "destination", title: "Select target folder" });
        if (folder) {
            setTargetFolder(folder);
            invalidatePreview();
            addMusicFolder(folder);
        }
    }

    async function pickTreeRoot() {
        await selectMusicFolder();
    }

    async function runDryRun() {
        if (!vdjFolder || selected.size === 0) return;
        const indices = Array.from(selected);
        const requestVersion = previewRequestVersion.current + 1;
        previewRequestVersion.current = requestVersion;
        const requestKey = previewKey;
        setValidatedPreviewKey(null);
        setDryResult(null);
        setMoveReport(null);
        try {
            if (action === "move" && targetFolder) {
                const report = await services.planMoveFiles(vdjFolder, selectedPaths, targetFolder);
                if (previewRequestVersion.current !== requestVersion || currentPreviewKey.current !== requestKey) return;
                setMoveReport(report);
                setValidatedPreviewKey(requestKey);
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
                    description: "Rename one file to the exact name provided",
                    affected_count: 1,
                    details: [`${song.file_name} → ${renameFileName}`],
                };
            } else {
                const fieldList = running_tag_fields.map(([k, v]) => `${k}="${v}"`).join(", ");
                result = {
                    description: `Edit ${running_tag_fields.length} field(s) across ${indices.length} song(s)`,
                    affected_count: indices.length,
                    details: indices.map((idx) => {
                        const s = songs.find((x) => x.index === idx);
                        return s ? `${s.file_name}: ${fieldList}` : `Index ${idx}: ${fieldList}`;
                    }),
                };
            }
            if (previewRequestVersion.current !== requestVersion || currentPreviewKey.current !== requestKey) return;
            setDryResult(result);
            setValidatedPreviewKey(requestKey);
        } catch (err) {
            if (previewRequestVersion.current !== requestVersion) return;
            reportUiError("The operation preview could not be prepared.", err, { retry: runDryRun });
        }
    }

    async function execute() {
        if (mutationsBlocked) {
            reportUiError("The operation is paused while recovery is pending.");
            return;
        }
        if (!hasFreshPreview) {
            reportUiError("Prepare an up-to-date preview before running the operation.");
            return;
        }
        if (!vdjFolder || selected.size === 0) return;
        setRunning(true);
        setLog([]);
        invalidatePreview();
        try {
            const indices = Array.from(selected);
            if (action === "move" && targetFolder) {
                const report = await services.moveFilesOp(vdjFolder, selectedPaths, targetFolder);
                setMoveReport(report);
                if (report.summary.completed > 0) {
                    setSelected(new Set());
                    await reload();
                }
            } else if (action === "rename") {
                if (selected.size !== 1 || renameFileName.length === 0) return;
                const song = songs.find((item) => item.index === indices[0]);
                if (!song) return;
                const result: RenameFileResult = await services.renameFileOp(
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
                const patch = Object.fromEntries(running_tag_fields) as InlineSongUpdate;
                const outcomes: string[] = [];
                let completed = 0;
                for (const index of indices) {
                    const song = songs.find((item) => item.index === index);
                    if (!song?.in_database) {
                        outcomes.push(`SKIPPED: ${song?.file_name ?? index} is not catalogued in database.xml`);
                        continue;
                    }
                    try {
                        const result = await services.updateSongTags(vdjFolder, song.file_path, patch);
                        outcomes.push(`${result.status === "completed" ? "OK" : "ATTENTION"}: ${song.file_name} · ${result.status}`);
                        if (result.status === "completed") completed += 1;
                    } catch (error) {
                        outcomes.push(`ERROR: ${song.file_name} · ${String(error)}`);
                        reportUiError(`Batch editing stopped after ${completed} change(s).`, error);
                        setLog([...outcomes]);
                        break;
                    }
                    setLog([...outcomes]);
                }
                if (completed > 0) await reload();
            }
        } catch (err) {
            reportUiError("The batch operation could not be completed.", err);
        } finally {
            await refreshRecovery();
            setRunning(false);
            setConfirmOpen(false);
        }
    }

    return (
        <div className="flex h-full min-h-0 gap-0 bg-background">
            {/* ── Left side panel: folder tree ── */}
            {treeOpen && <aside id="batch-destination-tree" className="flex w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-surface" aria-label="Target tree">
                <div className="flex items-center justify-between border-b-2 border-border px-3 py-2">
                    <span className="text-xs font-semibold text-text-muted">Folders</span>
                    <button type="button" onClick={pickTreeRoot}
                        className="inline-flex min-h-8 items-center rounded px-2 text-xs text-primary-light hover:bg-primary/10">
                        + Add
                    </button>
                </div>
                {targetFolder && (
                    <div className="border-b-2 border-border/50 px-3 py-1.5">
                        <p className="text-xs text-text-muted">Selected target:</p>
                        <p className="truncate text-xs text-primary-light" title={targetFolder}>
                            {targetFolder.split("\\").pop() ?? targetFolder}
                        </p>
                    </div>
                )}
                <div className="flex-1 overflow-auto p-1">
                    <FolderTree
                        roots={treeRoots}
                        onSelect={(folder) => { setTargetFolder(folder); invalidatePreview(); }}
                        selectedPath={targetFolder}
                        maxHeightClass="max-h-full"
                    />
                </div>
            </aside>}

            {/* ── Right: main content ── */}
            <div className="min-w-0 flex-1 space-y-4 overflow-auto p-4">
                <header className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-light">Execution workspace</p>
                        <h1 className="mt-1 text-xl font-bold text-text">Batch operations</h1>
                        <p className="mt-1 text-sm text-text-muted">Select tracks, prepare a preview, and confirm one protected operation.</p>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTreeOpen((value) => !value)} aria-expanded={treeOpen} aria-controls="batch-destination-tree">
                        {treeOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        {treeOpen ? "Hide targets" : "Show targets"}
                    </button>
                </header>
                <MutationBlockedNotice />

                {/* Action tabs */}
                <div className="tab-group">
                    {([
                        { key: "move", label: "Move files" },
                        { key: "rename", label: "Rename" },
                        { key: "tag", label: "Edit tags" },
                    ] as const).map(({ key, label }) => (
                        <button key={key} type="button"
                            onClick={() => { setAction(key); invalidatePreview(); }}
                            className={`tab-item flex-1 ${action === key ? "tab-active" : ""}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Action config */}
                <div className="card p-3">
                    {action === "move" && (
                        <div>
                            <label className="mb-1 block text-xs text-text-muted">Target folder</label>
                            <div className="flex gap-2">
                                <input type="text" value={targetFolder}
                                    onChange={(e) => { setTargetFolder(e.target.value); invalidatePreview(); }}
                                    aria-label="Target folder"
                                    placeholder="Select from the tree or enter a path"
                                    className="input flex-1" />
                                <button type="button" onClick={pickTarget} className="btn btn-ghost">
                                    Browse…
                                </button>
                            </div>
                        </div>
                    )}

                    {action === "rename" && (
                        <div>
                            <label className="mb-1 block text-xs text-text-muted">
                                Target file name (exact, including extension)
                            </label>
                            <input type="text" value={renameFileName}
                                onChange={(e) => { setRenameFileName(e.target.value); invalidatePreview(); }}
                                aria-label="Target file name"
                                placeholder="example.mp3"
                                className="input w-full" />
                            <p className="mt-1 text-xs text-text-muted">
                                Select exactly one song. The backend validates the name without sanitizing it.
                            </p>
                        </div>
                    )}

                    {action === "tag" && (
                        <div className="space-y-2">
                            <p className="text-xs text-text-muted">
                                Leave fields blank when you do <strong>not</strong> want to change them.
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {([
                                    ["title", "Title"], ["author", "Artist"], ["album", "Album"],
                                    ["genre", "Genre"], ["year", "Year"], ["remix", "Remix"],
                                    ["remixer", "Remixer"], ["composer", "Composer"], ["label", "Label"],
                                    ["trackNumber", "Track #"], ["grouping", "Grouping"], ["bpm", "BPM"],
                                    ["key", "Key"], ["stars", "Rating"], ["gain", "Gain dB"],
                                    ["user1", "User 1"], ["user2", "User 2"], ["commentText", "Comment"],
                                ] as [keyof typeof tagForm, string][]).map(([field, label]) => (
                                    <div key={field}>
                                        <label className="mb-0.5 block text-xs text-text-muted">{label}</label>
                                        <input type="text" value={tagForm[field]}
                                            onChange={(e) => setTag(field, e.target.value)}
                                            aria-label={label}
                                            placeholder="—" className="input w-full text-xs" />
                                    </div>
                                ))}
                                {/* Color — swatch picker + hex text */}
                                <div>
                                    <label className="mb-0.5 block text-xs text-text-muted">Color</label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="color"
                                            value={tagForm.color || "#ffffff"}
                                            onChange={(e) => setTag("color", e.target.value)}
                                            className="color-picker-input"
                                            aria-label="Color picker"
                                            title="Choose color"
                                        />
                                        <input
                                            type="text"
                                            value={tagForm.color}
                                            onChange={(e) => setTag("color", e.target.value)}
                                            placeholder="—"
                                            aria-label="Hex color"
                                            className="input flex-1 font-mono text-xs"
                                            maxLength={9}
                                        />
                                    </div>
                                </div>
                            </div>
                            {running_tag_fields.length > 0 && (
                                <p className="text-xs text-success">
                                    {running_tag_fields.length} active field(s):{" "}
                                    {running_tag_fields.map(([k]) => k).join(", ")}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-[13px] text-text-muted">{selected.size} songs selected</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={runDryRun}
                                disabled={running || selected.size === 0 || (action === "move" && targetFolder.length === 0) || (action === "rename" && (selected.size !== 1 || renameFileName.length === 0)) || (action === "tag" && running_tag_fields.length === 0)}
                                className="btn btn-ghost"><Eye className="h-4 w-4" /> Prepare preview</button>
                            <button type="button" onClick={() => setConfirmOpen(true)}
                                disabled={mutationsBlocked || running || !hasFreshPreview || selected.size === 0 || (action === "move" && targetFolder.length === 0) || (action === "rename" && (selected.size !== 1 || renameFileName.length === 0)) || (action === "tag" && running_tag_fields.length === 0)}
                                className="btn btn-primary">
                                <Play className="h-4 w-4" /> {running ? "Running..." : "Run"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dry-run preview */}
                {dryResult && (
                    <div className="card space-y-1.5 border-warning/30 bg-warning/5 p-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-warning">Preview (dry run)</h4>
                            <span className="text-xs text-text-muted">
                                {dryResult.affected_count} of {dryResult.details.length} affected
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary">{dryResult.description}</p>
                        <div className="max-h-48 overflow-auto rounded-[5px] border-2 border-border bg-surface p-2">
                            {dryResult.details.map((line, i) => (
                                <div key={i} className={`text-xs ${line.startsWith("✓") ? "text-success" : line.startsWith("⚠") ? "text-warning" : "text-text-secondary"}`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {moveReport && (
                    <div className="card space-y-2 border-info/30 bg-info/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-xs font-bold text-info">Move report</h4>
                            <span className="text-xs text-text-muted">
                                {moveReport.summary.completed} completed · {moveReport.summary.ready} ready · {moveReport.summary.blocked} blocked · {moveReport.summary.manualReview} manual review
                            </span>
                        </div>
                        <div className="max-h-52 overflow-auto rounded-[5px] border-2 border-border bg-surface p-2">
                            {moveReport.items.map((item) => {
                                const method = transferMethodLabel(item.transferMethod);
                                return (
                                    <div key={`${item.originalFilePath}:${item.targetFilePath}`} className={`text-xs ${item.status === "db_committed" || item.status === "ready" ? "text-success" : item.status === "manual_review_required" ? "text-error" : "text-warning"}`}>
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
                        <h4 className="mb-1.5 text-xs font-semibold text-text-muted">Results</h4>
                        {log.map((line, i) => (
                            <div key={i} className={`text-xs ${line.startsWith("OK") ? "text-success" : line.startsWith("Error") ? "text-error" : "text-text-secondary"}`}>
                                {line}
                            </div>
                        ))}
                    </div>
                )}

                <SongTable songs={songs} selectable selected={selected}
                    onToggle={toggleSelect} onSelectAll={selectAll} onDeselectAll={deselectAll}
                    storageKey="batch" />
                <ConfirmDialog
                    open={confirmOpen}
                    title="Confirm batch operation"
                    description={`${action === "move" ? "A move" : action === "rename" ? "A rename" : "A tag edit"} will be applied to ${selected.size} track(s). The operation will be journaled and use recovery safeguards.`}
                    confirmLabel="Run operation"
                    destructive={action !== "tag"}
                    busy={running}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={execute}
                />
            </div>
        </div>
    );
}
