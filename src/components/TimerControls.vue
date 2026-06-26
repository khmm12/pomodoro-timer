<script setup vapor lang="ts">
import { computed } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps<{ isRunning: boolean; isIdle: boolean }>()
defineEmits<{ toggle: []; reset: []; skip: [] }>()

const primaryLabel = computed(() => (props.isRunning ? 'Pause' : props.isIdle ? 'Start' : 'Resume'))
</script>

<template>
  <div class="flex items-center justify-center gap-[clamp(1rem,4vw,1.6rem)]">
    <button
      type="button"
      class="btn-ghost flex h-12 w-12 items-center justify-center rounded-full"
      aria-label="Reset phase"
      @click="$emit('reset')"
    >
      <BaseIcon name="reset" :size="20" />
    </button>

    <button
      type="button"
      class="btn-primary flex min-w-[9.5rem] items-center justify-center gap-2.5 rounded-full px-10 py-4 text-[1.05rem] font-semibold"
      @click="$emit('toggle')"
    >
      <BaseIcon :name="isRunning ? 'pause' : 'play'" :size="24" />
      <span>{{ primaryLabel }}</span>
    </button>

    <button
      type="button"
      class="btn-ghost flex h-12 w-12 items-center justify-center rounded-full"
      aria-label="Skip phase"
      @click="$emit('skip')"
    >
      <BaseIcon name="skip" :size="20" />
    </button>
  </div>
</template>
