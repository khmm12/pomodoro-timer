<script setup vapor lang="ts"></script>

<template>
  <div class="inline-flex items-center gap-2.5">
    <svg
      class="h-7 w-7 transition-[filter] duration-500 [filter:drop-shadow(0_3px_6px_rgb(var(--accent-rgb)/0.35))]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 3c-1 0-1.6.5-2.4.5C7 3.5 4 6 4 10.5 4 16 7.6 21 12 21s8-5 8-10.5C20 6 17 3.5 14.4 3.5 13.6 3.5 13 3 12 3z"
        fill="var(--accent)"
      />
      <path d="M12 3.2c.7-1.1 2-1.7 3.2-1.4-.2 1.2-1 2.3-2.2 2.6" fill="var(--accent-soft)" />
      <path
        d="M9.3 8.4c-1 .7-1.6 1.8-1.7 3.1"
        fill="none"
        stroke="rgb(255 255 255 / 0.55)"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
    <span class="font-display text-(--text) text-[1.1rem] font-bold tracking-[-0.01em]">Pomodoro</span>
  </div>
</template>
