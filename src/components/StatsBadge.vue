<script setup vapor lang="ts">
import { computed } from 'vue'

const props = defineProps<{ count: number }>()

const label = computed(() =>
  props.count === 1 ? '1 session today' : `${props.count} sessions today`,
)
</script>

<template>
  <div class="text-muted flex items-baseline gap-1.5 text-[0.82rem]" :aria-label="label">
    <span class="text-accent self-center text-[0.55rem] transition-colors duration-500">●</span>
    <span class="text-foreground font-semibold tabular-nums">{{ count }}</span>
    <span class="tracking-[0.04em]">today</span>
  </div>
</template>
