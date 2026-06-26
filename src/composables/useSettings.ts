import { computed, reactive, watch } from 'vue'
import { isFiniteNumber, load, save } from '@/lib/persistence'
import type { TimerSettings } from '@/lib/timer-machine'

export interface Settings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  soundEnabled: boolean
  notificationsEnabled: boolean
}

export const SETTINGS_BOUNDS = {
  workMinutes: { min: 1, max: 90 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 60 },
  longBreakInterval: { min: 1, max: 12 },
} as const

const DEFAULTS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  notificationsEnabled: true,
}

const STORAGE_KEY = 'settings'

function clampInt(value: number, { min, max }: { min: number; max: number }): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function coerce(raw: unknown): Settings {
  if (raw === null || typeof raw !== 'object') return { ...DEFAULTS }
  const data = raw as Record<string, unknown>
  const num = (key: keyof typeof SETTINGS_BOUNDS): number => {
    const value = data[key]
    return isFiniteNumber(value) ? clampInt(value, SETTINGS_BOUNDS[key]) : DEFAULTS[key]
  }
  const bool = (key: 'soundEnabled' | 'notificationsEnabled'): boolean =>
    typeof data[key] === 'boolean' ? (data[key] as boolean) : DEFAULTS[key]
  return {
    workMinutes: num('workMinutes'),
    shortBreakMinutes: num('shortBreakMinutes'),
    longBreakMinutes: num('longBreakMinutes'),
    longBreakInterval: num('longBreakInterval'),
    soundEnabled: bool('soundEnabled'),
    notificationsEnabled: bool('notificationsEnabled'),
  }
}

const settings = reactive<Settings>(coerce(load(STORAGE_KEY)))

watch(settings, (value) => save(STORAGE_KEY, value), { deep: true })

/** Settings projected into milliseconds for the pure timer machine. */
const timerSettings = computed<TimerSettings>(() => ({
  workMs: settings.workMinutes * 60_000,
  shortBreakMs: settings.shortBreakMinutes * 60_000,
  longBreakMs: settings.longBreakMinutes * 60_000,
  longBreakInterval: settings.longBreakInterval,
}))

export function useSettings() {
  return { settings, timerSettings }
}
