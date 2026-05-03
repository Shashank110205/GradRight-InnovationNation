# GradRight Web

Next.js 16 (App Router) student product: landing, Supabase auth, onboarding, dashboard hub, and modules for **Career**, **Discover**, **Plan**, **Finance**, **Apply**, and **Succeed**. Gemini-backed APIs live under `app/api/` with clear module boundaries (see `docs/`).

## User journey

1. **`/`** — Marketing landing (public).
2. **`/sign-up`** → onboarding (`?next=/onboarding` from CTAs); **`/sign-in`** → dashboard for returning users.
3. **`/onboarding`** — Profile + GradScore.
4. **`/dashboard`** — Overview; sidebar navigates to modules.
5. **Modules** — `/career`, `/discover`, `/plan`, `/finance`, `/apply`, `/succeed` (authenticated shell: sidebar + **AppUserMenu** with My account + Sign out).

Legacy URLs (`/login`, `/signup`, `/financing`, `/loan`) redirect via `middleware.ts`.

## Documentation

| Doc | Content |
|-----|---------|
| [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) | Folders, ownership, conventions |
| [`docs/ROUTE_MAP.md`](docs/ROUTE_MAP.md) | Every route + API surface |
| [`docs/REFACTOR_LOG.md`](docs/REFACTOR_LOG.md) | Moves, renames, API migration |

## Setup

```bash
cd gradright-web
cp .env.example .env.local
pnpm install
pnpm dev
```

Required public env vars are validated at startup (`lib/config/env.ts`, `instrumentation.ts`). Fill all keys from `.env.example` before running features that touch the database, AI, or email.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Student app (default port 3000) |
| `pnpm dev:nbfc` | NBFC Insights host (port 3001, `NEXT_PUBLIC_PORTAL_MODE=nbfc`) |
| `pnpm dev:all` | Both dev servers |
| `pnpm build` | Production build |

## Tech stack

React 19, Tailwind, Drizzle ORM, Supabase (Auth + DB), Gemini (`@ai-sdk/google` / `ai`), Zod, TanStack Query.
