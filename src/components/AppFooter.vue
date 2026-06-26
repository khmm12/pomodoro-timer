<script setup vapor lang="ts">
import BaseIcon from './BaseIcon.vue'

const REPO_URL = 'https://github.com/khmm12/pomodoro-timer'
</script>

<template>
  <footer class="animate-enter-fade text-(--text-muted) flex items-center justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] text-[0.8rem]">
    <span>Made with <span class="text-(--accent) transition-colors duration-500">♥</span> by khmm12</span>
    <span aria-hidden="true">·</span>
    <a
      :href="REPO_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 transition-colors duration-200 hover:text-(--text)"
    >
      <BaseIcon name="github" :size="15" />
      <span>GitHub</span>
    </a>
  </footer>
</template>
