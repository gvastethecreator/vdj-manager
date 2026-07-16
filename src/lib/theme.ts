export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "vdj-theme";

/** Keep the supported light theme; every legacy accent theme migrates to dark. */
export function migrateTheme(value: unknown): Theme {
  return value === "light" ? "light" : "dark";
}

export function readStoredTheme(storage: Pick<Storage, "getItem"> = localStorage): Theme {
  try {
    return migrateTheme(storage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

export function persistTheme(
  theme: Theme,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage is optional in restricted WebViews; the in-memory theme still works.
  }
}

