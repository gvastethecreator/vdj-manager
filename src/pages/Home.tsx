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
    uiErrorRecovery,
    currentScope,
    clearUiError,
    musicFolders,
    removeMusicFolder,
    lastVdjFolder,
  } = useApp();

  return (
    <main className="flex min-h-full items-center justify-center bg-background p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl lg:grid-cols-[1.15fr_.85fr]">
        <section className="p-6 lg:p-8">
          <div className="flex items-center gap-3 text-primary-light">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/12"><Database className="h-5 w-5" /></div>
            <span className="text-sm font-bold text-text">VDJ Manager</span>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary-light">VirtualDJ operations center</p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-text">Return to your library and decide what comes next.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
            Browse tracks, verify integrity, and run protected operations from one desktop workspace.
          </p>

          <div className="mt-5 space-y-2">
            {lastVdjFolder ? (
              <button type="button" onClick={() => void loadFromFolder(lastVdjFolder)} disabled={loading} className="btn btn-primary btn-lg w-full justify-start">
                <History className="h-5 w-5" />
                <span className="min-w-0 text-left">
                  <strong className="block">Resume last library</strong>
                  <span className="mt-1 block truncate text-xs font-normal opacity-85" title={lastVdjFolder}>{lastVdjFolder}</span>
                </span>
              </button>
            ) : null}
            <button type="button" onClick={() => void selectFolder()} disabled={loading} className="btn btn-ghost btn-lg w-full justify-start">
              <FolderOpen className="h-5 w-5" /> Select VirtualDJ folder
            </button>
          </div>

          {loading ? <div className="mt-3 flex items-center gap-2 text-sm text-text-muted"><div className="spinner" /> Loading library…</div> : null}
          {uiError?.scope === currentScope ? (
            <div className="mt-3">
              <UiErrorNotice
                error={uiError}
                onDismiss={clearUiError}
                onRetry={uiErrorRecovery?.scope === currentScope ? () => {
                  const retry = uiErrorRecovery.run;
                  clearUiError();
                  void retry();
                } : undefined}
                retryLabel={uiErrorRecovery?.scope === currentScope ? uiErrorRecovery.label : undefined}
              />
            </div>
          ) : null}

          <div className="mt-5 flex items-start gap-3 border-t border-border pt-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h2 className="text-sm font-semibold text-text">Escrituras protegidas</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">Backup first, atomic writes, and explicit recovery. Integrity scans remain independent actions.</p>
            </div>
          </div>
        </section>

        <aside className="border-t border-border bg-background/55 p-6 lg:border-l lg:border-t-0 lg:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Music folders</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">Used to find missing tracks, relink candidates, and orphans.</p>
            </div>
            <button type="button" className="icon-button shrink-0" onClick={() => void selectMusicFolder()} aria-label="Add music folder" title="Add folder">
              <FolderOpen className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {musicFolders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-text-muted">No additional folders yet.</div>
            ) : musicFolders.map((folder) => (
              <div key={folder} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-3">
                <Music2 className="h-4 w-4 shrink-0 text-primary-light" />
                <span className="min-w-0 flex-1 truncate text-sm text-text-secondary" title={folder}>{folder}</span>
                <button type="button" className="icon-button h-7 w-7 shrink-0" onClick={() => removeMusicFolder(folder)} aria-label={`Remove ${folder}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
