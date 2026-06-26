import { computed, ref, watch } from 'vue'
import { load, save } from '@/lib/persistence'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

function coerce(raw: unknown): ThemeMode {
  return typeof raw === 'string' && MODES.includes(raw as ThemeMode) ? (raw as ThemeMode) : 'system'
}

const mode = ref<ThemeMode>(coerce(load(STORAGE_KEY)))

const prefersDark = ref(false)
const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
if (media) {
  prefersDark.value = media.matches
  media.addEventListener('change', (event) => {
    prefersDark.value = event.matches
  })
}

const isDark = computed(
  () => mode.value === 'dark' || (mode.value === 'system' && prefersDark.value),
)

watch(
  isDark,
  (dark) => {
    document.documentElement.classList.toggle('dark', dark)
  },
  { immediate: true },
)

watch(mode, (value) => save(STORAGE_KEY, value))

function cycleTheme(): void {
  const index = MODES.indexOf(mode.value)
  mode.value = MODES[(index + 1) % MODES.length] as ThemeMode
}

export function useTheme() {
  return { mode, setMode: (value: ThemeMode) => (mode.value = value), cycleTheme }
}
