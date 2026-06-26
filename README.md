# Pomodoro Timer

A clean, modern, offline-capable Pomodoro timer built as an installable PWA.

[![CI](https://github.com/khmm12/pomodoro-timer/actions/workflows/ci.yml/badge.svg)](https://github.com/khmm12/pomodoro-timer/actions/workflows/ci.yml)

The interface centres on a single tactile dial. Each phase warms or cools the
whole screen — focus glows ember, breaks settle into teal and indigo — so the
current mode is legible at a glance. It survives reloads, works fully offline,
and adapts to light and dark.

## Features

- **Focus / short break / long break** cycle with a configurable long-break cadence.
- **Reload-survival** — a running timer is restored exactly after a refresh or
  a closed tab, including any phases that elapsed while you were away.
- **Auto-start breaks**, manual start for focus sessions.
- **Completion alerts** — a synthesized chime and a system notification, each
  toggleable.
- **Daily stats** — completed focus sessions for the day.
- **Customizable durations** behind a single settings sheet.
- **Light / dark / system** themes.
- **Installable, offline-first PWA** with generated icons and a web manifest.
- Responsive across mobile, tablet, and desktop; respects reduced-motion.

## Tech stack

- [Vue 3](https://vuejs.org/) in **Vapor mode** (per-component) + TypeScript 6 (strict).
- [Vite](https://vite.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/).
- [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first).
- [Biome](https://biomejs.dev/) for linting and formatting.
- [Vitest](https://vitest.dev/) for the timer state-machine unit tests.
- Node 24 (via [mise](https://mise.jdx.dev/)) and pnpm (via corepack).

## Getting started

Prerequisites: [mise](https://mise.jdx.dev/) (manages Node 24). pnpm is provided
through corepack.

```bash
mise install        # install Node 24
corepack enable     # enable pnpm
pnpm install
pnpm dev            # http://localhost:5173
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server. |
| `pnpm build` | Type-check and build for production. |
| `pnpm preview` | Preview the production build. |
| `pnpm test` | Run unit tests. |
| `pnpm typecheck` | Type-check without emitting. |
| `pnpm check` | Lint and format-check with Biome. |
| `pnpm format` | Apply Biome fixes and formatting. |
| `pnpm generate-pwa-assets` | Regenerate icons from `public/logo.svg`. |

## How it works

The timer's single source of truth is an absolute `endsAt` timestamp rather than
a ticking countdown. Remaining time is always derived from `endsAt - now`, so a
throttled background tab or a page reload can never drift, and elapsed phases can
be replayed deterministically on load. The core lives in
[`src/lib/timer-machine.ts`](src/lib/timer-machine.ts) as pure functions covered
by unit tests; Vue composables in [`src/composables`](src/composables) wrap it
with reactivity, persistence, and side effects.

## Deployment

Deployed on [Vercel](https://vercel.com/), which builds and deploys
automatically on every push — no extra CI wiring needed. The GitHub Actions
workflow runs lint, type-check, tests, and build on pushes and pull requests.

## License

[MIT](LICENSE) © khmm12
