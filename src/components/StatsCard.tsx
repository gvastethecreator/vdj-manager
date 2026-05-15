import type { ReactNode } from "react";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    /** Tailwind text-color class (default: "text-primary") */
    color?: string;
}

/** Compact card displaying a single statistic with icon. */
export function StatsCard({ label, value, icon, color = "text-primary" }: StatsCardProps) {
    return (
        <div className="card card-hover flex items-center gap-3 p-3.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-background/70 ring-1 ring-border ${color}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xl font-bold text-text tabular-nums leading-none">{value}</p>
                <p className="truncate text-[11px] text-text-muted">{label}</p>
            </div>
        </div>
    );
}
