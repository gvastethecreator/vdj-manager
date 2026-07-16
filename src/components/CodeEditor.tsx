import { CheckCircle2, FileCode2 } from "lucide-react";

export function CodeEditor({
    value,
    onChange,
    label,
    language = "XML",
    dirty = false,
    minHeightClass = "min-h-[calc(100vh-280px)]",
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    language?: string;
    dirty?: boolean;
    minHeightClass?: string;
}) {
    const lineCount = Math.max(value.split("\n").length, 1);
    const lineNumbers = Array.from({ length: lineCount }, (_, index) => index + 1);

    return (
        <section className="code-workspace overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <FileCode2 className="h-4 w-4 shrink-0 text-primary-light" />
                    <span className="truncate text-[12px] font-semibold text-text">{label}</span>
                    <span className="badge bg-background px-2 py-0.5 text-xs text-text-muted">{language}</span>
                </div>
                <span className={`badge px-2 py-0.5 text-xs ${dirty ? "bg-warning/15 text-warning" : "bg-success/12 text-success"}`}>
                    {dirty ? "Cambios pendientes" : (
                        <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Sin cambios
                        </>
                    )}
                </span>
            </div>
            <div className={`grid ${minHeightClass} grid-cols-[3.25rem_1fr] overflow-hidden`}>
                <div className="select-none overflow-hidden border-r border-border bg-surface/55 py-3 text-right font-mono text-xs leading-5 text-text-muted">
                    {lineNumbers.map((line) => (
                        <div key={line} className="px-3">{line}</div>
                    ))}
                </div>
                <textarea
                    className="h-full w-full resize-none overflow-auto bg-background p-3 font-mono text-[12px] leading-5 text-text outline-none placeholder:text-text-muted focus:bg-black/20"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    spellCheck={false}
                    aria-label={label}
                />
            </div>
        </section>
    );
}
