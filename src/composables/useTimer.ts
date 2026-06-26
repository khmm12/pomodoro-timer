import { computed, ref, watch } from 'vue'
import { isFiniteNumber, load, save } from '@/lib/persistence'
import {
  createInitialState,
  formatRemaining,
  type Phase,
  pause,
  phaseDurationMs,
  progress,
  reset,
  settle,
  skip,
  start,
  type TimerState,
  type TimerStatus,
} from '@/lib/timer-machine'
import { useNotifications } from './useNotifications'
import { useSettings } from './useSettings'
import { useSound } from './useSound'
import { useStats } from './useStats'

const STORAGE_KEY = 'timer'
const TICK_MS = 250

const { settings, timerSettings } = useSettings()
const stats = useStats()
const sound = useSound()
const notifications = useNotifications()

const PHASES: readonly Phase[] = ['work', 'shortBreak', 'longBreak']
const STATUSES: readonly TimerStatus[] = ['idle', 'running', 'paused']

function coerceState(raw: unknown): TimerState {
  const fallback = createInitialState(timerSettings.value)
  if (raw === null || typeof raw !== 'object') return fallback
  const data = raw as Record<string, unknown>
  if (!PHASES.includes(data.phase as Phase) || !STATUSES.includes(data.status as TimerStatus))
    return fallback
  const { endsAt, remainingMs, completedWorkSessions } = data
  if (
    !(endsAt === null || isFiniteNumber(endsAt)) ||
    !isFiniteNumber(remainingMs) ||
    !isFiniteNumber(completedWorkSessions) ||
    // A running timer without an end time is corrupt — it could never settle or pause.
    (data.status === 'running' && endsAt === null)
  ) {
    return fallback
  }
  return {
    phase: data.phase as Phase,
    status: data.status as TimerStatus,
    endsAt,
    remainingMs: Math.max(0, remainingMs),
    completedWorkSessions: Math.max(0, Math.floor(completedWorkSessions)),
  }
}

// Load + settle any phases that elapsed while the page was closed. Credit work
// sessions that completed while away, mirroring the live catch-up path.
const restored = settle(coerceState(load(STORAGE_KEY)), Date.now(), timerSettings.value)
const state = ref<TimerState>(restored.state)
for (let i = 0; i < restored.workCompleted; i += 1) stats.recordCompletedWork()

// Persist on meaningful change. While running, `remainingMs` is derived from
// `endsAt`, so it is pinned to avoid rewriting storage on every 250ms tick.
const persistable = computed<TimerState>(() =>
  state.value.status === 'running' ? { ...state.value, remainingMs: 0 } : state.value,
)
watch(persistable, (value) => save(STORAGE_KEY, value), { deep: true })

// Keep an idle timer's displayed time in sync when durations change in settings.
watch(timerSettings, (next) => {
  if (state.value.status === 'idle') {
    state.value = { ...state.value, remainingMs: phaseDurationMs(state.value.phase, next) }
  }
})

function phaseMessage(phase: Phase): { title: string; body: string } {
  switch (phase) {
    case 'work':
      return { title: 'Break over', body: 'Back to work — start when ready.' }
    case 'shortBreak':
      return { title: 'Work session complete', body: 'Time for a short break.' }
    case 'longBreak':
      return { title: 'Work session complete', body: 'Time for a long break.' }
  }
}

function announceCompletion(phase: Phase): void {
  if (settings.soundEnabled) sound.playChime()
  if (settings.notificationsEnabled) {
    const { title, body } = phaseMessage(phase)
    notifications.notify(title, body)
  }
}

function frame(now: number): void {
  stats.syncDate()
  const result = settle(state.value, now, timerSettings.value)
  state.value = result.state
  if (result.advanced) {
    for (let i = 0; i < result.workCompleted; i += 1) stats.recordCompletedWork()
    announceCompletion(result.state.phase)
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null

watch(
  () => state.value.status === 'running',
  (isRunning) => {
    if (isRunning && intervalId === null) {
      intervalId = setInterval(() => frame(Date.now()), TICK_MS)
    } else if (!isRunning && intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  },
  { immediate: true },
)

// Catch up immediately when the tab regains focus (intervals throttle while hidden).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) frame(Date.now())
  })
}

function startTimer(): void {
  sound.unlock()
  if (settings.notificationsEnabled) void notifications.requestPermission()
  state.value = start(state.value, Date.now())
}

function pauseTimer(): void {
  state.value = pause(state.value, Date.now())
}

function toggle(): void {
  if (state.value.status === 'running') pauseTimer()
  else startTimer()
}

function resetTimer(): void {
  state.value = reset(state.value, timerSettings.value)
}

function skipPhase(): void {
  state.value = skip(state.value, timerSettings.value)
}

const phase = computed(() => state.value.phase)
const formatted = computed(() => formatRemaining(state.value.remainingMs))
const progressValue = computed(() => progress(state.value, timerSettings.value))
const isRunning = computed(() => state.value.status === 'running')
const isIdle = computed(() => state.value.status === 'idle')
const isPaused = computed(() => state.value.status === 'paused')
const cyclePosition = computed(() => state.value.completedWorkSessions % settings.longBreakInterval)
const longBreakInterval = computed(() => settings.longBreakInterval)

export function useTimer() {
  return {
    phase,
    formatted,
    progress: progressValue,
    isRunning,
    isIdle,
    isPaused,
    cyclePosition,
    longBreakInterval,
    toggle,
    resetTimer,
    skipPhase,
  }
}
