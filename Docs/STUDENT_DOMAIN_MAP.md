# Student domain map

All paths are under **`gradright-web`** unless noted.

## Routes (App Router)

| Area | Route prefix | Route group |
|------|----------------|---------------|
| Public | `/` | `app/page.tsx` |
| Auth | `/sign-in`, `/sign-up` | `app/(auth-shell)/` |
| Onboarding | `/onboarding` | `app/onboarding/` |
| Authenticated hub | `/dashboard`, `/account`, `/career`, `/discover`, `/plan`, `/finance`, `/apply`, `/succeed` | `app/(hub)/` |

## UI ownership

| Concern | Folder |
|---------|--------|
| Landing & marketing | `components/student/landing/` |
| Email/password forms (student) | `components/student/auth/` |
| Onboarding wizard | `components/student/onboarding/` |
| Dashboard shell & tiles | `components/student/dashboard/` |
| Career module | `components/student/career/` |
| Plan + admission predictor | `components/student/plan/` |
| Finance hub | `components/student/finance/` |
| Loan apply wizard | `components/student/apply/` |

## Server & data

| Concern | Location |
|---------|----------|
| Student APIs | `app/api/career`, `plan`, `finance`, `apply`, `user`, `ai` |
| Service layer (examples) | `lib/services/plan`, `lib/services/career` |
| Validations | `lib/validations/*` |
| Hub nav config | `lib/dashboard/module-registry.ts` |

## Boundaries

- **No** NBFC console components under `components/student/`.
- Partner-only forms live under `components/partner/` but are **only mounted on auth routes when `isNbfcPortalInstance()`** is true.
