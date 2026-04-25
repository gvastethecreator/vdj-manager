import { useRef, useEffect } from "react";
import { Music, Users, Disc, Tag, Bookmark, Activity } from "lucide-react";
import gsap from "gsap";
import { useApp } from "../App";
import { StatsCard } from "../components/StatsCard";
import { formatSize } from "../lib/api";
import { EASE, DURATION } from "../lib/animations";

/** Stats dashboard with cards, genre/artist charts, and quality summary. */
export function Dashboard() {
    const { stats, songs } = useApp();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!stats) return;
        const ctx = gsap.context(() => {
            gsap.from(".dash-card", { autoAlpha: 0, y: 20, duration: DURATION, ease: EASE, stagger: 0.05 });
            gsap.from(".dash-section", { autoAlpha: 0, y: 24, duration: DURATION, ease: EASE, stagger: 0.1, delay: 0.25 });
        }, containerRef);
        return () => ctx.revert();
    }, [stats]);

    if (!stats) {
        return <div className="text-sm text-text-muted">No hay datos cargados.</div>;
    }

    return (
        <div ref={containerRef} className="space-y-5">
            <h2 className="text-lg font-bold text-text">Dashboard</h2>

            {/* Stats cards */}
            <div className="dash-card grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                <StatsCard
                    label="Total de canciones"
                    value={stats.total_songs.toLocaleString()}
                    icon={<Music className="h-4 w-4" />}
                />
                <StatsCard
                    label="Tamaño total"
                    value={formatSize(stats.total_size_bytes)}
                    icon={<Disc className="h-4 w-4" />}
                    color="text-info"
                />
                <StatsCard
                    label="Artistas únicos"
                    value={stats.artists.length.toLocaleString()}
                    icon={<Users className="h-4 w-4" />}
                    color="text-success"
                />
                <StatsCard
                    label="Géneros"
                    value={stats.genres.length.toLocaleString()}
                    icon={<Tag className="h-4 w-4" />}
                    color="text-warning"
                />
                <StatsCard
                    label="Con cue points"
                    value={stats.songs_with_cues.toLocaleString()}
                    icon={<Bookmark className="h-4 w-4" />}
                    color="text-error"
                />
                <StatsCard
                    label="BPM promedio"
                    value={stats.avg_bpm ? stats.avg_bpm.toFixed(1) : "—"}
                    icon={<Activity className="h-4 w-4" />}
                    color="text-primary-light"
                />
                <StatsCard
                    label="Con tags"
                    value={stats.songs_with_tags.toLocaleString()}
                    icon={<Tag className="h-4 w-4" />}
                    color="text-info"
                />
                <StatsCard
                    label="Sin tags"
                    value={(stats.total_songs - stats.songs_with_tags).toLocaleString()}
                    icon={<Tag className="h-4 w-4" />}
                    color="text-text-muted"
                />
            </div>

            {/* Top genres and artists */}
            <div className="dash-section grid gap-5 lg:grid-cols-2">
                {/* Top genres */}
                <div className="card p-4">
                    <h3 className="mb-3 text-[13px] font-semibold text-text">Top Géneros</h3>
                    <div className="space-y-2">
                        {stats.genres.slice(0, 15).map(([genre, count]) => (
                            <div key={genre} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text">{genre}</span>
                                        <span className="tabular-nums text-text-muted">{count}</span>
                                    </div>
                                    <div className="progress-track mt-1">
                                        <div
                                            className="progress-fill bg-primary"
                                            style={{
                                                width: `${(count / stats.genres[0][1]) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top artists */}
                <div className="card p-4">
                    <h3 className="mb-3 text-[13px] font-semibold text-text">Top Artistas</h3>
                    <div className="space-y-2">
                        {stats.artists.slice(0, 15).map(([artist, count]) => (
                            <div key={artist} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text">{artist}</span>
                                        <span className="tabular-nums text-text-muted">{count}</span>
                                    </div>
                                    <div className="progress-track mt-1">
                                        <div
                                            className="progress-fill bg-success"
                                            style={{
                                                width: `${(count / stats.artists[0][1]) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Years distribution */}
            {stats.years.length > 0 && (
                <div className="dash-section card p-4">
                    <h3 className="mb-3 text-[13px] font-semibold text-text">Distribución por Año</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {stats.years.map(([year, count]) => (
                            <span
                                key={year}
                                className="badge bg-surface-hover text-text-secondary"
                            >
                                {year}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Songs without info */}
            {songs.length > 0 && (
                <div className="dash-section card p-4">
                    <h3 className="mb-3 text-[13px] font-semibold text-text">Resumen de calidad</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-4">
                        <div>
                            <span className="text-text-muted">Sin título:</span>{" "}
                            <span className="font-semibold text-warning">
                                {songs.filter((s) => !s.title).length}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted">Sin artista:</span>{" "}
                            <span className="font-semibold text-warning">
                                {songs.filter((s) => !s.author).length}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted">Sin género:</span>{" "}
                            <span className="font-semibold text-warning">
                                {songs.filter((s) => !s.genre).length}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted">Sin BPM:</span>{" "}
                            <span className="font-semibold text-warning">
                                {songs.filter((s) => !s.bpm).length}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
