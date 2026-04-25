/**
 * Minimal structured logger for the frontend.
 *
 * In production builds, debug/info messages are suppressed.
 * Logs are prefixed with `[VDJ]` and include a timestamp.
 *
 * @module logger
 */

const PREFIX = "[VDJ]";
const IS_DEV = import.meta.env.DEV;

/** Log severity levels. */
type Level = "debug" | "info" | "warn" | "error";

function stamp(): string {
  return new Date().toISOString().slice(11, 23);
}

function emit(level: Level, ...args: unknown[]): void {
  const tag = `${PREFIX} ${stamp()}`;
  switch (level) {
    case "debug":
      if (IS_DEV) console.debug(tag, ...args);
      break;
    case "info":
      if (IS_DEV) console.info(tag, ...args);
      break;
    case "warn":
      console.warn(tag, ...args);
      break;
    case "error":
      console.error(tag, ...args);
      break;
  }
}

/** Debug message (dev only). */
export function debug(...args: unknown[]): void {
  emit("debug", ...args);
}

/** Info message (dev only). */
export function info(...args: unknown[]): void {
  emit("info", ...args);
}

/** Warning (always visible). */
export function warn(...args: unknown[]): void {
  emit("warn", ...args);
}

/** Error (always visible). */
export function error(...args: unknown[]): void {
  emit("error", ...args);
}

export const log = { debug, info, warn, error };
