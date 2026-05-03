# GradRight Web — Project structure

## Overview

`gradright-web` is a Next.js 16 (App Router) application for the student journey: landing, authentication, onboarding, a central dashboard hub, and six product modules. The NBFC “Insights” partner console is a **separate dev server** (`NEXT_PUBLIC_PORTAL_MODE=nbfc`) sharing much of the codebase.

## User flow (canonical)

1. **`/`** — Public landing (marketing, CTAs).
2. **`/sign-in`** / **`/sign-up`** — Supabase email/password auth (`components/student/auth`; partner portal uses `components/partner/*` on the same routes).
3. **`/onboarding`** — First-run profile and GradScore (`components/student/onboarding`).
4. **`/dashboard`** — Overview hub only; sidebar links into modules.
5. **Modules** — `/career`, `/discover`, `/plan`, `/finance`, `/apply`, `/succeed` (all under route group `app/(hub)/`, URL paths unchanged).

Legacy URLs (`/login`, `/signup`, `/financing`, `/loan`) redirect in `middleware.ts`.

## Top-level layout

| Path | Role |
|------|------|
| `app/page.tsx` | Landing |
| `app/(auth-shell)/` | Shared auth chrome; `sign-in`, `sign-up` |
| `app/(hub)/` | Authenticated student shell (sidebar + header); **not** visible in URL |
| `app/onboarding/` | Onboarding flow |
| `app/nbfc/` | Partner console (separate portal mode) |
| `app/api/` | Route handlers (see `ROUTE_MAP.md`) |

## `app/api/` — Module ownership

| Folder | Responsibility |
|--------|----------------|
| `api/ai/` | Cross-cutting Gemini chat + digest |
| `api/career/` | Risk score, career navigator |
| `api/plan/` | Admission predictor, application timeline |
| `api/finance/` | Loan eligibility estimates |
| `api/apply/` | Loan application CRUD, documents, OCR, AI checklist |
| `api/user/` | Onboarding persistence, XP, streaks, dashboard brief |
| `api/auth/` | Partner signup completion, **sign-out** (session cleared server-side) |
| `api/nbfc/` | Partner API surface |

## `components/`

| Folder | Responsibility |
|--------|----------------|
| `student/` | **Student product UI** — `auth`, `onboarding`, `landing`, `dashboard`, `career`, `plan`, `finance`, `apply` |
| `partner/` | **NBFC partner UI** — console shell, applications, portfolio, partner login/signup |
| `shared/` | Cross-cutting shell (`AppProviders`, `AppUserMenu`, `ChatbotToggle`, …) — no domain business rules |
| `shell/` | Visual primitives (`GlassCard`, `ScoreRing`, …) |
| `ui/` | shadcn-style primitives |

## `lib/`

| Folder | Responsibility |
|--------|----------------|
| `config/` | Typed env (`getPublicEnv`, `validateServerEnv`) |
| `db/` | Drizzle schema, queries, Supabase server helpers |
| `ai/` | Prompts, Gemini helpers, digest, risk copy |
| `auth/` | `safeNextPath` and related |
| `dashboard/` | Nav config, auth context for hub, weekly tasks |
| `finance/`, `apply/` | Eligibility engine, OCR merge helpers |
| `career/`, `plan/`, `onboarding/`, `nbfc/`, `gamification/` | Domain logic |
| `services/` | **Service layer** — business logic invoked from thin `app/api/**/route.ts` handlers |
| `validations/` | Zod schemas (`plan.ts`, `risk-score-input.ts`, …) shared by routes and clients |

## `hooks/`, `types/`, `scripts/`

- **`hooks/`** — Client hooks (e.g. `useAwardXP`).
- **`types/`** — Re-exports `@/lib/types` plus module contracts (e.g. `types/plan.ts`).
- **`scripts/`** — Dev port helpers, diagnostics, `verify-architecture.mjs` (`pnpm verify:architecture`).

## Environment

- **`.env.example`** — Full key list (no secrets). Copy to `.env.local` for development.
- **`lib/config/env.ts`** — Validates required `NEXT_PUBLIC_*` Supabase keys at startup (`instrumentation.ts`).

## Conventions

- **Routes**: kebab-case paths (`/sign-in`, `/plan/timeline`).
- **React components**: PascalCase filenames where applicable.
- **Imports**: `@/*` from repo root; `@/types` for shared types.
