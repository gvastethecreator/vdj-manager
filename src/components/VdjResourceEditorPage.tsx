import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { listVdjConfigFiles, readVdjConfigFile, writeVdjConfigFile, formatSize } from "../lib/api";
import { useApp } from "../App";
import type { VdjConfigFileInfo } from "../types/database";
import { CodeEditor } from "./CodeEditor";
import { TreeFileNavigator, type TreeFileItem } from "./TreeFileNavigator";

export function VdjResourceEditorPage({
    title,
    subtitle,
    emptyLabel,
    filter,
    intro,
}: {
    title: string;
    subtitle: string;
    emptyLabel: string;
    filter: (file: VdjConfigFileInfo) => boolean;
    intro?: ReactNode;
}) {
    const { vdjFolder, setError } = useApp();
    const [files, setFiles] = useState<VdjConfigFileInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [dirty, setDirty] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        if (!vdjFolder) {
            setFiles([]);
            return;
        }

        setLoading(true);
        try {
            const result = await listVdjConfigFiles(vdjFolder);
            setFiles(result.filter(filter));
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }, [filter, setError, vdjFolder]);

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

    const selectedFile = useMemo(
        () => files.find((file) => file.path === selectedId) ?? null,
        [files, selectedId],
    );

    useEffect(() => {
        if (files.length === 0) {
            setSelectedId(null);
            return;
        }

        setSelectedId((prev) => prev && files.some((file) => file.path === prev) ? prev : files[0].path);
    }, [files]);

    useEffect(() => {
        if (!vdjFolder || !selectedFile) {
            setContent("");
            setDirty(false);
            return;
        }

        let cancelled = false;
        readVdjConfigFile(vdjFolder, selectedFile.path)
            .then((value) => {
                if (cancelled) return;
                setContent(value);
                setDirty(false);
            })
            .catch((err) => {
                if (!cancelled) setError(String(err));
            });

        return () => {
            cancelled = true;
        };
    }, [selectedFile, setError, vdjFolder]);

    const save = useCallback(async () => {
        if (!vdjFolder || !selectedFile || !dirty) return;
        setSaving(true);
        try {
            const backup = await writeVdjConfigFile(vdjFolder, selectedFile.path, content);
            setLastBackup(backup || null);
            setDirty(false);
            setError(null);
            await loadFiles();
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
        }
    }, [content, dirty, loadFiles, selectedFile, setError, vdjFolder]);

    return (
        <div className="flex h-full gap-0 code-workspace">
            <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-surface/85">
                <div className="border-b border-border px-3 py-3">
                    <h2 className="text-sm font-semibold text-text">{title}</h2>
                    <p className="mt-0.5 text-[11px] text-text-muted">{subtitle}</p>
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
                            emptyLabel={emptyLabel}
                        />
                    )}
                </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-auto p-3">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-text">{title}</h3>
                            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {dirty ? <span className="rounded bg-warning/15 px-2 py-1 text-[11px] text-warning">Cambios pendientes</span> : null}
                            <button type="button" onClick={save} disabled={!dirty || saving || !selectedFile} className="btn btn-primary btn-sm">
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>

                    {intro ? <div className="card p-3 text-sm text-text-muted">{intro}</div> : null}

                    {lastBackup ? (
                        <div className="rounded border border-success/30 bg-success/8 px-3 py-2 text-[12px] text-success">
                            Backup creado: <span className="font-mono">{lastBackup}</span>
                        </div>
                    ) : null}

                    {!selectedFile ? (
                        <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                            {emptyLabel}
                        </div>
                    ) : (
                        <>
                            <div className="card p-3">
                                <div className="text-sm font-semibold text-text">{selectedFile.name}</div>
                                <div className="mt-1 text-[11px] text-text-muted">{selectedFile.relative_path}</div>
                                <div className="mt-2 text-[11px] text-text-muted">Tamaño: {formatSize(selectedFile.size_bytes)}</div>
                            </div>
                            <CodeEditor
                                label={selectedFile.name}
                                value={content}
                                onChange={(value) => {
                                    setContent(value);
                                    setDirty(true);
                                }}
                                dirty={dirty}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
