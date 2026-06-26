/**
 * Pure, framework-agnostic Pomodoro timer state machine.
 *
 * The single source of truth for a running timer is an absolute `endsAt`
 * timestamp — never a ticking countdown. This makes background-tab accuracy
 * and reload-survival fall out for free: remaining time is always derived from
 * `endsAt - now`, so throttled intervals and page reloads can never drift.
 *
 * All functions are pure. Anything time-dependent takes an explicit `now`
 * (epoch ms) so behaviour is fully deterministic and unit-testable.
 */

export type Phase = 'work' | 'shortBreak' | 'longBreak'
export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerSettings {
  /** Work session length, in milliseconds. */
  workMs: number
  /** Short break length, in milliseconds. */
  shortBreakMs: number
  /** Long break length, in milliseconds. */
  longBreakMs: number
  /** A long break replaces the short break after this many completed work sessions. */
  longBreakInterval: number
}

export interface TimerState {
  phase: Phase
  status: TimerStatus
  /** Epoch ms when the running phase ends; `null` while idle or paused. */
  endsAt: number | null
  /** Authoritative remaining time while idle/paused; last-computed display value while running. */
  remainingMs: number
  /** Count of completed work sessions — drives the long-break cadence. */
  completedWorkSessions: number
}

export function isBreak(phase: Phase): boolean {
  return phase === 'shortBreak' || phase === 'longBreak'
}

/** Policy: breaks auto-start, work sessions require a manual start. */
export function shouldAutoStart(phase: Phase): boolean {
  return isBreak(phase)
}

export function phaseDurationMs(phase: Phase, settings: TimerSettings): number {
  switch (phase) {
    case 'work':
      return settings.workMs
    case 'shortBreak':
      return settings.shortBreakMs
    case 'longBreak':
      return settings.longBreakMs
  }
}

/** Phase that follows `phase`, given the already-updated completed-work count. */
function nextPhaseAfter(
  phase: Phase,
  completedWorkSessions: number,
  settings: TimerSettings,
): Phase {
  if (isBreak(phase)) return 'work'
  return completedWorkSessions % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak'
}

export function createInitialState(settings: TimerSettings): TimerState {
  return {
    phase: 'work',
    status: 'idle',
    endsAt: null,
    remainingMs: settings.workMs,
    completedWorkSessions: 0,
  }
}

/** Start or resume the timer. Idle and paused both resume from `remainingMs`. */
export function start(state: TimerState, now: number): TimerState {
  if (state.status === 'running') return state
  return { ...state, status: 'running', endsAt: now + state.remainingMs }
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.endsAt === null) return state
  return { ...state, status: 'paused', endsAt: null, remainingMs: Math.max(0, state.endsAt - now) }
}

/** Reset the current phase back to its full duration (does not change phase or cadence). */
export function reset(state: TimerState, settings: TimerSettings): TimerState {
  return {
    ...state,
    status: 'idle',
    endsAt: null,
    remainingMs: phaseDurationMs(state.phase, settings),
  }
}

/**
 * Skip the current phase. Does not count as a completed session and does not
 * advance the long-break cadence; lands on the next phase idle. Skipping work
 * always yields a short break (a long break is only earned by completing work).
 */
export function skip(state: TimerState, settings: TimerSettings): TimerState {
  const phase: Phase = isBreak(state.phase) ? 'work' : 'shortBreak'
  return {
    phase,
    status: 'idle',
    endsAt: null,
    remainingMs: phaseDurationMs(phase, settings),
    completedWorkSessions: state.completedWorkSessions,
  }
}

/** Refresh the display-only `remainingMs` for a running timer. Never transitions phase. */
export function tick(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.endsAt === null) return state
  return { ...state, remainingMs: Math.max(0, state.endsAt - now) }
}

export function isExpired(state: TimerState, now: number): boolean {
  return state.status === 'running' && state.endsAt !== null && now >= state.endsAt
}

/**
 * Complete the current phase (it reached zero at time `at`) and advance to the
 * next one. Completing work bumps the cadence counter. Breaks auto-start from
 * `at`; work lands idle awaiting a manual start.
 */
export function complete(state: TimerState, at: number, settings: TimerSettings): TimerState {
  const completedWork = state.phase === 'work'
  const completedWorkSessions = state.completedWorkSessions + (completedWork ? 1 : 0)
  const phase = nextPhaseAfter(state.phase, completedWorkSessions, settings)
  const durationMs = phaseDurationMs(phase, settings)

  if (shouldAutoStart(phase) && durationMs > 0) {
    return {
      phase,
      status: 'running',
      endsAt: at + durationMs,
      remainingMs: durationMs,
      completedWorkSessions,
    }
  }
  return { phase, status: 'idle', endsAt: null, remainingMs: durationMs, completedWorkSessions }
}

export interface SettleResult {
  state: TimerState
  /** How many work sessions completed during settling (drives stats). */
  workCompleted: number
  /** Whether the phase advanced at all (vs. just refreshing remaining). */
  advanced: boolean
}

/**
 * Advance a state against the current time, replaying every phase that elapsed.
 *
 * Shared by reload-settling and the live tick loop. If the timer was running
 * and one or more phases finished, replay those completions (following the
 * auto-start policy) until it lands on a phase that is still running or idle.
 * Phases never chain indefinitely because a completed break always yields an
 * idle work phase. A still-running result has its display `remainingMs`
 * refreshed from `now`.
 */
export function settle(state: TimerState, now: number, settings: TimerSettings): SettleResult {
  let s = state
  let workCompleted = 0
  let advanced = false
  // Defensive iteration cap; in practice this terminates within two steps.
  for (let guard = 0; guard < 1000; guard++) {
    if (s.status !== 'running' || s.endsAt === null || now < s.endsAt) break
    if (s.phase === 'work') workCompleted += 1
    s = complete(s, s.endsAt, settings)
    advanced = true
  }
  if (s.status === 'running' && s.endsAt !== null) {
    s = { ...s, remainingMs: Math.max(0, s.endsAt - now) }
  }
  return { state: s, workCompleted, advanced }
}

/** Settle a persisted state against the current time after a reload. */
export function rehydrate(state: TimerState, now: number, settings: TimerSettings): TimerState {
  return settle(state, now, settings).state
}

/** Fraction of the current phase elapsed, 0 (just started) → 1 (finished). */
export function progress(state: TimerState, settings: TimerSettings): number {
  const total = phaseDurationMs(state.phase, settings)
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, 1 - state.remainingMs / total))
}

/** Format a remaining duration as `MM:SS`, rounding up so the last second reads 00:01. */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
