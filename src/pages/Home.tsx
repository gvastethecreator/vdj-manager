import { Database, FolderOpen, History, Music2, ShieldCheck, X } from "lucide-react";
import { useApp } from "../App";
import { UiErrorNotice } from "../components/UiErrorNotice";

/** Focused entry point: resume a known library or choose one explicitly. */
export function Home() {
  const {
    selectFolder,
    selectMusicFolder,
    loadFromFolder,
    loading,
    uiError,
    clearUiError,
    musicFolders,
    removeMusicFolder,
    lastVdjFolder,
  } = useApp();

  return (
    <main className="flex min-h-full items-center justify-center bg-background p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl lg:grid-cols-[1.15fr_.85fr]">
        <section className="p-8 lg:p-10">
          <div className="flex items-center gap-3 text-primary-light">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/12"><Database className="h-5 w-5" /></div>
            <span className="text-sm font-bold text-text">VDJ Manager</span>
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-primary-light">Centro operativo para VirtualDJ</p>
          <h1 className="mt-2 max-w-xl text-4xl font-bold tracking-tight text-text">Vuelve a tu biblioteca y decide el próximo paso.</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
            Navega pistas, verifica integridad y ejecuta operaciones protegidas desde un único workspace de escritorio.
          </p>

          <div className="mt-8 space-y-3">
            {lastVdjFolder ? (
              <button type="button" onClick={() => void loadFromFolder(lastVdjFolder)} disabled={loading} className="btn btn-primary btn-lg w-full justify-start">
                <History className="h-5 w-5" />
                <span className="min-w-0 text-left">
                  <strong className="block">Reanudar última biblioteca</strong>
                  <span className="mt-1 block truncate text-xs font-normal opacity-85" title={lastVdjFolder}>{lastVdjFolder}</span>
                </span>
              </button>
            ) : null}
            <button type="button" onClick={() => void selectFolder()} disabled={loading} className="btn btn-ghost btn-lg w-full justify-start">
              <FolderOpen className="h-5 w-5" /> Seleccionar carpeta de VirtualDJ
            </button>
          </div>

          {loading ? <div className="mt-4 flex items-center gap-2 text-sm text-text-muted"><div className="spinner" /> Cargando biblioteca…</div> : null}
          {uiError ? <div className="mt-4"><UiErrorNotice error={uiError} onDismiss={clearUiError} /></div> : null}

          <div className="mt-8 flex items-start gap-3 border-t border-border pt-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h2 className="text-sm font-semibold text-text">Escrituras protegidas</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">Backup previo, escritura atómica y recuperación explícita. Los análisis de integridad siguen siendo acciones independientes.</p>
            </div>
          </div>
        </section>

        <aside className="border-t border-border bg-background/55 p-8 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Carpetas de música</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">Se usan para buscar faltantes, candidatos y huérfanos.</p>
            </div>
            <button type="button" className="icon-button shrink-0" onClick={() => void selectMusicFolder()} aria-label="Agregar carpeta de música" title="Agregar carpeta">
              <FolderOpen className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {musicFolders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-text-muted">Todavía no hay carpetas adicionales.</div>
            ) : musicFolders.map((folder) => (
              <div key={folder} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-3">
                <Music2 className="h-4 w-4 shrink-0 text-primary-light" />
                <span className="min-w-0 flex-1 truncate text-sm text-text-secondary" title={folder}>{folder}</span>
                <button type="button" className="icon-button h-7 w-7 shrink-0" onClick={() => removeMusicFolder(folder)} aria-label={`Quitar ${folder}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
