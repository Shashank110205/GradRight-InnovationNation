# Refactor log — GradRight Web architecture pass

## Goals

- Canonical URLs: `/sign-in`, `/sign-up`, `/finance`, `/apply`, module nav including **Career** and **Discover**.
- API routes grouped by product area (`career`, `plan`, `finance`, `apply`) with `ai` reserved for shared Gemini endpoints.
- Shared **AppUserMenu** (account + server-side sign-out).
- Typed **public env** via `lib/config/env.ts` + `instrumentation.ts`.
- **`lib/validation` → `lib/validations`**, **`lib/financing` → `lib/finance`**, **`lib/loan` → `lib/apply`**, matching **`components/finance`**, **`components/apply`**.

## Removed / replaced

| Removed | Replaced by |
|---------|-------------|
| `app/(auth)/login`, `app/(auth)/signup` | `app/(auth-shell)/sign-in`, `app/(auth-shell)/sign-up` |
| `app/(dashboard)/` route group | `app/(hub)/` (same URLs; group name only) |
| `app/providers.tsx` | `components/shared/AppProviders.tsx` (`useSupabase` export) |
| `app/api/loan/*` | `app/api/apply/*` and `app/api/finance/eligibility` |
| `app/api/ai/risk-score`, `career-navigator`, `admission`, `application-timeline`, `document-checklist` | `api/career/*`, `api/plan/*`, `api/apply/document-checklist` |

## Renamed folders (disk)

- `lib/validation` → `lib/validations`
- `lib/financing` → `lib/finance`
- `lib/loan` → `lib/apply`
- `components/financing` → `components/finance`
- `components/loan` → `components/apply`

## Import updates

- All `@/lib/validation/*` → `@/lib/validations/*`
- All `@/lib/financing/*`, `@/lib/loan/*` → `@/lib/finance/*`, `@/lib/apply/*`
- Client fetch URLs updated for apply/finance/plan/career APIs
- `WeeklyTasksTile` server action import: `@/app/(hub)/dashboard/actions`
- NBFC components: `useSupabase` from `@/components/shared/AppProviders`

## Middleware

- Public `/` on student host (no forced redirect to sign-in).
- Legacy path redirects and `STUDENT_AREA_PREFIXES` expanded (`/discover`, `/succeed`, `/account`, `/finance`, `/apply`).
- Authenticated `/sign-in` respects `?next=` when safe internal path.

## New files

- `components/auth/SignInForm.tsx`, `SignUpForm.tsx`
- `components/shared/AppUserMenu.tsx`
- `app/api/auth/sign-out/route.ts` (GET + POST)
- `app/(hub)/account`, `discover`, `succeed`, `plan/page.tsx`, `apply/*` (aliases)
- `lib/config/env.ts`, `instrumentation.ts`, `types/index.ts`
- This `docs/` set

## NBFC / dual host

- Partner links to student portal use `/sign-in` and `/sign-up`.
- `nbfc/login` and console layouts redirect to `/sign-in`.

## Phase 2 (structural tightening) — done

- **`components/plan/`** — Admission predictor UI (was `components/admission/`).
- **`lib/plan/`** — Predictor logic; **`lib/validations/plan.ts`** — Zod + response types (was `admission-predictor.ts`).
- **`lib/services/plan/admission.service.ts`**, **`lib/services/career/risk-score.service.ts`** — thin API routes call these.
- **`lib/dashboard/module-registry.ts`** — config-driven hub nav metadata + `DASHBOARD_NAV`.
- **`pnpm verify:architecture`** — `scripts/verify-architecture.mjs` (legacy path guard + `tsc --noEmit`).
- Removed dead **`src/api/client.ts`** (duplicate of `lib/api/client.ts`).

## Final canonicalization (student vs partner UI)

- **`components/student/**`** — all student journey UI (auth, onboarding, landing, dashboard, career, plan, finance, apply).
- **`components/partner/**`** — NBFC partner console + partner auth forms (renamed from `components/nbfc`).
- **`verify-architecture`** — fails if `components/auth` or `components/nbfc` reappear at top level.

## Follow-ups (optional)

- Extract more `app/api/**` handlers into `lib/services/*` using the same pattern.
- Consider `components/gamification/` if XP UI grows beyond dashboard tiles.
- Physical `apps/<package>` layout when dev servers are stopped (see `docs/ROOT_PURIFICATION_FINAL.md`).
