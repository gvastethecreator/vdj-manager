import { AlertTriangle, DatabaseBackup, FileCheck2, ShieldCheck } from "lucide-react";
import { useApp } from "../App";

/** Persistent safety context for database-writing workflows. */
export function SafetyInspector() {
    const { songs, stats, setPage } = useApp();
    const missingTags = songs.filter((song) => !song.title || !song.author || !song.bpm).length;
    const externalSongs = songs.filter((song) => !song.in_database).length;
    const cueCoverage = stats && stats.total_songs > 0
        ? Math.round((stats.songs_with_cues / stats.total_songs) * 100)
        : 0;

    return (
        <aside className="hidden w-72 shrink-0 border-l border-border bg-surface/75 p-3 2xl:block">
            <div className="space-y-3">
                <section className="card p-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/12 text-success">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-text">Guard rails</h2>
                            <p className="text-[11px] text-text-muted">Backups antes de escrituras críticas</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2 text-[12px]">
                        <div className="flex items-center justify-between">
                            <span className="text-text-muted">database.xml</span>
                            <span className="badge bg-success/12 text-success">backup</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-muted">settings / pads / mappers</span>
                            <span className="badge bg-success/12 text-success">backup</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-text-muted">writes</span>
                            <span className="badge bg-info/12 text-info">atomic</span>
                        </div>
                    </div>
                </section>

                <section className="card p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-[12px] font-semibold text-text">Calidad de librería</h3>
                        <FileCheck2 className="h-4 w-4 text-info" />
                    </div>
                    <div className="space-y-3">
                        <Metric label="Tracks" value={stats?.total_songs.toLocaleString() ?? songs.length.toLocaleString()} />
                        <Metric label="Cue coverage" value={`${cueCoverage}%`} />
                        <Metric label="Faltan tags clave" value={missingTags.toLocaleString()} tone={missingTags > 0 ? "warning" : "success"} />
                        <Metric label="Fuera de database.xml" value={externalSongs.toLocaleString()} tone={externalSongs > 0 ? "info" : "muted"} />
                    </div>
                </section>

                <section className="card p-3">
                    <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <h3 className="text-[12px] font-semibold text-text">Revisiones rápidas</h3>
                    </div>
                    <div className="grid gap-2">
                        <button type="button" className="btn btn-ghost btn-sm justify-start" onClick={() => setPage("missing")}>
                            Archivos faltantes
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm justify-start" onClick={() => setPage("duplicates")}>
                            Duplicados
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm justify-start" onClick={() => setPage("batch")}>
                            Operaciones en lote
                        </button>
                    </div>
                </section>

                <section className="rounded-lg border border-primary/20 bg-primary/8 p-3">
                    <div className="mb-2 flex items-center gap-2 text-primary-light">
                        <DatabaseBackup className="h-4 w-4" />
                        <h3 className="text-[12px] font-semibold">Modo escritura</h3>
                    </div>
                    <p className="text-[11px] leading-relaxed text-text-secondary">
                        VirtualDJ documenta <code>database.xml</code> para lectura externa. Las acciones que lo editan deben ser deliberadas y auditables.
                    </p>
                </section>
            </div>
        </aside>
    );
}

function Metric({
    label,
    value,
    tone = "muted",
}: {
    label: string;
    value: string;
    tone?: "muted" | "success" | "warning" | "info";
}) {
    const toneClass = {
        muted: "text-text",
        success: "text-success",
        warning: "text-warning",
        info: "text-info",
    }[tone];

    return (
        <div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-text-muted">{label}</span>
                <span className={`font-semibold tabular-nums ${toneClass}`}>{value}</span>
            </div>
            <div className="mt-1 h-px bg-border/70" />
        </div>
    );
}
