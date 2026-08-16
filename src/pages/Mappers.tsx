import { useCallback, useEffect, useMemo, useState } from "react";
import { FileCode2, ListChecks, Plus, Trash2 } from "lucide-react";
import { useApp } from "../App";
import { CodeEditor } from "../components/CodeEditor";
import { ConfirmDialog } from "../components/Dialog";
import { useResourceEditorState } from "../components/ResourceStudio";
import { TreeFileNavigator, type TreeFileItem } from "../components/TreeFileNavigator";
import { formatSize } from "../lib/api";
import type { VdjConfigFileInfo, VdjMapperBinding, VdjMapperDocument } from "../types/database";

const EMPTY_BINDING: VdjMapperBinding = {
    value: "",
    action: "",
    other_attributes: {},
};

function isMapperFile(file: VdjConfigFileInfo | null): boolean {
    const path = file?.path.toLowerCase() ?? "";
    return path.endsWith(".vdjmap") || path.endsWith(".xml");
}

type MapperEditorMode = "bindings" | "xml";
type PendingMapperChange =
    | { kind: "file"; id: string }
    | { kind: "mode"; mode: MapperEditorMode };

/** Competent editor for VirtualDJ controller mappings with structured binding editing for `.vdjmap`. */
export function Mappers() {
    const { vdjFolder, clearUiError, reportUiError, services } = useApp();
    const [files, setFiles] = useState<VdjConfigFileInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [bindingSearch, setBindingSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rawContent, setRawContent] = useState("");
    const [rawDirty, setRawDirty] = useState(false);
    const [mapper, setMapper] = useState<VdjMapperDocument | null>(null);
    const [mapperDirty, setMapperDirty] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [editorMode, setEditorMode] = useState<MapperEditorMode>("bindings");
    const [pendingChange, setPendingChange] = useState<PendingMapperChange | null>(null);

    const loadFiles = useCallback(async () => {
        if (!vdjFolder) {
            setFiles([]);
            return;
        }
        setLoading(true);
        try {
            const result = await services.listVdjConfigFiles(vdjFolder);
            setFiles(result.filter((file) => {
                const relative = file.relative_path.toLowerCase();
                return relative.startsWith("mappers/")
                    || relative.startsWith("mappers\\")
                    || relative.startsWith("devices/")
                    || relative.startsWith("devices\\")
                    || relative.endsWith(".vdjmap");
            }));
        } catch (err) {
            reportUiError("Mappers could not be loaded.", err);
        } finally {
            setLoading(false);
        }
    }, [reportUiError, services, vdjFolder]);

    useEffect(() => {
        void loadFiles();
    }, [loadFiles]);

    const visibleFiles = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return files;
        return files.filter((file) => file.relative_path.toLowerCase().includes(q) || file.name.toLowerCase().includes(q));
    }, [files, search]);

    const treeItems = useMemo<TreeFileItem[]>(() => visibleFiles.map((file) => ({
        id: file.path,
        path: file.path,
        relativePath: file.relative_path,
        label: file.name,
        meta: formatSize(file.size_bytes),
    })), [visibleFiles]);

    useEffect(() => {
        if (files.length === 0) {
            setSelectedId(null);
            return;
        }
        setSelectedId((prev) => prev && files.some((file) => file.path === prev) ? prev : files[0].path);
    }, [files]);

    const selectedFile = useMemo(
        () => files.find((file) => file.path === selectedId) ?? null,
        [files, selectedId],
    );

    useEffect(() => {
        if (!vdjFolder || !selectedFile) {
            setRawContent("");
            setRawDirty(false);
            setMapper(null);
            setMapperDirty(false);
            return;
        }

        let cancelled = false;

        services.readVdjConfigFile(vdjFolder, selectedFile.path)
            .then((content) => {
                if (cancelled) return;
                setRawContent(content);
                setRawDirty(false);
            })
            .catch((err) => {
                if (!cancelled) reportUiError("The mapper XML could not be opened.", err);
            });

        if (isMapperFile(selectedFile)) {
            services.getVdjMapper(vdjFolder, selectedFile.path)
                .then((document) => {
                    if (cancelled) return;
                    setMapper(document);
                    setMapperDirty(false);
                })
                .catch((err) => {
                    if (!cancelled) {
                        setMapper(null);
                        reportUiError("The mapper could not be parsed.", err);
                    }
                });
        } else {
            setMapper(null);
            setMapperDirty(false);
        }

        return () => {
            cancelled = true;
        };
    }, [reportUiError, selectedFile, services, vdjFolder]);

    const filteredBindings = useMemo(() => {
        if (!mapper) return [];
        const q = bindingSearch.trim().toLowerCase();
        if (!q) return mapper.mappings;
        return mapper.mappings.filter((binding) =>
            binding.value.toLowerCase().includes(q)
            || binding.action.toLowerCase().includes(q)
            || Object.entries(binding.other_attributes).some(([key, value]) => `${key}:${value}`.toLowerCase().includes(q)),
        );
    }, [bindingSearch, mapper]);

    const updateMapperMeta = (key: keyof VdjMapperDocument, value: string) => {
        setMapper((prev) => prev ? { ...prev, [key]: value } : prev);
        setMapperDirty(true);
    };

    const updateBinding = (index: number, patch: Partial<VdjMapperBinding>) => {
        setMapper((prev) => {
            if (!prev) return prev;
            const mappings = [...prev.mappings];
            mappings[index] = { ...mappings[index], ...patch };
            return { ...prev, mappings };
        });
        setMapperDirty(true);
    };

    const removeBinding = (index: number) => {
        setMapper((prev) => prev ? { ...prev, mappings: prev.mappings.filter((_, current) => current !== index) } : prev);
        setMapperDirty(true);
    };

    const addBinding = () => {
        setMapper((prev) => prev ? { ...prev, mappings: [...prev.mappings, { ...EMPTY_BINDING }] } : prev);
        setMapperDirty(true);
    };

    const saveRaw = useCallback(async () => {
        if (!vdjFolder || !selectedFile || !rawDirty) return;
        setSaving(true);
        try {
            const backup = await services.writeVdjConfigFile(vdjFolder, selectedFile.path, rawContent);
            setLastBackup(backup || null);
            setRawDirty(false);
            await loadFiles();
            clearUiError();
        } catch (err) {
            reportUiError("The mapper XML could not be saved.", err);
        } finally {
            setSaving(false);
        }
    }, [clearUiError, loadFiles, rawContent, rawDirty, reportUiError, selectedFile, services, vdjFolder]);

    const saveMapper = useCallback(async () => {
        if (!vdjFolder || !selectedFile || !mapper || !mapperDirty) return;
        setSaving(true);
        try {
            const backup = await services.updateVdjMapper(vdjFolder, selectedFile.path, mapper);
            setLastBackup(backup || null);
            setMapperDirty(false);
            const refreshed = await services.readVdjConfigFile(vdjFolder, selectedFile.path);
            setRawContent(refreshed);
            setRawDirty(false);
            await loadFiles();
            clearUiError();
        } catch (err) {
            reportUiError("The mapper could not be saved.", err);
        } finally {
            setSaving(false);
        }
    }, [clearUiError, loadFiles, mapper, mapperDirty, reportUiError, selectedFile, services, vdjFolder]);

    const revertChanges = useCallback(async () => {
        if (!vdjFolder || !selectedFile) return;
        setSaving(true);
        try {
            const raw = await services.readVdjConfigFile(vdjFolder, selectedFile.path);
            setRawContent(raw);
            setRawDirty(false);
            if (isMapperFile(selectedFile)) {
                const document = await services.getVdjMapper(vdjFolder, selectedFile.path);
                setMapper(document);
            } else {
                setMapper(null);
            }
            setMapperDirty(false);
            clearUiError();
        } catch (err) {
            reportUiError("The last mapper version could not be restored.", err);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [clearUiError, reportUiError, selectedFile, services, vdjFolder]);

    const retryLoad = useCallback(async () => {
        await loadFiles();
        await revertChanges();
    }, [loadFiles, revertChanges]);

    const resourceDirty = mapperDirty || rawDirty;
    useResourceEditorState({
        dirty: resourceDirty,
        busy: loading || saving,
        save: mapperDirty ? saveMapper : saveRaw,
        revert: revertChanges,
        retry: retryLoad,
    });

    const requestFileSelection = (id: string) => {
        if (id === selectedId) return;
        if (resourceDirty) setPendingChange({ kind: "file", id });
        else setSelectedId(id);
    };

    const requestEditorMode = (mode: MapperEditorMode) => {
        if (mode === editorMode) return;
        if (resourceDirty) setPendingChange({ kind: "mode", mode });
        else setEditorMode(mode);
    };

    const confirmPendingChange = async () => {
        const next = pendingChange;
        if (!next) return;
        try {
            await revertChanges();
            setPendingChange(null);
            if (next.kind === "file") setSelectedId(next.id);
            else setEditorMode(next.mode);
        } catch {
            setPendingChange(null);
        }
    };

    return (
        <div className="flex h-full gap-0 code-workspace">
            <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-surface/85">
                <div className="border-b border-border px-3 py-3">
                    <h2 className="text-sm font-semibold text-text">Mappers</h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                        Edit mappings and controller definitions using the real <code>Mappers/</code> and <code>Devices/</code> structure.
                    </p>
                </div>
                <div className="border-b border-border/70 p-2">
                    <input
                        type="text"
                        className="input w-full"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-auto p-1.5">
                    {loading ? (
                        <div className="p-2 text-xs text-text-muted">Loading files...</div>
                    ) : (
                        <TreeFileNavigator
                            items={treeItems}
                            selectedId={selectedId}
                            onSelect={(item) => requestFileSelection(item.path)}
                            emptyLabel="No mapping or definition files were found in the VirtualDJ folder."
                        />
                    )}
                </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-auto p-3">
                {!selectedFile ? (
                    <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                        Select a mapping or device file from the tree.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-text">{selectedFile.name}</h3>
                                <p className="mt-1 text-sm text-text-muted">{selectedFile.relative_path}</p>
                                <p className="mt-1 text-xs text-text-muted">Size: {formatSize(selectedFile.size_bytes)}</p>
                            </div>
                        </div>

                        {lastBackup ? (
                            <div className="rounded border border-success/30 bg-success/8 px-3 py-2 text-[12px] text-success">
                                Backup creado: <span className="font-mono">{lastBackup}</span>
                            </div>
                        ) : null}

                        {isMapperFile(selectedFile) && mapper ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="tab-group w-80">
                                        <button type="button" className={`tab-item ${editorMode === "bindings" ? "tab-active" : ""}`} onClick={() => requestEditorMode("bindings")}>
                                            <ListChecks className="mr-1 inline h-3.5 w-3.5" /> Bindings
                                        </button>
                                        <button type="button" className={`tab-item ${editorMode === "xml" ? "tab-active" : ""}`} onClick={() => requestEditorMode("xml")}>
                                            <FileCode2 className="mr-1 inline h-3.5 w-3.5" /> XML
                                        </button>
                                    </div>
                                    <span className="text-xs text-text-muted">Edit controls and actions; XML remains the fallback.</span>
                                </div>
                                {editorMode === "xml" ? (
                                    <CodeEditor
                                        label={selectedFile.name}
                                        value={rawContent}
                                        onChange={(value) => {
                                            setRawContent(value);
                                            setRawDirty(true);
                                        }}
                                        dirty={rawDirty}
                                    />
                                ) : (
                                    <>
                                <div className="card p-4">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold text-text">Mapper metadata</h4>
                                        <p className="mt-1 text-[12px] text-text-muted">
                                            VirtualDJ defines mappings as XML with a <code>{"<mapper>"}</code> root and <code>{"<map value=... action=... />"}</code> bindings.
                                        </p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        <label className="space-y-1 text-xs text-text-muted">
                                            <span>Device</span>
                                            <input className="input w-full" value={mapper.device} onChange={(e) => updateMapperMeta("device", e.target.value)} />
                                        </label>
                                        <label className="space-y-1 text-xs text-text-muted">
                                            <span>Author</span>
                                            <input className="input w-full" value={mapper.author ?? ""} onChange={(e) => updateMapperMeta("author", e.target.value)} />
                                        </label>
                                        <label className="space-y-1 text-xs text-text-muted">
                                            <span>Version</span>
                                            <input className="input w-full" value={mapper.version ?? ""} onChange={(e) => updateMapperMeta("version", e.target.value)} />
                                        </label>
                                        <label className="space-y-1 text-xs text-text-muted">
                                            <span>Date</span>
                                            <input className="input w-full" value={mapper.date ?? ""} onChange={(e) => updateMapperMeta("date", e.target.value)} />
                                        </label>
                                        <label className="space-y-1 text-xs text-text-muted">
                                            <span>Priority</span>
                                            <input className="input w-full" value={mapper.priority ?? ""} onChange={(e) => updateMapperMeta("priority", e.target.value)} />
                                        </label>
                                        <label className="space-y-1 text-xs text-text-muted md:col-span-2 xl:col-span-3">
                                            <span>Info / manual</span>
                                            <input className="input w-full" value={mapper.info ?? ""} onChange={(e) => updateMapperMeta("info", e.target.value)} />
                                        </label>
                                    </div>
                                </div>

                                <div className="card p-4">
                                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-text">Mapping bindings</h4>
                                            <p className="mt-1 text-[12px] text-text-muted">Edit controls and VDJScript actions without changing XML by hand.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="input md:w-72"
                                                placeholder="Search controls or actions..."
                                                value={bindingSearch}
                                                onChange={(e) => setBindingSearch(e.target.value)}
                                            />
                                            <button type="button" onClick={addBinding} className="btn btn-ghost btn-sm">
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {filteredBindings.map((binding) => {
                                            const index = mapper.mappings.indexOf(binding);
                                            return (
                                                <div key={`${binding.value}-${index}`} className="rounded-lg border border-border/60 bg-background/45 p-3">
                                                    <div className="grid gap-3 xl:grid-cols-[240px_1fr_auto] xl:items-start">
                                                        <label className="space-y-1 text-xs text-text-muted">
                                                            <span>Control / value</span>
                                                            <input
                                                                className="input w-full font-mono"
                                                                value={binding.value}
                                                                onChange={(e) => updateBinding(index, { value: e.target.value })}
                                                            />
                                                        </label>
                                                        <label className="space-y-1 text-xs text-text-muted">
                                                            <span>Action</span>
                                                            <textarea
                                                                className="min-h-20 w-full rounded-lg border border-border bg-background p-2 font-mono text-[12px] text-text outline-none focus:border-primary/60"
                                                                value={binding.action}
                                                                onChange={(e) => updateBinding(index, { action: e.target.value })}
                                                                spellCheck={false}
                                                            />
                                                        </label>
                                                        <div className="flex items-end xl:justify-end">
                                                            <button type="button" onClick={() => removeBinding(index)} className="btn btn-ghost btn-sm text-danger" aria-label={`Remove binding ${binding.value || index + 1}`}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {Object.keys(binding.other_attributes).length > 0 ? (
                                                        <div className="mt-2 text-xs text-text-muted">
                                                            Atributos extra preservados: {Object.entries(binding.other_attributes).map(([key, value]) => `${key}=${value}`).join(" · ")}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}

                                        {filteredBindings.length === 0 ? (
                                            <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                                                No bindings match that filter.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-lg border border-warning/25 bg-warning/8 p-4 text-sm text-text-muted">
                                    This file is not a structured <code>.vdjmap</code>. It is shown as text to preserve compatibility with definitions and other formats.
                                </div>
                                <CodeEditor
                                    label={selectedFile.name}
                                    value={rawContent}
                                    onChange={(value) => {
                                        setRawContent(value);
                                        setRawDirty(true);
                                    }}
                                    dirty={rawDirty}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ConfirmDialog
                open={pendingChange !== null}
                title="Pending changes in this mapper"
                description={pendingChange?.kind === "mode"
                    ? "The last loaded mapper version will be restored before switching editors."
                    : "The last loaded version of the current mapper will be restored before opening another file."}
                confirmLabel="Discard and continue"
                destructive
                onCancel={() => setPendingChange(null)}
                onConfirm={confirmPendingChange}
            />
        </div>
    );
}
