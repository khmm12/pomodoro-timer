/**
 * Tiny, safe `localStorage` wrapper. All access is guarded so a missing,
 * disabled, or full storage degrades to in-memory defaults instead of throwing.
 *
 * `load` returns `unknown` (ts-reset narrows `JSON.parse` to `unknown`): callers
 * are expected to validate the shape and fall back to their own defaults.
 */

const PREFIX = 'pomodoro:v1:'

/** Narrowing guard shared by the composables' `coerce` validators. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Access can throw in sandboxed / privacy-restricted contexts.
    return null
  }
}

export function load(key: string): unknown {
  const raw = storage()?.getItem(PREFIX + key)
  if (raw == null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function save(key: string, value: unknown): void {
  try {
    storage()?.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Quota exceeded or serialization failure — non-fatal for a timer.
  }
}

export function remove(key: string): void {
  try {
    storage()?.removeItem(PREFIX + key)
  } catch {
    // Ignore.
  }
}
