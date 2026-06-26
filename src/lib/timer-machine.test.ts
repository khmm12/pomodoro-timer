import { describe, expect, it } from 'vitest'
import {
  complete,
  createInitialState,
  formatRemaining,
  isExpired,
  pause,
  progress,
  rehydrate,
  reset,
  skip,
  start,
  type TimerSettings,
  type TimerState,
  tick,
} from './timer-machine'

const settings: TimerSettings = {
  workMs: 25 * 60_000,
  shortBreakMs: 5 * 60_000,
  longBreakMs: 15 * 60_000,
  longBreakInterval: 4,
}

const T0 = 1_000_000

function running(overrides: Partial<TimerState> = {}): TimerState {
  return {
    phase: 'work',
    status: 'running',
    endsAt: T0 + settings.workMs,
    remainingMs: settings.workMs,
    completedWorkSessions: 0,
    ...overrides,
  }
}

describe('createInitialState', () => {
  it('starts idle on a full work phase', () => {
    expect(createInitialState(settings)).toEqual({
      phase: 'work',
      status: 'idle',
      endsAt: null,
      remainingMs: settings.workMs,
      completedWorkSessions: 0,
    })
  })
})

describe('start / pause / resume', () => {
  it('start sets endsAt = now + remaining', () => {
    const s = start(createInitialState(settings), T0)
    expect(s.status).toBe('running')
    expect(s.endsAt).toBe(T0 + settings.workMs)
  })

  it('start is a no-op while already running', () => {
    const s = running()
    expect(start(s, T0 + 5000)).toBe(s)
  })

  it('pause freezes the remaining time and clears endsAt', () => {
    const s = pause(running(), T0 + 60_000)
    expect(s.status).toBe('paused')
    expect(s.endsAt).toBeNull()
    expect(s.remainingMs).toBe(settings.workMs - 60_000)
  })

  it('resume (start from paused) recomputes endsAt from frozen remaining', () => {
    const paused = pause(running(), T0 + 60_000)
    const resumed = start(paused, T0 + 100_000)
    expect(resumed.status).toBe('running')
    expect(resumed.endsAt).toBe(T0 + 100_000 + (settings.workMs - 60_000))
  })

  it('pause never produces negative remaining', () => {
    const s = pause(running(), T0 + settings.workMs + 5000)
    expect(s.remainingMs).toBe(0)
  })
})

describe('reset', () => {
  it('returns the current phase to its full duration, idle', () => {
    const s = reset(pause(running(), T0 + 60_000), settings)
    expect(s).toMatchObject({
      phase: 'work',
      status: 'idle',
      endsAt: null,
      remainingMs: settings.workMs,
    })
  })

  it('keeps the completed-work cadence counter', () => {
    const s = reset(running({ completedWorkSessions: 3 }), settings)
    expect(s.completedWorkSessions).toBe(3)
  })
})

describe('skip', () => {
  it('skips work to an idle short break without advancing cadence', () => {
    const s = skip(running({ completedWorkSessions: 3 }), settings)
    expect(s).toMatchObject({
      phase: 'shortBreak',
      status: 'idle',
      remainingMs: settings.shortBreakMs,
    })
    expect(s.completedWorkSessions).toBe(3)
  })

  it('skips a break back to idle work', () => {
    const s = skip(running({ phase: 'shortBreak', completedWorkSessions: 1 }), settings)
    expect(s).toMatchObject({ phase: 'work', status: 'idle', remainingMs: settings.workMs })
  })
})

describe('tick / isExpired', () => {
  it('tick refreshes remaining from endsAt', () => {
    expect(tick(running(), T0 + 90_000).remainingMs).toBe(settings.workMs - 90_000)
  })

  it('tick is a no-op when not running', () => {
    const idle = createInitialState(settings)
    expect(tick(idle, T0)).toBe(idle)
  })

  it('isExpired is true only once now reaches endsAt', () => {
    expect(isExpired(running(), T0 + settings.workMs - 1)).toBe(false)
    expect(isExpired(running(), T0 + settings.workMs)).toBe(true)
  })
})

describe('complete', () => {
  it('work -> short break, auto-started, cadence bumped', () => {
    const at = T0 + settings.workMs
    const s = complete(running(), at, settings)
    expect(s).toMatchObject({
      phase: 'shortBreak',
      status: 'running',
      endsAt: at + settings.shortBreakMs,
      completedWorkSessions: 1,
    })
  })

  it('every 4th completed work yields an auto-started long break', () => {
    const at = T0 + settings.workMs
    const s = complete(running({ completedWorkSessions: 3 }), at, settings)
    expect(s).toMatchObject({ phase: 'longBreak', status: 'running', completedWorkSessions: 4 })
  })

  it('break -> idle work, awaiting manual start, cadence unchanged', () => {
    const at = T0 + settings.shortBreakMs
    const s = complete(running({ phase: 'shortBreak', completedWorkSessions: 1 }), at, settings)
    expect(s).toMatchObject({
      phase: 'work',
      status: 'idle',
      endsAt: null,
      completedWorkSessions: 1,
    })
  })
})

describe('rehydrate (reload-survival)', () => {
  it('leaves a still-running timer intact, refreshing remaining', () => {
    const s = rehydrate(running(), T0 + 120_000, settings)
    expect(s.status).toBe('running')
    expect(s.remainingMs).toBe(settings.workMs - 120_000)
    expect(s.endsAt).toBe(T0 + settings.workMs)
  })

  it('settles a work phase that expired while away into an auto-started break', () => {
    // Reloaded 1 minute after the work phase should have ended.
    const now = T0 + settings.workMs + 60_000
    const s = rehydrate(running(), now, settings)
    expect(s.phase).toBe('shortBreak')
    expect(s.status).toBe('running')
    expect(s.completedWorkSessions).toBe(1)
    expect(s.remainingMs).toBe(settings.shortBreakMs - 60_000)
  })

  it('replays multiple elapsed phases: work + its break both gone -> idle work', () => {
    // Away long enough that work AND the auto-started break both elapsed.
    const now = T0 + settings.workMs + settings.shortBreakMs + 60_000
    const s = rehydrate(running(), now, settings)
    expect(s).toMatchObject({
      phase: 'work',
      status: 'idle',
      endsAt: null,
      completedWorkSessions: 1,
    })
    expect(s.remainingMs).toBe(settings.workMs)
  })

  it('does not touch an idle persisted state', () => {
    const idle = createInitialState(settings)
    expect(rehydrate(idle, T0 + 10_000_000, settings)).toEqual(idle)
  })

  it('does not touch a paused persisted state', () => {
    const paused = pause(running(), T0 + 60_000)
    expect(rehydrate(paused, T0 + 10_000_000, settings)).toEqual(paused)
  })
})

describe('progress', () => {
  it('is 0 at the start and 1 at the end', () => {
    expect(progress(running(), settings)).toBe(0)
    expect(progress(running({ remainingMs: 0 }), settings)).toBe(1)
  })

  it('is clamped to [0, 1]', () => {
    expect(progress(running({ remainingMs: settings.workMs * 2 }), settings)).toBe(0)
    expect(progress(running({ remainingMs: -5000 }), settings)).toBe(1)
  })
})

describe('formatRemaining', () => {
  it('rounds up so a fresh phase reads its full length', () => {
    expect(formatRemaining(25 * 60_000)).toBe('25:00')
  })

  it('shows 00:01 for the final second and 00:00 at zero', () => {
    expect(formatRemaining(1)).toBe('00:01')
    expect(formatRemaining(0)).toBe('00:00')
  })

  it('clamps negatives to 00:00', () => {
    expect(formatRemaining(-5000)).toBe('00:00')
  })
})
