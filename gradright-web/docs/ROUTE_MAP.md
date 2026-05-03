# GradRight Web — Route map

Legend: **Auth** = requires Supabase session (student app user). **NBFC** = requires `nbfc_supervisor` role.

## Pages

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | No | Landing / marketing |
| `/sign-in` | No (redirects if already signed in) | Student or partner login UI (portal-aware) |
| `/sign-up` | No (redirects if already signed in) | Registration; default `next` → `/onboarding` |
| `/onboarding` | Yes | Profile + GradScore onboarding |
| `/dashboard` | Yes | Hub overview |
| `/account` | Yes | Profile summary (“My account”) |
| `/career` | Yes | Placement, risk, EMI comfort |
| `/career/navigator` | Yes | AI career navigator |
| `/discover` | Yes | Discover module stub (links into Plan) |
| `/plan` | Yes | Plan hub (admission + timeline) |
| `/plan/admission` | Yes | Admission predictor |
| `/plan/timeline` | Yes | Application timeline |
| `/finance` | Yes | Finance hub (EMI, eligibility, literacy) |
| `/apply` | Yes | Loan application wizard |
| `/apply/application` | Yes | Legacy alias → redirects to `/apply` |
| `/apply/start` | Yes | Legacy alias → `/apply` |
| `/succeed` | Yes | Post-admit stub (links to Career) |
| `/nbfc/*` | NBFC | Partner console |
| `/nbfc/login` | No | Legacy → `/sign-in` |

## API (selected)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/sign-out` | Cookie session | Clears Supabase session, redirects to `/sign-in` |
| POST | `/api/auth/complete-partner-signup` | Service | Partner registration completion (gated by env) |
| * | `/api/ai/chat` | User | Gemini mentor chat |
| * | `/api/ai/digest` | Cron / secret | Weekly digest |
| POST | `/api/career/risk-score` | User | Career risk / salary payload → `lib/services/career/risk-score.service.ts` |
| POST | `/api/career/career-navigator` | User | Navigator structured output |
| POST | `/api/plan/admission` | User | Admission predictor → `lib/services/plan/admission.service.ts` |
| POST | `/api/plan/application-timeline` | User | Timeline generation |
| POST | `/api/finance/eligibility` | User | Eligibility estimate |
| * | `/api/apply/application` | User | Loan draft GET/PATCH/POST |
| POST | `/api/apply/application/submit` | User | Submit application |
| POST | `/api/apply/documents/upload` | User | Storage upload |
| POST | `/api/apply/ocr` | User | OCR extraction |
| POST | `/api/apply/document-checklist` | User | AI document checklist |
| * | `/api/user/*` | User | XP, streaks, onboarding, brief |
| * | `/api/nbfc/*` | NBFC | Partner APIs |

## Entry points

- **Student app**: `pnpm dev` (port 3000 by default).
- **NBFC app**: `pnpm dev:nbfc` (port 3001); `NEXT_PUBLIC_PORTAL_MODE=nbfc`.
- **Both**: `pnpm dev:all`.

## Middleware

- Protects `/dashboard`, `/onboarding`, `/plan`, `/career`, `/finance`, `/apply`, `/discover`, `/succeed`, `/account`.
- Maps legacy `/login` → `/sign-in`, `/signup` → `/sign-up`, `/financing` → `/finance`, `/loan` → `/apply`.
