<script setup vapor lang="ts">
import { computed } from 'vue'

const props = defineProps<{ total: number; filled: number }>()

const dots = computed(() => Array.from({ length: props.total }, (_, i) => i < props.filled))
</script>

<template>
  <div class="flex items-center gap-2.5" :aria-label="`${filled} of ${total} sessions until a long break`" role="img">
    <span
      v-for="(active, i) in dots"
      :key="i"
      class="h-2 w-2 rounded-full transition-all duration-300"
      :class="active ? 'bg-accent scale-[1.18]' : 'bg-track'"
    />
  </div>
</template>
