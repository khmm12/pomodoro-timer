import { computed, reactive, ref, watch } from 'vue'
import { isFiniteNumber, load, save } from '@/lib/persistence'

interface StatsData {
  /** Completed work sessions keyed by local date (`YYYY-MM-DD`). */
  byDate: Record<string, number>
}

const STORAGE_KEY = 'stats'
const HISTORY_DAYS = 30

function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function coerce(raw: unknown): StatsData {
  if (raw === null || typeof raw !== 'object') return { byDate: {} }
  const byDateRaw = (raw as Record<string, unknown>).byDate
  if (byDateRaw === null || typeof byDateRaw !== 'object') return { byDate: {} }
  const byDate: Record<string, number> = {}
  for (const [key, value] of Object.entries(byDateRaw)) {
    if (isFiniteNumber(value) && value > 0) byDate[key] = Math.floor(value)
  }
  return { byDate }
}

const data = reactive<StatsData>(coerce(load(STORAGE_KEY)))
const dateKey = ref(localDateKey())

watch(data, (value) => save(STORAGE_KEY, value), { deep: true })

const todayCount = computed(() => data.byDate[dateKey.value] ?? 0)

/** Re-evaluate which day is "today" — call periodically to handle the midnight rollover. */
function syncDate(): void {
  const current = localDateKey()
  if (current !== dateKey.value) dateKey.value = current
}

function recordCompletedWork(): void {
  syncDate()
  const key = dateKey.value
  data.byDate[key] = (data.byDate[key] ?? 0) + 1
  pruneHistory()
}

function pruneHistory(): void {
  const keys = Object.keys(data.byDate).sort()
  if (keys.length <= HISTORY_DAYS) return
  for (const key of keys.slice(0, keys.length - HISTORY_DAYS)) delete data.byDate[key]
}

export function useStats() {
  return { todayCount, recordCompletedWork, syncDate }
}
