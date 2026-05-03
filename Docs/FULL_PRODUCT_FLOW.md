# Full product flow — canonical

## Student journey (happy path)

| Step | Route | Implementation |
|------|-------|----------------|
| 1 | `/` | Public landing — [`gradright-web/app/page.tsx`](../gradright-web/app/page.tsx), [`components/student/landing`](../gradright-web/components/student/landing). |
| 2 | `/sign-up` | [`app/(auth-shell)/sign-up`](../gradright-web/app/(auth-shell)/sign-up/page.tsx) → `SignUpForm` when student portal. |
| 3 | `/onboarding` | [`app/onboarding`](../gradright-web/app/onboarding/page.tsx) → `OnboardingShell` (GradRight Score). |
| 4 | `/dashboard` | Hub — [`app/(hub)/dashboard`](../gradright-web/app/(hub)/dashboard/page.tsx). |
| 5 | `/career` | Placement & risk — [`app/(hub)/career`](../gradright-web/app/(hub)/career/page.tsx). |
| 6 | `/discover` | Program discovery scaffold — links into Plan. |
| 7 | `/plan` | Plan hub + `/plan/admission`, `/plan/timeline`. |
| 8 | `/finance` | EMI & eligibility hub. |
| 9 | `/apply` | Loan application wizard. |
| 10 | `/succeed` | Post-admit hub — links into Career. |

**Alternate entry:** `/` → `/sign-in` → `/dashboard` (middleware enforces session on hub routes).

**Legacy redirects:** `/login` → `/sign-in`, `/signup` → `/sign-up`, `/financing` → `/finance`, `/loan` → `/apply` ([`middleware.ts`](../gradright-web/middleware.ts)).

## NBFC (partner) journey

| Step | Route / host | Notes |
|------|----------------|-------|
| Entry | `NEXT_PUBLIC_PORTAL_MODE=nbfc` dev server (port 3001 per `package.json`) | Same codebase, isolated UI. |
| Sign-in | `/sign-in` renders **only** `PartnerLoginForm` ([`sign-in/page.tsx`](../gradright-web/app/(auth-shell)/sign-in/page.tsx)). |
| Console | `/nbfc/applications`, `/nbfc/portfolio`, `/nbfc/settings` | [`app/nbfc/(console)/`](../gradright-web/app/nbfc/(console)/). |
| Legacy | `/nbfc/login` | Redirects to `/sign-in`. |

## Non-goals

- Partner self-signup UI may appear on `/sign-up` when portal mode is NBFC — still a **single route**, not a second student onboarding.

## Automated verification

Run from repo root after [`pnpm install`](../README.md):

```bash
pnpm verify:repo
```

This asserts hub pages exist, canonical auth/onboarding routes, no legacy component trees, aligned React typings, and passes **`gradright-web`** TypeScript + architecture checks (see [`BUILD_AND_VERIFY.md`](BUILD_AND_VERIFY.md)).
