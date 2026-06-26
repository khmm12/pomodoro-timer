<script setup vapor lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  time: string
  phaseLabel: string
  statusLabel: string
  isRunning: boolean
}>()

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// The arc drains: full at the start of a phase, empty when it completes.
const dashOffset = computed(() => CIRCUMFERENCE * Math.min(1, Math.max(0, props.progress)))
</script>

<template>
  <div class="aspect-square w-[clamp(264px,76vw,420px)]">
    <div
      class="dial-plate relative grid h-full w-full place-items-center rounded-full"
      :class="{ 'animate-breathe': isRunning }"
    >
      <svg
        class="dial-glow h-full w-full"
        viewBox="0 0 100 100"
        role="img"
        :aria-label="`${phaseLabel}: ${time} remaining`"
      >
        <circle class="dial-track" cx="50" cy="50" :r="RADIUS" fill="none" stroke-width="5" />
        <circle
          class="dial-arc"
          cx="50"
          cy="50"
          :r="RADIUS"
          fill="none"
          stroke-width="5"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 50 50)"
        />
      </svg>

      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span
          class="font-display text-(--accent) text-[clamp(0.72rem,2.6vw,0.86rem)] font-semibold uppercase tracking-[0.22em] transition-colors duration-500"
        >
          {{ phaseLabel }}
        </span>
        <span
          class="text-(--text) font-semibold tabular-nums leading-none tracking-[-0.02em] text-[clamp(3.4rem,15vw,5.4rem)]"
        >
          {{ time }}
        </span>
        <span class="text-(--text-muted) min-h-[1em] text-[clamp(0.66rem,2.2vw,0.78rem)] uppercase tracking-[0.16em]">
          {{ statusLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
