import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useApp } from "../App";
import { TreeFileNavigator, type TreeFileItem } from "../components/TreeFileNavigator";
import { formatSize, getVdjPadDocument, listVdjConfigFiles, readVdjConfigFile, updateVdjPadDocument, writeVdjConfigFile } from "../lib/api";
import type { VdjConfigFileInfo, VdjXmlNode } from "../types/database";

function isPadDocumentFile(file: VdjConfigFileInfo | null): boolean {
    return !!file?.path.toLowerCase().endsWith(".vdjpad");
}

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
                    <span className="ml-2 rounded bg-background px-2 py-0.5 font-mono text-[10px] text-text-muted">{node.name}</span>
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
                <label className="space-y-1 text-[11px] text-text-muted">
                    <span>Nombre del nodo</span>
                    <input
                        className="input w-full font-mono"
                        value={node.name}
                        onChange={(e) => onChange(path, (current) => ({ ...current, name: e.target.value }))}
                    />
                </label>
                <label className="space-y-1 text-[11px] text-text-muted md:col-span-2">
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
                    <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Atributos</div>
                    <button type="button" onClick={addAttribute} className="btn btn-ghost btn-sm">
                        <Plus className="h-3.5 w-3.5" /> Atributo
                    </button>
                </div>
                {attributeEntries.length === 0 ? (
                    <div className="text-[11px] text-text-muted">Este nodo no tiene atributos.</div>
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
                    <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Hijos ({node.children.length})</div>
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

/** Structured pad editor with XML tree editing for `.vdjpad` files. */
export function Pads() {
    const { vdjFolder, setError } = useApp();
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

    const loadFiles = useCallback(async () => {
        if (!vdjFolder) {
            setFiles([]);
            return;
        }
        setLoading(true);
        try {
            const result = await listVdjConfigFiles(vdjFolder);
            setFiles(result.filter((file) => {
                const relative = file.relative_path.toLowerCase();
                return relative.startsWith("pads/") || relative.startsWith("pads\\") || relative.endsWith(".vdjpad");
            }));
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }, [setError, vdjFolder]);

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
        readVdjConfigFile(vdjFolder, selectedFile.path)
            .then((content) => {
                if (cancelled) return;
                setRawContent(content);
                setRawDirty(false);
            })
            .catch((err) => {
                if (!cancelled) setError(String(err));
            });

        if (isPadDocumentFile(selectedFile)) {
            getVdjPadDocument(vdjFolder, selectedFile.path)
                .then((document) => {
                    if (cancelled) return;
                    setDocumentTree(document);
                    setDocumentDirty(false);
                })
                .catch((err) => {
                    if (!cancelled) {
                        setDocumentTree(null);
                        setError(String(err));
                    }
                });
        } else {
            setDocumentTree(null);
            setDocumentDirty(false);
        }

        return () => {
            cancelled = true;
        };
    }, [selectedFile, setError, vdjFolder]);

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
            const backup = await writeVdjConfigFile(vdjFolder, selectedFile.path, rawContent);
            setLastBackup(backup || null);
            setRawDirty(false);
            await loadFiles();
            setError(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
        }
    }, [loadFiles, rawContent, rawDirty, selectedFile, setError, vdjFolder]);

    const saveDocument = useCallback(async () => {
        if (!vdjFolder || !selectedFile || !documentTree || !documentDirty) return;
        setSaving(true);
        try {
            const backup = await updateVdjPadDocument(vdjFolder, selectedFile.path, documentTree);
            setLastBackup(backup || null);
            setDocumentDirty(false);
            const refreshed = await readVdjConfigFile(vdjFolder, selectedFile.path);
            setRawContent(refreshed);
            setRawDirty(false);
            await loadFiles();
            setError(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
        }
    }, [documentDirty, documentTree, loadFiles, selectedFile, setError, vdjFolder]);

    return (
        <div className="flex h-full gap-0">
            <aside className="flex w-80 shrink-0 flex-col border-r-2 border-border bg-surface">
                <div className="border-b-2 border-border px-3 py-2">
                    <h2 className="text-sm font-semibold text-text">Pads</h2>
                    <p className="mt-0.5 text-[11px] text-text-muted">
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
                        <div className="p-2 text-[11px] text-text-muted">Cargando archivos...</div>
                    ) : (
                        <TreeFileNavigator
                            items={treeItems}
                            selectedId={selectedId}
                            onSelect={(item) => setSelectedId(item.path)}
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
                                <p className="mt-1 text-[11px] text-text-muted">Tamaño: {formatSize(selectedFile.size_bytes)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {documentDirty || rawDirty ? <span className="rounded bg-warning/15 px-2 py-1 text-[11px] text-warning">Cambios pendientes</span> : null}
                                {isPadDocumentFile(selectedFile) && documentTree ? (
                                    <button type="button" onClick={saveDocument} disabled={saving || !documentDirty} className="btn btn-primary btn-sm">
                                        <Save className="h-3.5 w-3.5" /> Guardar pad
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

                        {isPadDocumentFile(selectedFile) && documentTree ? (
                            <div className="space-y-4">
                                <div className="card p-4 text-sm text-text-muted">
                                    <p>
                                        Esta vista permite editar la estructura XML del pad sin bajar directamente a texto: nodos, atributos, texto interno y jerarquía.
                                    </p>
                                    <p className="mt-2">
                                        Ideal para mantener una interfaz competente en <strong>Pads</strong>, igual que ya hicimos en <strong>Mappers</strong>.
                                    </p>
                                </div>
                                <XmlNodeEditor node={documentTree} path={[]} isRoot onChange={updateDocumentNode} onRemove={removeDocumentNode} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="card p-4 text-sm text-text-muted">
                                    Este archivo no se pudo abrir como <code>.vdjpad</code> estructurado. Se muestra en modo texto para mantener compatibilidad.
                                </div>
                                <textarea
                                    className="h-[calc(100vh-260px)] w-full rounded border-2 border-border bg-background p-3 font-mono text-[12px] text-text outline-none focus:border-primary/60"
                                    value={rawContent}
                                    onChange={(e) => {
                                        setRawContent(e.target.value);
                                        setRawDirty(true);
                                    }}
                                    spellCheck={false}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
