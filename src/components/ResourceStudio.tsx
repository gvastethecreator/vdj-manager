import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Gamepad2, RotateCcw, Save, Settings2, SlidersHorizontal } from "lucide-react";
import { useApp } from "../App";
import type { NavigationState, ResourceSection } from "../lib/navigation";
import { ConfirmDialog } from "./Dialog";
import { UiErrorNotice } from "./UiErrorNotice";

export interface ResourceEditorState {
  dirty: boolean;
  busy: boolean;
  save: () => void | Promise<void>;
  revert: () => void | Promise<void>;
  retry: () => void | Promise<void>;
}

const ResourceEditorRegistration = createContext<((state: ResourceEditorState | null) => void) | null>(null);

export function useResourceEditorState(state: ResourceEditorState) {
  const register = useContext(ResourceEditorRegistration);
  const { busy, dirty, retry, revert, save } = state;

  useEffect(() => {
    if (!register) return;
    register({ busy, dirty, retry, revert, save });
    return () => register(null);
  }, [busy, dirty, register, retry, revert, save]);
}

const TABS: Array<{ section: ResourceSection; label: string; icon: typeof Settings2 }> = [
  { section: "configs", label: "Settings", icon: Settings2 },
  { section: "pads", label: "Pads", icon: Gamepad2 },
  { section: "mappers", label: "Mappers", icon: SlidersHorizontal },
];

function sameNavigation(a: NavigationState, b: NavigationState): boolean {
  return a.workspace === b.workspace && a.section === b.section;
}

/** Shared resource workbench with guarded dirty state and workspace-local feedback. */
export function ResourceStudio({ children }: { children: ReactNode }) {
  const {
    navigation,
    setNavigation,
    registerNavigationBlocker,
    uiError,
    currentScope,
    clearUiError,
  } = useApp();
  const [editor, setEditor] = useState<ResourceEditorState | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<{
    proceed: () => void;
  } | null>(null);
  const section = (navigation.section as ResourceSection | undefined) ?? "configs";
  const paddedContent = section === "configs";

  useEffect(() => {
    if (!editor?.dirty) return;
    return registerNavigationBlocker((next, proceed) => {
      if (next && sameNavigation(next, navigation)) return false;
      setPendingNavigation({ proceed });
      return true;
    });
  }, [editor?.dirty, navigation, registerNavigationBlocker]);

  useEffect(() => {
    if (!editor?.dirty) return;
    const protectWindowClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectWindowClose);
    return () => window.removeEventListener("beforeunload", protectWindowClose);
  }, [editor?.dirty]);

  const confirmNavigation = useCallback(async () => {
    const pending = pendingNavigation;
    if (!pending) return;
    try {
      await editor?.revert();
      setPendingNavigation(null);
      pending.proceed();
    } catch {
      setPendingNavigation(null);
    }
  }, [editor, pendingNavigation]);

  const runEditorAction = useCallback(async (action: (() => void | Promise<void>) | undefined) => {
    try {
      await action?.();
    } catch {
      // The editor already reported the scoped error; keep the current workspace visible.
    }
  }, []);

  return (
    <ResourceEditorRegistration.Provider value={setEditor}>
      <>
      <div className="flex h-full min-h-0 flex-col bg-background">
        <header className="shrink-0 border-b border-border bg-surface px-4 pt-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-text">Resource studio</h1>
              <p className="mt-0.5 text-xs text-text-muted">Edit settings, pads, and controllers with explicit state and a backup on save.</p>
            </div>
            <div className="flex items-center gap-2" aria-live="polite">
              <span className={`badge border ${editor?.dirty ? "border-warning/35 bg-warning/10 text-warning" : "border-success/30 bg-success/8 text-success"}`}>
                {editor?.busy ? "Processing…" : editor?.dirty ? "Pending changes" : "No changes"}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={!editor?.dirty || editor.busy} onClick={() => void runEditorAction(editor?.revert)}>
                <RotateCcw className="h-4 w-4" /> Revert
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={!editor?.dirty || editor.busy} onClick={() => void runEditorAction(editor?.save)}>
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-1" aria-label="Resource studio sections">
            {TABS.map(({ section: nextSection, label, icon: Icon }) => (
              <button
                key={nextSection}
                type="button"
                className={`flex min-h-9 items-center gap-2 border-b-2 px-3 text-sm font-semibold ${section === nextSection ? "border-primary-light text-primary-light" : "border-transparent text-text-muted hover:text-text"}`}
                onClick={() => setNavigation({ workspace: "resources", section: nextSection })}
                aria-current={section === nextSection ? "page" : undefined}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </header>

        {uiError?.scope === currentScope ? (
          <div className="shrink-0 px-4 pt-3">
            <UiErrorNotice
              error={uiError}
              onDismiss={clearUiError}
              onRetry={editor?.retry ? () => void editor.retry() : undefined}
            />
          </div>
        ) : null}

        <div className={`min-h-0 flex-1 ${paddedContent ? "overflow-auto p-4" : "overflow-hidden"}`}>{children}</div>
      </div>

      <ConfirmDialog
        open={pendingNavigation !== null}
        title="There are unsaved changes"
        description="If you continue, the last loaded version will be restored and pending changes will be discarded before browsing, reloading, or switching libraries."
        confirmLabel="Discard and switch"
        destructive
        onCancel={() => setPendingNavigation(null)}
        onConfirm={confirmNavigation}
      />
      </>
    </ResourceEditorRegistration.Provider>
  );
}
