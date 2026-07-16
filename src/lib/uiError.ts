export interface UiError {
  scope: string;
  summary: string;
  detail?: string;
}

export function errorDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function createUiError(scope: string, summary: string, error?: unknown): UiError {
  const detail = error === undefined ? undefined : errorDetail(error);
  return detail && detail !== summary ? { scope, summary, detail } : { scope, summary };
}

/** Drop errors when navigation leaves the workspace/section that owns them. */
export function errorForScope(error: UiError | null, scope: string): UiError | null {
  return error?.scope === scope ? error : null;
}
