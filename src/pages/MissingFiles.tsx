import { useMemo, useState } from "react";
import { FileWarning, Link2, RefreshCw } from "lucide-react";
import { useApp } from "../App";
import { formatSize } from "../lib/api";

type Filter = "all" | "missing" | "mismatch" | "ok";

/**
 * Integrity verification only. Reconciliation lives in RelinkTracks so this
 * diagnostic surface never writes database.xml or ranks candidates.
 */
export function MissingFiles() {
  const { vdjFolder, clearUiError, reportUiError, services, setNavigation, updateIntegrity, openRelinkTarget, integrityResults, updateIntegrityResults } = useApp();
  const results = integrityResults.verification;
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("missing");

  async function runVerify() {
    if (!vdjFolder) return;
    setLoading(true);
    clearUiError();
    try {
      const verification = await services.verifyFiles(vdjFolder);
      updateIntegrityResults({ verification });
      updateIntegrity({
        missing: verification.filter((entry) => !entry.exists).length,
        mismatched: verification.filter((entry) => entry.exists && !entry.size_match).length,
      });
    } catch (error) {
      reportUiError("No se pudo verificar la integridad de la biblioteca.", error, { retry: runVerify });
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    if (!results) return null;
    return {
      all: results.length,
      missing: results.filter((entry) => !entry.exists).length,
      mismatch: results.filter((entry) => entry.exists && !entry.size_match).length,
      ok: results.filter((entry) => entry.exists && entry.size_match).length,
    };
  }, [results]);

  const filtered = useMemo(() => {
    if (!results) return [];
    return results.filter((entry) => {
      if (filter === "missing") return !entry.exists;
      if (filter === "mismatch") return entry.exists && !entry.size_match;
      if (filter === "ok") return entry.exists && entry.size_match;
      return true;
    });
  }, [filter, results]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-bold text-text">Verificación de integridad</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Diagnostica referencias ausentes o con tamaño distinto. Esta pantalla no modifica la Biblioteca VirtualDJ.
          </p>
        </div>
        <div className="flex gap-2">
          {counts && counts.missing > 0 && (
            <button type="button" onClick={() => setNavigation({ workspace: "integrity", section: "relink" })} className="btn btn-warning">
              <Link2 className="h-4 w-4" />
              Abrir Reconciliación de rutas
            </button>
          )}
          <button type="button" onClick={() => void runVerify()} disabled={loading || !vdjFolder} className="btn btn-primary">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Verificando..." : "Verificar archivos"}
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-text-muted">Leyendo referencias y metadata física...</div>}

      {counts && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {([
              ["all", "Total", "text-text"],
              ["ok", "OK", "text-success"],
              ["missing", "Faltantes", "text-error"],
              ["mismatch", "Tamaño diferente", "text-warning"],
            ] as const).map(([key, label, color]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg border p-3 text-center transition-colors ${filter === key ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-surface-hover"}`}
              >
                <div className={`text-xl font-bold ${color}`}>{counts[key]}</div>
                <div className="text-xs text-text-muted">{label}</div>
              </button>
            ))}
          </div>

          {counts.missing > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/8 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-text">Hay referencias que necesitan reconciliación</div>
                <div className="mt-1 text-xs text-text-muted">Selecciona una entrada en el owner dedicado para revisar candidatos y confirmar una ruta.</div>
              </div>
              <button type="button" onClick={() => setNavigation({ workspace: "integrity", section: "relink" })} className="btn btn-warning btn-sm">
                <Link2 className="h-3.5 w-3.5" />
                Revisar faltantes
              </button>
            </div>
          )}

          <div className="overflow-auto rounded-lg border-2 border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-surface-hover">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Archivo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Título</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Artista</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Esperado</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Real</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Próxima acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.file_path} className="border-t border-border/50 hover:bg-surface-hover">
                    <td className="px-3 py-2">
                      {!entry.exists ? (
                        <span className="badge bg-error/15 text-error">Falta</span>
                      ) : !entry.size_match ? (
                        <span className="badge bg-warning/15 text-warning">Diferente</span>
                      ) : (
                        <span className="badge bg-success/15 text-success">OK</span>
                      )}
                    </td>
                    <td className="max-w-sm truncate px-3 py-2 text-text" title={entry.file_path}>{entry.file_path}</td>
                    <td className="max-w-48 truncate px-3 py-2">{entry.title ?? "—"}</td>
                    <td className="max-w-40 truncate px-3 py-2">{entry.author ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatSize(entry.expected_size)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatSize(entry.actual_size)}</td>
                    <td className="px-3 py-2 text-right">
                      {!entry.exists ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openRelinkTarget(entry.file_path)}>
                          <Link2 className="h-3.5 w-3.5" /> Ver candidatos
                        </button>
                      ) : <span className="text-xs text-text-muted">Sin acción</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-text-muted">
                {results ? "No hay entradas en esta categoría." : "Ejecuta una verificación para diagnosticar la Biblioteca VirtualDJ."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
