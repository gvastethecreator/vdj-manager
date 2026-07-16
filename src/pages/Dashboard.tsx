import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  FileSearch,
  FolderSearch,
  Music2,
} from "lucide-react";
import { useApp } from "../App";
import { formatSize } from "../lib/api";
import { buildAttentionQueue, displayScanCount, type AttentionTone } from "../lib/operationalState";

const TONE_STYLES: Record<AttentionTone, { border: string; icon: string; label: string }> = {
  critical: { border: "border-error/40", icon: "bg-error/12 text-error", label: "Urgente" },
  warning: { border: "border-warning/40", icon: "bg-warning/12 text-warning", label: "Revisar" },
  neutral: { border: "border-border", icon: "bg-surface-active text-text-muted", label: "Pendiente" },
  success: { border: "border-success/35", icon: "bg-success/12 text-success", label: "Al día" },
};

/** Action-first operational dashboard. Counts from scans remain unverified until run. */
export function Dashboard() {
  const { stats, songs, integrity, mutationsBlocked, setNavigation } = useApp();

  if (!stats) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-muted">
        No hay una biblioteca cargada.
      </div>
    );
  }

  const attention = buildAttentionQueue(integrity, mutationsBlocked);
  const missingMetadata = songs.filter((song) => song.in_database && (!song.title || !song.author || !song.bpm)).length;
  const updatedLabel = integrity.updatedAt
    ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(integrity.updatedAt))
    : "Nunca";

  const actOn = (itemId: string, navigation: Parameters<typeof setNavigation>[0]) => {
    if (itemId === "recovery") {
      document.getElementById("recovery-center")?.scrollIntoView({ block: "start" });
      return;
    }
    setNavigation(navigation);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-light">Centro operativo</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Qué necesita atención</h1>
          <p className="mt-1 text-sm text-text-secondary">Prioridades de esta biblioteca y la próxima acción segura.</p>
        </div>
        <div className="text-right text-xs text-text-muted">
          <div className="flex items-center justify-end gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Último análisis</div>
          <div className="mt-1 font-medium text-text-secondary">{updatedLabel}</div>
        </div>
      </header>

      <div className="grid min-h-[360px] gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="attention-title">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="attention-title" className="text-sm font-semibold text-text">Cola de atención</h2>
            <span className="text-xs text-text-muted">{attention.length} {attention.length === 1 ? "acción" : "acciones"}</span>
          </div>
          <div className="divide-y divide-border">
            {attention.map((item, index) => {
              const tone = TONE_STYLES[item.tone];
              const ItemIcon = item.tone === "success" ? CheckCircle2 : AlertTriangle;
              return (
                <article key={item.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-l-2 px-4 py-4 ${tone.border}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${tone.icon}`}>
                    <ItemIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-text-muted">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="truncate text-sm font-semibold text-text">{item.title}</h3>
                      <span className={`badge ${tone.icon}`}>{tone.label}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.detail}</p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => actOn(item.id, item.navigation)}>
                    {item.actionLabel}<ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-surface" aria-labelledby="next-title">
          <div className="border-b border-border px-4 py-3">
            <h2 id="next-title" className="text-sm font-semibold text-text">Próximos pasos</h2>
            <p className="mt-0.5 text-xs text-text-muted">Estado real de los análisis de sesión.</p>
          </div>
          <div className="divide-y divide-border">
            <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface-hover" onClick={() => setNavigation({ workspace: "integrity", section: "missing" })}>
              <FileSearch className="h-5 w-5 text-primary-light" />
              <span className="min-w-0 flex-1"><strong className="block text-sm text-text">Rutas y tamaños</strong><span className="text-xs text-text-muted">Faltantes: {displayScanCount(integrity.missing)}</span></span>
              <ArrowRight className="h-4 w-4 text-text-muted" />
            </button>
            <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface-hover" onClick={() => setNavigation({ workspace: "integrity", section: "duplicates" })}>
              <Copy className="h-5 w-5 text-primary-light" />
              <span className="min-w-0 flex-1"><strong className="block text-sm text-text">Duplicados</strong><span className="text-xs text-text-muted">Grupos: {displayScanCount(integrity.duplicateGroups)}</span></span>
              <ArrowRight className="h-4 w-4 text-text-muted" />
            </button>
            <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface-hover" onClick={() => setNavigation({ workspace: "integrity", section: "orphans" })}>
              <FolderSearch className="h-5 w-5 text-primary-light" />
              <span className="min-w-0 flex-1"><strong className="block text-sm text-text">Archivos huérfanos</strong><span className="text-xs text-text-muted">Detectados: {displayScanCount(integrity.orphans)}</span></span>
              <ArrowRight className="h-4 w-4 text-text-muted" />
            </button>
          </div>
          <div className="m-4 rounded-md border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-text"><Music2 className="h-4 w-4 text-primary-light" /> Metadata habitual</div>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">{missingMetadata} pista{missingMetadata === 1 ? "" : "s"} sin título, artista o BPM.</p>
            <button type="button" className="mt-3 inline-flex min-h-8 items-center rounded px-2 text-xs font-semibold text-primary-light hover:bg-primary/10" onClick={() => setNavigation({ workspace: "library", section: "songs" })}>Abrir Browser</button>
          </div>
        </aside>
      </div>

      <section className="grid grid-cols-5 divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface" aria-label="Métricas de biblioteca">
        {[
          ["Tracks", stats.total_songs.toLocaleString()],
          ["Tamaño", formatSize(stats.total_size_bytes)],
          ["Con cues", stats.songs_with_cues.toLocaleString()],
          ["Con tags", stats.songs_with_tags.toLocaleString()],
          ["BPM promedio", stats.avg_bpm ? stats.avg_bpm.toFixed(1) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="px-4 py-3">
            <div className="text-xs text-text-muted">{label}</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-text">{value}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
