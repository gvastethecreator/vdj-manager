import type { PointerEventHandler } from "react";

interface PaneSeparatorProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onMove: (delta: number) => void;
  onReset: () => void;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
}

/** Keyboard and pointer-operable vertical pane separator. */
export function PaneSeparator({ label, value, min, max, onMove, onReset, onPointerDown }: PaneSeparatorProps) {
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      className="pane-separator"
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onMove(-16);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onMove(16);
        } else if (event.key === "Home") {
          event.preventDefault();
          onReset();
        }
      }}
    />
  );
}
