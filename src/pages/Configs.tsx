import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../App";
import type { VdjSettingEntry } from "../types/database";

function normalizeBooleanInput(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "on", "1"].includes(normalized)) return "yes";
    if (["false", "no", "off", "0"].includes(normalized)) return "no";
    return value;
}

function looksBoolean(value: string | null): boolean {
    if (value == null) return false;
    return ["yes", "no", "true", "false", "on", "off", "0", "1"].includes(value.trim().toLowerCase());
}

/** Focused editor for VirtualDJ `settings.xml` using a curated subset of documented options. */
export function Configs() {
    const { vdjFolder, clearUiError, reportUiError, services } = useApp();
    const [settings, setSettings] = useState<VdjSettingEntry[]>([]);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [lastBackup, setLastBackup] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        if (!vdjFolder) {
            setSettings([]);
            setDraft({});
            return;
        }

        setLoading(true);
        try {
            const result = await services.getVdjSettings(vdjFolder);
            setSettings(result);
            setDraft(Object.fromEntries(result.map((entry) => [entry.key, entry.value ?? ""])));
        } catch (err) {
            reportUiError("No se pudo cargar settings.xml.", err);
        } finally {
            setLoading(false);
        }
    }, [reportUiError, services, vdjFolder]);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const filteredSettings = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return settings;

        return settings.filter((entry) =>
            entry.key.toLowerCase().includes(q)
            || entry.label.toLowerCase().includes(q)
            || entry.description.toLowerCase().includes(q)
            || entry.category.toLowerCase().includes(q),
        );
    }, [search, settings]);

    const groupedSettings = useMemo(() => {
        const groups = new Map<string, VdjSettingEntry[]>();
        for (const entry of filteredSettings) {
            const bucket = groups.get(entry.category);
            if (bucket) bucket.push(entry);
            else groups.set(entry.category, [entry]);
        }
        return [...groups.entries()];
    }, [filteredSettings]);

    const dirtyCount = useMemo(
        () => settings.filter((entry) => (draft[entry.key] ?? "") !== (entry.value ?? "")).length,
        [draft, settings],
    );

    const onDraftChange = useCallback((key: string, value: string) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    }, []);

    const saveChanges = useCallback(async () => {
        if (!vdjFolder || dirtyCount === 0) return;

        const updates = Object.fromEntries(
            settings
                .filter((entry) => (draft[entry.key] ?? "") !== (entry.value ?? ""))
                .map((entry) => [entry.key, normalizeBooleanInput(draft[entry.key] ?? "")]),
        );

        setSaving(true);
        try {
            const backup = await services.updateVdjSettings(vdjFolder, updates);
            setLastBackup(backup);
            await loadSettings();
            clearUiError();
        } catch (err) {
            reportUiError("No se pudieron guardar los cambios de settings.xml.", err);
        } finally {
            setSaving(false);
        }
    }, [clearUiError, dirtyCount, draft, loadSettings, reportUiError, services, settings, vdjFolder]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-text">Configuración de VirtualDJ</h2>
                    <p className="mt-1 max-w-3xl text-sm text-text-muted">
                        Vista enfocada en <code>settings.xml</code> con opciones curadas a partir de la documentación oficial de VirtualDJ,
                        especialmente biblioteca, playlists, waveforms, cues, seguridad y rendimiento.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {dirtyCount > 0 && (
                        <span className="rounded bg-warning/15 px-2 py-1 text-xs text-warning">
                            {dirtyCount} cambio(s) pendiente(s)
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={saveChanges}
                        disabled={saving || dirtyCount === 0}
                        className="btn btn-primary btn-sm"
                    >
                        {saving ? "Guardando..." : "Guardar settings.xml"}
                    </button>
                </div>
            </div>

            {lastBackup && (
                <div className="rounded border border-success/30 bg-success/8 px-3 py-2 text-[12px] text-success">
                    Backup creado: <span className="font-mono">{lastBackup}</span>
                </div>
            )}

            <div className="card p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <input
                        type="text"
                        className="input md:max-w-md"
                        placeholder="Buscar opción, categoría o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="text-xs text-text-muted">
                        {loading ? "Cargando settings.xml..." : `${filteredSettings.length} opción(es) visibles`}
                    </div>
                </div>
            </div>

            {!loading && groupedSettings.length === 0 && (
                <div className="rounded border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                    No se encontraron opciones para ese filtro.
                </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
                {groupedSettings.map(([category, entries]) => (
                    <section key={category} className="card p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-text">{category}</h3>
                            <span className="text-xs uppercase tracking-wider text-text-muted">
                                {entries.length} opción(es)
                            </span>
                        </div>

                        <div className="space-y-3">
                            {entries.map((entry) => {
                                const currentValue = draft[entry.key] ?? "";
                                const isBoolean = looksBoolean(entry.value);
                                const isAvailable = entry.value !== null;

                                return (
                                    <div key={entry.key} className="rounded border border-border/60 bg-surface-hover/20 p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <div className="text-sm font-medium text-text">{entry.label}</div>
                                                <div className="mt-0.5 text-xs text-text-muted">{entry.description}</div>
                                            </div>
                                            <span className="rounded bg-background px-2 py-0.5 font-mono text-xs text-text-muted">
                                                {entry.key}
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            {isBoolean ? (
                                                <select
                                                    className="input w-full"
                                                    value={normalizeBooleanInput(currentValue || entry.value || "no")}
                                                    onChange={(e) => onDraftChange(entry.key, e.target.value)}
                                                    disabled={!isAvailable}
                                                >
                                                    <option value="yes">yes</option>
                                                    <option value="no">no</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="input w-full"
                                                    value={currentValue}
                                                    onChange={(e) => onDraftChange(entry.key, e.target.value)}
                                                    disabled={!isAvailable}
                                                />
                                            )}
                                        </div>

                                        {entry.value !== null ? (
                                            <div className="mt-2 text-xs text-text-muted">
                                                Valor actual cargado: <span className="font-mono text-text-secondary">{entry.value}</span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-text-muted">
                                                Esta opción no aparece en el <span className="font-mono">settings.xml</span> actual.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
