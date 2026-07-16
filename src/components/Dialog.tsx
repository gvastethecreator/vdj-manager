import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

const FOCUSABLE = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/** Accessible modal primitive with focus containment, inert background and restoration. */
export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  busy = false,
  initialFocusRef,
  className = "",
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  if (!portalRef.current && typeof document !== "undefined") {
    const portal = document.createElement("div");
    portal.dataset.dialogPortal = "";
    portalRef.current = portal;
  }

  useEffect(() => {
    if (!open || !portalRef.current) return;
    const portal = portalRef.current;
    const restoreTarget = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const siblings = [...document.body.children]
      .filter((element) => element !== portal)
      .map((element) => ({
        element: element as HTMLElement,
        inert: (element as HTMLElement & { inert?: boolean }).inert ?? false,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));

    document.body.appendChild(portal);
    document.body.style.overflow = "hidden";
    for (const sibling of siblings) {
      (sibling.element as HTMLElement & { inert: boolean }).inert = true;
      sibling.element.setAttribute("aria-hidden", "true");
    }

    const focusInitial = () => {
      const panel = panelRef.current;
      const target = initialFocusRef?.current
        ?? panel?.querySelector<HTMLElement>("[data-dialog-initial]")
        ?? (panel ? focusableElements(panel)[0] : null)
        ?? panel;
      target?.focus();
    };
    focusInitial();

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableElements(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      for (const sibling of siblings) {
        (sibling.element as HTMLElement & { inert: boolean }).inert = sibling.inert;
        if (sibling.ariaHidden === null) sibling.element.removeAttribute("aria-hidden");
        else sibling.element.setAttribute("aria-hidden", sibling.ariaHidden);
      }
      portal.remove();
      if (restoreTarget?.isConnected) restoreTarget.focus();
    };
  }, [busy, initialFocusRef, onClose, open]);

  if (!open || !portalRef.current) return null;

  return createPortal(
    <div className="dialog-backdrop" data-testid="dialog-backdrop">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={busy || undefined}
        tabIndex={-1}
        className={`dialog-panel ${className}`}
      >
        <div className="dialog-heading">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-text">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm text-text-secondary">{description}</p> : null}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar diálogo"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    portalRef.current,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children?: ReactNode;
  busy?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  children,
  busy = false,
  destructive = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmingRef = useRef(false);
  const mountedRef = useRef(true);
  const [internalBusy, setInternalBusy] = useState(false);
  const locked = busy || internalBusy;

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) {
      confirmingRef.current = false;
      setInternalBusy(false);
    }
  }, [open]);

  const confirm = useCallback(async () => {
    if (locked || confirmingRef.current) return;
    confirmingRef.current = true;
    setInternalBusy(true);
    try {
      await onConfirm();
    } finally {
      confirmingRef.current = false;
      if (mountedRef.current) setInternalBusy(false);
    }
  }, [locked, onConfirm]);

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      busy={locked}
      initialFocusRef={cancelRef}
    >
      {children ? <div className="dialog-content">{children}</div> : null}
      <div className="dialog-actions">
        <button
          ref={cancelRef}
          type="button"
          data-dialog-initial
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={locked}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={`btn ${destructive ? "btn-danger" : "btn-primary"}`}
          onClick={() => void confirm()}
          disabled={locked}
        >
          {destructive ? <AlertTriangle aria-hidden="true" className="h-4 w-4" /> : null}
          {locked ? "Procesando…" : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
