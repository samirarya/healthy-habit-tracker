# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

There is no test suite configured in this project.

## Architecture

This is a single-page Next.js App Router app — effectively one client component, not a multi-route app. There is no backend, database, or API layer; all state lives in the browser.

- `src/app/page.tsx` — the entire application. A `'use client'` component that owns all state via `useState`/`useEffect`; no state management library, no child components have been extracted yet.
- `src/app/layout.tsx` — root layout; renders the static header/footer chrome and loads Geist fonts.
- `HABITS` (top of `page.tsx`) is the single source of truth for the 18 tracked habits, each tagged with a `category` (`Morning`, `Breakfast & Midday`, `Afternoon`, `Evening`, `Night`). Add/remove/edit habits here — the UI (category grouping, per-category counts, icons via `CATEGORY_ICONS`) derives entirely from this array.
- App state (`ChallengeState`) is `{ startDate, days: Record<1..21, DayData>, currentDayIndex }`, where `DayData` is `{ habits: Record<habitId, boolean>, completed }`. It is persisted to `localStorage` under the key `health_accountability_21_v1` on every change, and hydrated from it on mount — bump this key if the shape of `ChallengeState`/`DayData` changes, since old saved JSON won't migrate.
- "Current streak" is *not* calendar-based. It's computed by walking days 1→21 and counting consecutive `completed` days starting from Day 1, stopping at the first incomplete day — selecting a later day out of order does not affect it.
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config`), with manual `dark:` variants throughout (no theme system/toggle — it just follows OS preference). Icons are from `lucide-react`.
- Path alias `@/*` → `./src/*` (see `tsconfig.json`), unused so far since everything lives in one file.

## Important: this is a modified Next.js

Per `AGENTS.md`, the installed `next` package in this project has behavior that diverges from upstream Next.js/your training data. Before writing any code that touches Next.js APIs or conventions, read the relevant guide under `node_modules/next/dist/docs/`. One concrete instance of this: `next dev` auto-generates/re-adds a managed block in `AGENTS.md` (and `CLAUDE.md`, if `AGENTS.md` doesn't exist) — see `node_modules/next/dist/server/lib/generate-agent-files.js`. Don't fight this by deleting the block; either leave it or set `agentRules: false` in `next.config.ts`.
