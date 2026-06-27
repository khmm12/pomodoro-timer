# CLAUDE.md

Project guidance for working in this repository.

## What this is

An offline-capable Pomodoro timer PWA. Single-screen app: a tactile timer dial
with focus/break phases, customizable durations, daily stats, light/dark themes,
sound + system-notification alerts, and reload-survival.

## Stack

- Vue 3 (**Vapor mode**, per-component) + TypeScript 6 (strict, `@tsconfig/strictest` + ts-reset).
- Vite + vite-plugin-pwa + `@vite-pwa/assets-generator`.
- Tailwind CSS v4 (CSS-first, no `tailwind.config.js`).
- Biome (lint + format) — not ESLint/Prettier.
- Vitest for the pure timer logic.
- Node 24 via mise; pnpm via corepack.

## Commands

- `pnpm dev` — dev server.
- `pnpm build` — `vue-tsc --noEmit` then `vite build`.
- `pnpm test` — Vitest.
- `pnpm typecheck` — `vue-tsc --noEmit`.
- `pnpm check` — Biome (CI gate). `pnpm format` — Biome write.
- `pnpm generate-pwa-assets` — regenerate icons from `public/logo.svg`.

## Architecture

- **`src/lib/timer-machine.ts`** — pure, framework-free state machine. Source of
  truth is an absolute `endsAt` timestamp; remaining time is derived from
  `endsAt - now`. `settle()` replays elapsed phases (shared by reload-rehydrate
  and the live tick). Fully unit-tested in `timer-machine.test.ts` — keep it pure
  and keep the tests green when changing timer behaviour.
- **`src/lib/persistence.ts`** — tiny guarded `localStorage` wrapper (`pomodoro:v1:` keys).
- **`src/composables/`** — module-level reactive singletons wrapping the machine:
  `useTimer` (orchestrates ticking, persistence, and completion side effects),
  `useSettings`, `useStats`, `useTheme`, `useNotifications`, `useSound`. No Pinia.
- **`src/components/`** — all `.vue` with `<script setup vapor>`. The app boots
  via `createVaporApp` in `main.ts`.
- **`useSound`** synthesizes the chime with the Web Audio API (no audio asset to ship).

## Conventions

- **Vapor:** components use `<script setup vapor>`. The whole tree is Vapor —
  no VDOM interop. Composition API only.
- **Styling is Tailwind-first.** Write utilities in markup. Semantic colors are
  defined as CSS custom properties in `src/style.css` (`:root` / `.dark` /
  `[data-phase]`) and exposed as Tailwind utilities via `@theme inline` — e.g.
  `--color-surface: var(--surface)` → `bg-surface`, `text-foreground`. Use the
  plain utility names (`bg-surface`, `text-accent`), not the raw var syntax
  (`bg-(--surface)`). When adding a new semantic color, register it in both the
  `:root`/`.dark` blocks and the `@theme inline` block. Genuinely complex
  volumetric pieces (dial shadows, button gradients, the arc glow) are defined
  once as `@utility` in `src/style.css`.
- **Animations are pure CSS** (no `<Transition>`), so they don't depend on
  unverified Vapor transition behaviour. Always honour `prefers-reduced-motion`.
- **SVG glow gotcha:** never put `drop-shadow` on an SVG shape (square halo from
  the default rectangular filter region) — apply it as a CSS filter on the
  `<svg>` element instead (see `dial-glow`).
- TypeScript is strict with `verbatimModuleSyntax` — use `import type` for types.
- English only, in code, UI, docs, and commits. Conventional Commits.

## Notes

- Vue is pinned to an exact `3.6.0-beta.x` (Vapor ships in 3.6). Do not float the
  beta range.
- Deploy is automatic on Vercel; GitHub Actions only runs checks.
