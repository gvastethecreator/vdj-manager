import { useMemo, useState } from "react";
import { Music, X } from "lucide-react";
import { useApp } from "../App";
import { mergeFolderLists, scanMusicFolder } from "../lib/api";

/** Scans a folder for audio files not registered in the VDJ database. */
export function OrphanFiles() {
    const { songs, musicFolders, removeMusicFolder, selectMusicFolder, setError } = useApp();
    const [orphans, setOrphans] = useState<string[] | null>(null);
    const [allFiles, setAllFiles] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);

    const scanFolders = useMemo(() => mergeFolderLists(musicFolders), [musicFolders]);

    async function runScan() {
        if (scanFolders.length === 0) return;
        setLoading(true);
        setOrphans(null);
        try {
            const fileGroups = await Promise.all(scanFolders.map((folder) => scanMusicFolder(folder)));
            const uniqueFiles = Array.from(
                new Map(
                    fileGroups
                        .flat()
                        .map((filePath) => [filePath.toLowerCase(), filePath]),
                ).values(),
            ).sort((a, b) => a.localeCompare(b));

            const databasePaths = new Set(songs.map((song) => song.file_path.toLowerCase()));
            const orphanPaths = uniqueFiles.filter((filePath) => !databasePaths.has(filePath.toLowerCase()));

            setOrphans(orphanPaths);
            setAllFiles(uniqueFiles);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-text">Archivos Huérfanos</h2>
            <p className="text-[13px] text-text-secondary">
                Archivos de audio en disco que no están registrados en la base de datos de VirtualDJ.
            </p>

            <div className="card space-y-3 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <label className="mb-1 block text-[11px] text-text-muted">Carpetas a escanear</label>
                        <p className="text-[11px] text-text-secondary">
                            Se usan las carpetas musicales persistentes configuradas desde el inicio de la app.
                        </p>
                    </div>
                    <button onClick={selectMusicFolder} className="btn btn-ghost btn-sm">
                        <Music className="h-4 w-4" />
                        Agregar carpeta
                    </button>
                </div>

                {scanFolders.length === 0 ? (
                    <div className="rounded-[5px] border border-dashed border-border/70 bg-surface-hover/30 px-3 py-2 text-[11px] text-text-muted">
                        No hay carpetas de música configuradas todavía.
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {scanFolders.map((folder) => (
                            <div key={folder} className="flex items-center gap-2 rounded-[5px] border border-border/70 bg-surface-hover/35 px-2.5 py-2">
                                <Music className="h-3.5 w-3.5 shrink-0 text-primary-light" />
                                <span className="min-w-0 flex-1 truncate text-[11px] text-text" title={folder}>
                                    {folder}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeMusicFolder(folder)}
                                    className="btn btn-ghost btn-sm shrink-0"
                                    title="Quitar carpeta"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={runScan}
                        disabled={loading || scanFolders.length === 0}
                        className="btn btn-primary"
                    >
                        {loading ? "Escaneando..." : `Buscar Huérfanos${scanFolders.length > 0 ? ` (${scanFolders.length})` : ""}`}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <div className="spinner" />
                    Escaneando archivos...
                </div>
            )}

            {orphans && allFiles && (
                <>
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="card p-2.5 text-center">
                            <div className="text-lg font-bold text-text">{allFiles.length}</div>
                            <div className="text-[11px] text-text-muted">Archivos en disco</div>
                        </div>
                        <div className="card p-2.5 text-center">
                            <div className="text-lg font-bold text-success">{allFiles.length - orphans.length}</div>
                            <div className="text-[11px] text-text-muted">En la base de datos</div>
                        </div>
                        <div className="card p-2.5 text-center">
                            <div className="text-lg font-bold text-warning">{orphans.length}</div>
                            <div className="text-[11px] text-text-muted">Huérfanos</div>
                        </div>
                    </div>

                    <div className="max-h-[calc(100vh-360px)] overflow-auto rounded-[5px] border-2 border-border">
                        <table className="w-full text-[12px]">
                            <thead className="sticky top-0 bg-surface-hover">
                                <tr>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">#</th>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Archivo</th>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Formato</th>
                                    <th className="px-2.5 py-1.5 text-left text-[11px] font-medium text-text-muted">Carpeta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orphans.map((path, i) => {
                                    const lastSep = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
                                    const fileName = lastSep >= 0 ? path.slice(lastSep + 1) : path;
                                    const folder = lastSep >= 0 ? path.slice(0, lastSep) : "";
                                    const ext = fileName.includes(".")
                                        ? fileName.slice(fileName.lastIndexOf(".") + 1).toUpperCase()
                                        : "?";
                                    const extColor: Record<string, string> = {
                                        MP3: "bg-yellow-500/15 text-yellow-400",
                                        FLAC: "bg-blue-500/15 text-blue-400",
                                        WAV: "bg-cyan-500/15 text-cyan-400",
                                        M4A: "bg-green-500/15 text-green-400",
                                        AAC: "bg-green-500/15 text-green-400",
                                        OGG: "bg-orange-500/15 text-orange-400",
                                        AIFF: "bg-purple-500/15 text-purple-400",
                                        AIF: "bg-purple-500/15 text-purple-400",
                                    };
                                    return (
                                        <tr key={i} className="border-t-2 border-border/40 hover:bg-surface-hover">
                                            <td className="px-2.5 py-1 text-text-muted">{i + 1}</td>
                                            <td className="px-2.5 py-1 text-text" title={path}>
                                                {fileName}
                                            </td>
                                            <td className="px-2.5 py-1">
                                                <span className={`badge text-[10px] ${extColor[ext] ?? "bg-surface-hover text-text-muted"}`}>
                                                    {ext}
                                                </span>
                                            </td>
                                            <td className="truncate px-2.5 py-1 text-text-muted" title={folder}>
                                                {folder}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {orphans.length === 0 && (
                            <div className="py-8 text-center text-sm text-text-muted">
                                Todos los archivos están en la base de datos
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
