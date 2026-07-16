import { useCallback, useEffect, useMemo, useState } from "react";
import { FileCode2, ListChecks, Plus, Save, Trash2 } from "lucide-react";
import { useApp } from "../App";
import { CodeEditor } from "../components/CodeEditor";
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
            reportUiError("No se pudieron cargar los mappers.", err);
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
                if (!cancelled) reportUiError("No se pudo abrir el XML del mapper.", err);
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
                        reportUiError("No se pudo interpretar el mapper.", err);
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
            reportUiError("No se pudo guardar el XML del mapper.", err);
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
            reportUiError("No se pudo guardar el mapper.", err);
        } finally {
            setSaving(false);
        }
    }, [clearUiError, loadFiles, mapper, mapperDirty, reportUiError, selectedFile, services, vdjFolder]);

    return (
        <div className="flex h-full gap-0 code-workspace">
            <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-surface/85">
                <div className="border-b border-border px-3 py-3">
                    <h2 className="text-sm font-semibold text-text">Mappers</h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                        Editor de mappings y definiciones de controladores usando la estructura real de <code>Mappers/</code> y <code>Devices/</code>.
                    </p>
                </div>
                <div className="border-b border-border/70 p-2">
                    <input
                        type="text"
                        className="input w-full"
                        placeholder="Buscar archivo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-auto p-1.5">
                    {loading ? (
                        <div className="p-2 text-xs text-text-muted">Cargando archivos...</div>
                    ) : (
                        <TreeFileNavigator
                            items={treeItems}
                            selectedId={selectedId}
                            onSelect={(item) => setSelectedId(item.path)}
                            emptyLabel="No se encontraron archivos de mapeo/definición en la carpeta VirtualDJ."
                        />
                    )}
                </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-auto p-3">
                {!selectedFile ? (
                    <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                        Selecciona un archivo de mapping o device del árbol.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-text">{selectedFile.name}</h3>
                                <p className="mt-1 text-sm text-text-muted">{selectedFile.relative_path}</p>
                                <p className="mt-1 text-xs text-text-muted">Tamaño: {formatSize(selectedFile.size_bytes)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {mapperDirty || rawDirty ? <span className="rounded bg-warning/15 px-2 py-1 text-xs text-warning">Cambios pendientes</span> : null}
                                {isMapperFile(selectedFile) && mapper && editorMode === "bindings" ? (
                                    <button type="button" onClick={saveMapper} disabled={saving || !mapperDirty} className="btn btn-primary btn-sm">
                                        <Save className="h-3.5 w-3.5" /> Guardar mapper
                                    </button>
                                ) : (
                                    <button type="button" onClick={saveRaw} disabled={saving || !rawDirty} className="btn btn-primary btn-sm">
                                        <Save className="h-3.5 w-3.5" /> Guardar archivo
                                    </button>
                                )}
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
                                        <button type="button" className={`tab-item ${editorMode === "bindings" ? "tab-active" : ""}`} onClick={() => setEditorMode("bindings")}>
                                            <ListChecks className="mr-1 inline h-3.5 w-3.5" /> Bindings
                                        </button>
                                        <button type="button" className={`tab-item ${editorMode === "xml" ? "tab-active" : ""}`} onClick={() => setEditorMode("xml")}>
                                            <FileCode2 className="mr-1 inline h-3.5 w-3.5" /> XML
                                        </button>
                                    </div>
                                    <span className="text-xs text-text-muted">Edita controles y acciones; XML queda como respaldo.</span>
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
                                        <h4 className="text-sm font-semibold text-text">Metadatos del mapper</h4>
                                        <p className="mt-1 text-[12px] text-text-muted">
                                            VirtualDJ define los mappings como XML con raíz <code>{"<mapper>"}</code> y bindings <code>{"<map value=... action=... />"}</code>.
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
                                            <h4 className="text-sm font-semibold text-text">Bindings del mapping</h4>
                                            <p className="mt-1 text-[12px] text-text-muted">Edita controles y acciones VDJScript sin tener que tocar el XML a mano.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="input md:w-72"
                                                placeholder="Buscar control o acción..."
                                                value={bindingSearch}
                                                onChange={(e) => setBindingSearch(e.target.value)}
                                            />
                                            <button type="button" onClick={addBinding} className="btn btn-ghost btn-sm">
                                                <Plus className="h-3.5 w-3.5" /> Añadir
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
                                                            <button type="button" onClick={() => removeBinding(index)} className="btn btn-ghost btn-sm text-danger">
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
                                                No hay bindings para ese filtro.
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
                                    Este archivo no es un <code>.vdjmap</code> estructurado. Se muestra en modo texto para mantener compatibilidad con definiciones u otros formatos.
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
        </div>
    );
}
