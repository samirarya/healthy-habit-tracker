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

Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` to run (see `src/lib/supabase/`) — the app redirects to `/login` for everything if these aren't a valid Supabase project's credentials.

## Architecture

Next.js App Router app with Supabase for auth (email/password) and persistence (Postgres + Row Level Security). No custom backend beyond Supabase itself.

- `src/lib/supabase/client.ts` / `server.ts` — the two Supabase client factories (`@supabase/ssr`), one for Client Components/browser code, one for Server Components/Server Actions (cookie-based session, `await cookies()`).
- `src/lib/supabase/dal.ts` — the Data Access Layer: `getUser()` (no redirect, used in `layout.tsx` which also renders the logged-out `/login`/`/signup` pages) and `verifySession()` (redirects to `/login` if unauthenticated — the authoritative per-request auth check, used in `src/app/page.tsx`).
- `src/proxy.ts` — **not** `middleware.ts` — see "modified Next.js" below. Refreshes the Supabase session cookie and does the optimistic (cookie-only) redirect: unauthenticated → `/login`, authenticated-on-`/login`|`/signup` → `/`. This is a fast pre-filter, not the security boundary — `verifySession()` in the DAL is.
- `src/app/actions/auth.ts` — `login`/`signup`/`logout` Server Actions (`'use server'`), shaped for `useActionState` (`{error}` or `{message}` return value), backing `src/app/login/page.tsx` and `src/app/signup/page.tsx`.
- `src/app/page.tsx` — an `async` Server Component: calls `verifySession()`, fetches the caller's one row from the `challenge_progress` table, and passes it into `HabitTracker` as `initialChallenge`.
- `src/components/HabitTracker.tsx` — the actual habit-tracking UI (`'use client'`). This *is* the old single-file app, mostly unchanged:
  - `HABITS` (top of file) is the single source of truth for the 18 tracked habits, each tagged with a `category` (`Morning`, `Breakfast & Midday`, `Afternoon`, `Evening`, `Night`). Add/remove/edit habits here — the UI (category grouping, per-category counts, icons via `CATEGORY_ICONS`) derives entirely from this array.
  - State (`ChallengeState`) is `{ startDate, days: Record<1..21, DayData>, currentDayIndex }`, `DayData` is `{ habits: Record<habitId, boolean>, completed }` — seeded from the `initialChallenge` prop (no more `localStorage`). Changes are pushed to the `challenge_progress` table with a ~500ms-debounced fire-and-forget `.update()` scoped by `userId` (RLS enforces a user can only write their own row regardless).
  - "Current streak" is *not* calendar-based. It's computed by walking days 1→21 and counting consecutive `completed` days starting from Day 1, stopping at the first incomplete day — selecting a later day out of order does not affect it.
- `src/app/layout.tsx` — root layout; calls the non-redirecting `getUser()` to show the signed-in email + a logout button in the header when there's a session (display only — it is not the access-control check, see the "Layouts and auth checks" caveat in the Next.js auth guide if changing this).
- Database: one table, `challenge_progress` (`user_id` PK/FK to `auth.users`, `days jsonb`, `current_day_index`, `start_date`, `updated_at`), RLS-scoped to `auth.uid() = user_id`, auto-seeded by a trigger on `auth.users` insert. No ORM/migration tool — schema lives as raw SQL run once in the Supabase SQL editor (not checked into this repo).
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config`), with manual `dark:` variants throughout (no theme system/toggle — it just follows OS preference). Icons are from `lucide-react`.
- Path alias `@/*` → `./src/*` (see `tsconfig.json`).

## Important: this is a modified Next.js

Per `AGENTS.md`, the installed `next` package in this project has behavior that diverges from upstream Next.js/your training data. Before writing any code that touches Next.js APIs or conventions, read the relevant guide under `node_modules/next/dist/docs/`. Two concrete instances of this already hit in this codebase:

- `next dev` auto-generates/re-adds a managed block in `AGENTS.md` (and `CLAUDE.md`, if `AGENTS.md` doesn't exist) — see `node_modules/next/dist/server/lib/generate-agent-files.js`. Don't fight this by deleting the block; either leave it or set `agentRules: false` in `next.config.ts`.
- `middleware.ts` is deprecated in this fork and renamed to `proxy.ts`, exporting a function named `proxy` (not `middleware`) — see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Any tutorial/example that says "create `middleware.ts`" (e.g. most Supabase Auth SSR guides) needs that substitution; the file also has to live next to `app/`, i.e. `src/proxy.ts` here, not the repo root.
