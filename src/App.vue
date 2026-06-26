<script setup vapor lang="ts">
import { computed, ref } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppLogo from './components/AppLogo.vue'
import BaseIcon from './components/BaseIcon.vue'
import CycleDots from './components/CycleDots.vue'
import SettingsSheet from './components/SettingsSheet.vue'
import StatsBadge from './components/StatsBadge.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import TimerControls from './components/TimerControls.vue'
import TimerDial from './components/TimerDial.vue'
import { useStats } from './composables/useStats'
import { useTimer } from './composables/useTimer'

const {
  phase,
  formatted,
  progress,
  isRunning,
  isIdle,
  isPaused,
  cyclePosition,
  longBreakInterval,
  toggle,
  resetTimer,
  skipPhase,
} = useTimer()
const { todayCount } = useStats()

const settingsOpen = ref(false)

const PHASE_LABELS = { work: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' } as const
const phaseLabel = computed(() => PHASE_LABELS[phase.value])
const statusLabel = computed(() => (isPaused.value ? 'Paused' : isIdle.value ? 'Ready' : ''))
</script>

<template>
  <div class="ambient flex min-h-screen flex-col" :data-phase="phase">
    <header class="flex items-center justify-between px-5 py-5 sm:px-8">
      <AppLogo class="animate-enter-up" />
      <div class="flex items-center gap-1">
        <ThemeToggle class="animate-enter-up" />
        <button
          type="button"
          class="btn-ghost animate-enter-up flex h-[2.6rem] w-[2.6rem] items-center justify-center rounded-full"
          aria-label="Open settings"
          @click="settingsOpen = true"
        >
          <BaseIcon name="settings" :size="20" />
        </button>
      </div>
    </header>

    <main class="flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-4 sm:gap-10">
      <CycleDots
        class="animate-enter-up [animation-delay:80ms]"
        :total="longBreakInterval"
        :filled="cyclePosition"
      />

      <TimerDial
        class="animate-enter-up"
        :progress="progress"
        :time="formatted"
        :phase-label="phaseLabel"
        :status-label="statusLabel"
        :is-running="isRunning"
      />

      <TimerControls
        class="animate-enter-up [animation-delay:160ms]"
        :is-running="isRunning"
        :is-idle="isIdle"
        @toggle="toggle"
        @reset="resetTimer"
        @skip="skipPhase"
      />

      <StatsBadge class="animate-enter-up [animation-delay:240ms]" :count="todayCount" />
    </main>

    <AppFooter />

    <SettingsSheet :open="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>
