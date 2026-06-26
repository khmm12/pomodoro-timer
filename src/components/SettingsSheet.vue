<script setup vapor lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import { SETTINGS_BOUNDS, useSettings } from '@/composables/useSettings'
import { type ThemeMode, useTheme } from '@/composables/useTheme'
import BaseIcon from './BaseIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { settings } = useSettings()
const { mode, setMode } = useTheme()
const notifications = useNotifications()

type NumberKey = keyof typeof SETTINGS_BOUNDS
type AlertKey = 'soundEnabled' | 'notificationsEnabled'

const numberFields: { key: NumberKey; label: string; unit: string }[] = [
  { key: 'workMinutes', label: 'Focus', unit: 'min' },
  { key: 'shortBreakMinutes', label: 'Short break', unit: 'min' },
  { key: 'longBreakMinutes', label: 'Long break', unit: 'min' },
  { key: 'longBreakInterval', label: 'Long break every', unit: 'sessions' },
]

const alertFields: { key: AlertKey; label: string }[] = [
  { key: 'soundEnabled', label: 'Sound' },
  { key: 'notificationsEnabled', label: 'Notifications' },
]

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
]

function step(key: NumberKey, delta: number): void {
  const { min, max } = SETTINGS_BOUNDS[key]
  settings[key] = Math.min(max, Math.max(min, settings[key] + delta))
}

function toggle(key: AlertKey): void {
  const next = !settings[key]
  settings[key] = next
  if (key === 'notificationsEnabled' && next) void notifications.requestPermission()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) emit('close')
}
</script>

<template>
  <div
    class="group invisible pointer-events-none fixed inset-0 z-50 flex items-end justify-center data-open:visible data-open:pointer-events-auto sm:items-center"
    :data-open="open ? '' : null"
    :inert="!open"
    @keydown="onKeydown"
  >
    <div
      class="absolute inset-0 bg-[rgb(10_10_14/0.45)] opacity-0 backdrop-blur-sm transition-opacity duration-300 group-data-open:opacity-100"
      @click="emit('close')"
    />

    <section
      class="surface-card relative w-full max-w-[30rem] translate-y-full rounded-t-[1.6rem] px-6 pb-8 pt-6 transition-transform duration-[380ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-data-open:translate-y-0 sm:translate-y-4 sm:scale-95 sm:rounded-[1.6rem] sm:opacity-0 sm:transition-[transform,opacity] sm:group-data-open:translate-y-0 sm:group-data-open:scale-100 sm:group-data-open:opacity-100"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <header class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-(--text) m-0 text-xl font-bold">Settings</h2>
        <button
          type="button"
          class="btn-ghost flex h-[2.4rem] w-[2.4rem] items-center justify-center rounded-full"
          aria-label="Close settings"
          @click="emit('close')"
        >
          <BaseIcon name="close" :size="20" />
        </button>
      </header>

      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <p class="section-label">Durations</p>
          <div v-for="field in numberFields" :key="field.key" class="flex items-center justify-between py-2">
            <span class="text-(--text) text-[0.96rem]">{{ field.label }}</span>
            <div class="inline-flex items-center gap-1.5">
              <button
                type="button"
                class="btn-ghost flex h-[2.1rem] w-[2.1rem] items-center justify-center rounded-full text-xl leading-none"
                :aria-label="`Decrease ${field.label}`"
                @click="step(field.key, -1)"
              >
                –
              </button>
              <span class="text-(--text) min-w-[4.4rem] text-center font-semibold tabular-nums">
                {{ settings[field.key] }}<span class="text-(--text-muted) ml-1 text-[0.78rem] font-normal">{{ field.unit }}</span>
              </span>
              <button
                type="button"
                class="btn-ghost flex h-[2.1rem] w-[2.1rem] items-center justify-center rounded-full text-xl leading-none"
                :aria-label="`Increase ${field.label}`"
                @click="step(field.key, 1)"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <p class="section-label">Alerts</p>
          <button
            v-for="alert in alertFields"
            :key="alert.key"
            type="button"
            class="flex w-full items-center justify-between border-none bg-transparent py-2 font-[inherit]"
            role="switch"
            :aria-checked="settings[alert.key]"
            @click="toggle(alert.key)"
          >
            <span class="text-(--text) text-[0.96rem]">{{ alert.label }}</span>
            <span
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
              :class="settings[alert.key] ? 'bg-(--accent)' : 'bg-(--track)'"
            >
              <span
                class="absolute left-[0.2rem] top-[0.2rem] h-[1.2rem] w-[1.2rem] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.3)] transition-transform duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                :class="settings[alert.key] ? 'translate-x-[1.1rem]' : 'translate-x-0'"
              />
            </span>
          </button>
        </div>

        <div class="flex flex-col gap-1">
          <p class="section-label">Appearance</p>
          <div class="bg-(--track) grid grid-cols-3 gap-1 rounded-[0.9rem] p-1">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              type="button"
              class="rounded-[0.65rem] border-none bg-transparent p-2 text-[0.88rem] transition-colors duration-200"
              :class="mode === option.value ? 'bg-(--surface) text-(--text) shadow-[0_1px_4px_rgb(0_0_0/0.12)]' : 'text-(--text-muted)'"
              @click="setMode(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
