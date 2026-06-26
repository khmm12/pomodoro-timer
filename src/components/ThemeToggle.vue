<script setup vapor lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import BaseIcon from './BaseIcon.vue'

const { mode, cycleTheme } = useTheme()

const icon = computed(() =>
  mode.value === 'light' ? 'sun' : mode.value === 'dark' ? 'moon' : 'monitor',
)
const label = computed(() => `Theme: ${mode.value} (click to change)`)
</script>

<template>
  <button
    type="button"
    class="btn-ghost flex h-[2.6rem] w-[2.6rem] items-center justify-center rounded-full"
    :aria-label="label"
    :title="label"
    @click="cycleTheme"
  >
    <BaseIcon :name="icon" :size="20" />
  </button>
</template>
