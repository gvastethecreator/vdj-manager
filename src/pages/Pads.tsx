import { useCallback, useEffect, useMemo, useState } from "react";
import { FileCode2, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { useApp } from "../App";
import { CodeEditor } from "../components/CodeEditor";
import { ConfirmDialog } from "../components/Dialog";
import { useResourceEditorState } from "../components/ResourceStudio";
import { TreeFileNavigator, type TreeFileItem } from "../components/TreeFileNavigator";
import { formatSize } from "../lib/api";
import type { VdjConfigFileInfo, VdjXmlNode } from "../types/database";

function isPadDocumentFile(file: VdjConfigFileInfo | null): boolean {
    const path = file?.path.toLowerCase() ?? "";
    return path.endsWith(".vdjpad") || path.endsWith(".xml");
}

type PadEditorMode = "visual" | "xml";

function updateNodeAtPath(root: VdjXmlNode, path: number[], updater: (node: VdjXmlNode) => VdjXmlNode): VdjXmlNode {
    if (path.length === 0) return updater(root);
    const [head, ...rest] = path;
    return {
        ...root,
        children: root.children.map((child, index) => index === head ? updateNodeAtPath(child, rest, updater) : child),
    };
}

function removeNodeAtPath(root: VdjXmlNode, path: number[]): VdjXmlNode {
    if (path.length === 1) {
        const [target] = path;
        return { ...root, children: root.children.filter((_, index) => index !== target) };
    }

    const [head, ...rest] = path;
    return {
        ...root,
        children: root.children.map((child, index) => index === head ? removeNodeAtPath(child, rest) : child),
    };
}

function XmlNodeEditor({
    node,
    path,
    isRoot = false,
    onChange,
    onRemove,
}: {
    node: VdjXmlNode;
    path: number[];
    isRoot?: boolean;
    onChange: (path: number[], updater: (node: VdjXmlNode) => VdjXmlNode) => void;
    onRemove?: (path: number[]) => void;
}) {
    const attributeEntries = Object.entries(node.attributes);

    const setAttribute = (key: string, value: string) => {
        onChange(path, (current) => ({
            ...current,
            attributes: { ...current.attributes, [key]: value },
        }));
    };

    const renameAttribute = (oldKey: string, newKey: string) => {
        onChange(path, (current) => {
            const nextAttributes = { ...current.attributes };
            const preservedValue = nextAttributes[oldKey] ?? "";
            delete nextAttributes[oldKey];
            if (newKey.trim()) nextAttributes[newKey] = preservedValue;
            return { ...current, attributes: nextAttributes };
        });
    };

    const removeAttribute = (key: string) => {
        onChange(path, (current) => {
            const nextAttributes = { ...current.attributes };
            delete nextAttributes[key];
            return { ...current, attributes: nextAttributes };
        });
    };

    const addAttribute = () => {
        onChange(path, (current) => {
            let counter = 1;
            let key = `attr${counter}`;
            while (Object.prototype.hasOwnProperty.call(current.attributes, key)) {
                counter += 1;
                key = `attr${counter}`;
            }
            return {
                ...current,
                attributes: { ...current.attributes, [key]: "" },
            };
        });
    };

    const addChild = () => {
        onChange(path, (current) => ({
            ...current,
            children: [...current.children, { name: "item", attributes: {}, text: null, children: [] }],
        }));
    };

    return (
        <div className="rounded border border-border/60 bg-surface-hover/20 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-text">
                    {isRoot ? "Nodo raíz" : "Nodo"}
                    <span className="ml-2 rounded bg-background px-2 py-0.5 font-mono text-xs text-text-muted">{node.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={addChild} className="btn btn-ghost btn-sm">
                        <Plus className="h-3.5 w-3.5" /> Hijo
                    </button>
                    {!isRoot && onRemove ? (
                        <button type="button" onClick={() => onRemove(path)} className="btn btn-ghost btn-sm text-danger">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs text-text-muted">
                    <span>Nombre del nodo</span>
                    <input
                        className="input w-full font-mono"
                        value={node.name}
                        onChange={(e) => onChange(path, (current) => ({ ...current, name: e.target.value }))}
                    />
                </label>
                <label className="space-y-1 text-xs text-text-muted md:col-span-2">
                    <span>Texto</span>
                    <textarea
                        className="min-h-20 w-full rounded border-2 border-border bg-background p-2 font-mono text-[12px] text-text outline-none focus:border-primary/60"
                        value={node.text ?? ""}
                        onChange={(e) => onChange(path, (current) => ({ ...current, text: e.target.value || null }))}
                        spellCheck={false}
                    />
                </label>
            </div>

            <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-text-muted">Atributos</div>
                    <button type="button" onClick={addAttribute} className="btn btn-ghost btn-sm">
                        <Plus className="h-3.5 w-3.5" /> Atributo
                    </button>
                </div>
                {attributeEntries.length === 0 ? (
                    <div className="text-xs text-text-muted">Este nodo no tiene atributos.</div>
                ) : attributeEntries.map(([key, value]) => (
                    <div key={`${path.join("-")}-${key}`} className="grid gap-2 md:grid-cols-[220px_1fr_auto] md:items-center">
                        <input className="input w-full font-mono" value={key} onChange={(e) => renameAttribute(key, e.target.value)} />
                        <input className="input w-full font-mono" value={value} onChange={(e) => setAttribute(key, e.target.value)} />
                        <button type="button" onClick={() => removeAttribute(key)} className="btn btn-ghost btn-sm text-danger">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {node.children.length > 0 ? (
                <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-text-muted">Hijos ({node.children.length})</div>
                    {node.children.map((child, index) => (
                        <XmlNodeEditor
                            key={`${path.join("-")}-${child.name}-${index}`}
                            node={child}
                            path={[...path, index]}
                            onChange={onChange}
                            onRemove={onRemove}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function PadPageEditor({
    documentTree,
    onChange,
}: {
    documentTree: VdjXmlNode;
    onChange: (path: number[], updater: (node: VdjXmlNode) => VdjXmlNode) => void;
}) {
    const pads = documentTree.children.map((node, index) => ({ node, path: [index], index }));
    const params = pads.filter(({ node }) => node.name.toLowerCase().startsWith("param"));
    const padButtons = pads.filter(({ node }) => !node.name.toLowerCase().startsWith("param"));

    const setNodeAttribute = (path: number[], key: string, value: string) => {
        onChange(path, (current) => ({
            ...current,
            attributes: value
                ? { ...current.attributes, [key]: value }
                : Object.fromEntries(Object.entries(current.attributes).filter(([attr]) => attr !== key)),
        }));
    };

    return (
        <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
            <section className="card p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-sm font-semibold text-text">Botones del pad</h4>
                        <p className="mt-1 text-[12px] text-text-muted">Edita nombre, color y acción sin tocar XML.</p>
                    </div>
                    <span className="badge bg-primary/12 text-primary-light">{padButtons.length} pads</span>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                    {padButtons.map(({ node, path, index }) => (
                        <article key={`${node.name}-${index}`} className="rounded-lg border border-border/60 bg-background/45 p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="badge bg-surface px-2 py-0.5 font-mono text-xs text-text-muted">{node.name}</span>
                                <input
                                    type="text"
                                    className="input max-w-38 font-mono text-xs"
                                    value={node.attributes.color ?? ""}
                                    onChange={(event) => setNodeAttribute(path, "color", event.target.value)}
                                    placeholder="color"
                                />
                            </div>
                            <label className="space-y-1 text-xs text-text-muted">
                                <span>Etiqueta</span>
                                <input
                                    className="input w-full"
                                    value={node.attributes.name ?? ""}
                                    onChange={(event) => setNodeAttribute(path, "name", event.target.value)}
                                    placeholder="Nombre visible"
                                />
                            </label>
                            <label className="mt-3 block space-y-1 text-xs text-text-muted">
                                <span>Acción VDJScript</span>
                                <textarea
                                    className="min-h-24 w-full rounded-lg border border-border bg-background p-2 font-mono text-[12px] text-text outline-none focus:border-primary/60"
                                    value={node.text ?? ""}
                                    onChange={(event) => onChange(path, (current) => ({ ...current, text: event.target.value || null }))}
                                    spellCheck={false}
                                />
                            </label>
                        </article>
                    ))}
                </div>

                {padButtons.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-text-muted">
                        No se detectaron nodos de pad editables en este archivo.
                    </div>
                ) : null}
            </section>

            <aside className="space-y-3">
                <section className="card p-4">
                    <h4 className="text-sm font-semibold text-text">Página</h4>
                    <div className="mt-3 grid gap-2">
                        <label className="space-y-1 text-xs text-text-muted">
                            <span>Nodo raíz</span>
                            <input className="input w-full font-mono" value={documentTree.name} onChange={(event) => onChange([], (current) => ({ ...current, name: event.target.value }))} />
                        </label>
                        {Object.entries(documentTree.attributes).map(([key, value]) => (
                            <label key={key} className="space-y-1 text-xs text-text-muted">
                                <span className="font-mono">{key}</span>
                                <input className="input w-full font-mono" value={value} onChange={(event) => setNodeAttribute([], key, event.target.value)} />
                            </label>
                        ))}
                    </div>
                </section>

                <section className="card p-4">
                    <h4 className="text-sm font-semibold text-text">Parámetros</h4>
                    <div className="mt-3 space-y-2">
                        {params.map(({ node, path, index }) => (
                            <div key={`${node.name}-${index}`} className="rounded-lg border border-border/60 bg-background/45 p-2">
                                <div className="mb-2 font-mono text-xs text-primary-light">{node.name}</div>
                                <input
                                    className="input mb-2 w-full"
                                    value={node.attributes.name ?? ""}
                                    onChange={(event) => setNodeAttribute(path, "name", event.target.value)}
                                    placeholder="Nombre"
                                />
                                <textarea
                                    className="min-h-16 w-full rounded-lg border border-border bg-background p-2 font-mono text-xs text-text outline-none focus:border-primary/60"
                                    value={node.text ?? ""}
                                    onChange={(event) => onChange(path, (current) => ({ ...current, text: event.target.value || null }))}
                                    spellCheck={false}
                                />
                            </div>
                        ))}
                        {params.length === 0 ? <p className="text-[12px] text-text-muted">Sin parámetros detectados.</p> : null}
                    </div>
                </section>
            </aside>
        </div>
    );
}

/** Structured pad editor with XML tree editing for `.vdjpad` files. */
export function Pads() {
    const { vdjFolder, clearUiError, reportUiError, services } = useApp();
    const [files, setFiles] = useState<VdjConfigFileInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rawContent, setRawContent] = useState("");
    const [rawDirty, setRawDirty] = useState(false);
    const [documentTree, setDocumentTree] = useState<VdjXmlNode | null>(null);
    const [documentDirty, setDocumentDirty] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [editorMode, setEditorMode] = useState<PadEditorMode>("visual");
    const [pendingSelectedId, setPendingSelectedId] = useState<string | null>(null);

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
                return relative.startsWith("pads/") || relative.startsWith("pads\\") || relative.endsWith(".vdjpad");
            }));
        } catch (err) {
            reportUiError("No se pudieron cargar los recursos de pads.", err);
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
            setDocumentTree(null);
            setDocumentDirty(false);
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
                if (!cancelled) reportUiError("No se pudo abrir el XML del pad.", err);
            });

        if (isPadDocumentFile(selectedFile)) {
            services.getVdjPadDocument(vdjFolder, selectedFile.path)
                .then((document) => {
                    if (cancelled) return;
                    setDocumentTree(document);
                    setDocumentDirty(false);
                })
                .catch((err) => {
                    if (!cancelled) {
                        setDocumentTree(null);
                        reportUiError("No se pudo interpretar el documento de pads.", err);
                    }
                });
        } else {
            setDocumentTree(null);
            setDocumentDirty(false);
        }

        return () => {
            cancelled = true;
        };
    }, [reportUiError, selectedFile, services, vdjFolder]);

    const updateDocumentNode = (path: number[], updater: (node: VdjXmlNode) => VdjXmlNode) => {
        setDocumentTree((prev) => prev ? updateNodeAtPath(prev, path, updater) : prev);
        setDocumentDirty(true);
    };

    const removeDocumentNode = (path: number[]) => {
        setDocumentTree((prev) => prev ? removeNodeAtPath(prev, path) : prev);
        setDocumentDirty(true);
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
            reportUiError("No se pudo guardar el XML del pad.", err);
        } finally {
            setSaving(false);
        }
    }, [clearUiError, loadFiles, rawContent, rawDirty, reportUiError, selectedFile, services, vdjFolder]);

    const saveDocument = useCallback(async () => {
        if (!vdjFolder || !selectedFile || !documentTree || !documentDirty) return;
        setSaving(true);
        try {
            const backup = await services.updateVdjPadDocument(vdjFolder, selectedFile.path, documentTree);
            setLastBackup(backup || null);
            setDocumentDirty(false);
            const refreshed = await services.readVdjConfigFile(vdjFolder, selectedFile.path);
            setRawContent(refreshed);
            setRawDirty(false);
            await loadFiles();
            clearUiError();
        } catch (err) {
            reportUiError("No se pudo guardar el documento de pads.", err);
        } finally {
            setSaving(false);
        }
    }, [clearUiError, documentDirty, documentTree, loadFiles, reportUiError, selectedFile, services, vdjFolder]);

    const revertChanges = useCallback(async () => {
        if (!vdjFolder || !selectedFile) return;
        setSaving(true);
        try {
            const raw = await services.readVdjConfigFile(vdjFolder, selectedFile.path);
            setRawContent(raw);
            setRawDirty(false);
            if (isPadDocumentFile(selectedFile)) {
                const document = await services.getVdjPadDocument(vdjFolder, selectedFile.path);
                setDocumentTree(document);
            } else {
                setDocumentTree(null);
            }
            setDocumentDirty(false);
            clearUiError();
        } catch (err) {
            reportUiError("No se pudo restaurar la última versión del pad.", err);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [clearUiError, reportUiError, selectedFile, services, vdjFolder]);

    const retryLoad = useCallback(async () => {
        await loadFiles();
        await revertChanges();
    }, [loadFiles, revertChanges]);

    const resourceDirty = documentDirty || rawDirty;
    useResourceEditorState({
        dirty: resourceDirty,
        busy: loading || saving,
        save: documentDirty ? saveDocument : saveRaw,
        revert: revertChanges,
        retry: retryLoad,
    });

    const requestFileSelection = (path: string) => {
        if (path === selectedId) return;
        if (resourceDirty) setPendingSelectedId(path);
        else setSelectedId(path);
    };

    const confirmFileSelection = async () => {
        const nextId = pendingSelectedId;
        if (!nextId) return;
        try {
            await revertChanges();
            setPendingSelectedId(null);
            setSelectedId(nextId);
        } catch {
            setPendingSelectedId(null);
        }
    };

    return (
        <div className="flex h-full gap-0 code-workspace">
            <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-surface/85">
                <div className="border-b border-border px-3 py-3">
                    <h2 className="text-sm font-semibold text-text">Pads</h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                        Editor visual para páginas y recursos de pads. Para opciones globales como <code>padsPagesOrder</code> o <code>padsSkinIndependent</code>, usa Configuración.
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
                            onSelect={(item) => requestFileSelection(item.path)}
                            emptyLabel="No se encontraron archivos de pads en la carpeta VirtualDJ."
                        />
                    )}
                </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-auto p-3">
                {!selectedFile ? (
                    <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                        Selecciona un archivo de pads del árbol.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-text">{selectedFile.name}</h3>
                                <p className="mt-1 text-sm text-text-muted">{selectedFile.relative_path}</p>
                                <p className="mt-1 text-xs text-text-muted">Tamaño: {formatSize(selectedFile.size_bytes)}</p>
                            </div>
                        </div>

                        {lastBackup ? (
                            <div className="rounded border border-success/30 bg-success/8 px-3 py-2 text-[12px] text-success">
                                Backup creado: <span className="font-mono">{lastBackup}</span>
                            </div>
                        ) : null}

                        {isPadDocumentFile(selectedFile) && documentTree ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="tab-group w-80">
                                        <button type="button" className={`tab-item ${editorMode === "visual" ? "tab-active" : ""}`} onClick={() => setEditorMode("visual")}>
                                            <LayoutGrid className="mr-1 inline h-3.5 w-3.5" /> Visual
                                        </button>
                                        <button type="button" className={`tab-item ${editorMode === "xml" ? "tab-active" : ""}`} onClick={() => setEditorMode("xml")}>
                                            <FileCode2 className="mr-1 inline h-3.5 w-3.5" /> XML
                                        </button>
                                    </div>
                                    <span className="text-xs text-text-muted">El modo XML queda como respaldo avanzado.</span>
                                </div>
                                {editorMode === "visual" ? (
                                    <PadPageEditor documentTree={documentTree} onChange={updateDocumentNode} />
                                ) : (
                                    <XmlNodeEditor node={documentTree} path={[]} isRoot onChange={updateDocumentNode} onRemove={removeDocumentNode} />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-lg border border-warning/25 bg-warning/8 p-4 text-sm text-text-muted">
                                    Este archivo no se pudo abrir como <code>.vdjpad</code> estructurado. Se muestra en modo texto para mantener compatibilidad.
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
                open={pendingSelectedId !== null}
                title="Cambios pendientes en este pad"
                description="Antes de abrir otro archivo se restaurará la última versión cargada del pad actual."
                confirmLabel="Descartar y abrir"
                destructive
                onCancel={() => setPendingSelectedId(null)}
                onConfirm={confirmFileSelection}
            />
        </div>
    );
}
