<script setup vapor lang="ts">
const ICONS = {
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />',
  pause:
    '<rect x="6" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none" />',
  reset: '<path d="M3 2v6h6" /><path d="M3.5 13a9 9 0 1 0 2.6-6.4L3 8" />',
  skip: '<path d="M5 4.5v15l11-7.5z" fill="currentColor" stroke="none" /><path d="M19 5v14" />',
  settings:
    '<path d="M20 7H10" /><path d="M6 7H4" /><path d="M20 17h-6" /><path d="M10 17H4" /><circle cx="8" cy="7" r="2.4" fill="none" /><circle cx="16" cy="17" r="2.4" fill="none" />',
  sun: '<circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" />',
  close: '<path d="M18 6 6 18M6 6l12 12" />',
  github:
    '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 20 4.8 4.9 4.9 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A4.9 4.9 0 0 0 5 4.8a5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7A3.4 3.4 0 0 0 9 17.7V22" fill="none" />',
} as const

defineProps<{ name: keyof typeof ICONS; size?: number }>()
</script>

<template>
  <svg
    :width="size ?? 22"
    :height="size ?? 22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[name]"
  />
</template>
