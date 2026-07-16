import { AlertCircle, RotateCw, X } from "lucide-react";
import type { UiError } from "../lib/uiError";

interface UiErrorNoticeProps {
  error: UiError;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
}

export function UiErrorNotice({
  error,
  onDismiss,
  onRetry,
  retryLabel = "Reintentar",
}: UiErrorNoticeProps) {
  return (
    <section className="ui-error" role="alert" aria-live="assertive">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text">{error.summary}</p>
        {error.detail ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-error">Detalle técnico</summary>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-md border border-error/20 bg-background/55 p-2 text-xs text-text-secondary">{error.detail}</pre>
          </details>
        ) : null}
        {onRetry ? (
          <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={onRetry}>
            <RotateCw aria-hidden="true" className="h-4 w-4" />
            {retryLabel}
          </button>
        ) : null}
      </div>
      {onDismiss ? (
        <button type="button" className="icon-button" onClick={onDismiss} aria-label="Cerrar error">
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </section>
  );
}

