# Route map — monorepo index

Authoritative tables for the **Next.js** application live in [`gradright-web/docs/ROUTE_MAP.md`](../gradright-web/docs/ROUTE_MAP.md).

## Quick reference (student app)

| Area | Base path | Notes |
|------|-----------|--------|
| Public | `/` | Landing |
| Auth | `/sign-in`, `/sign-up` | `app/(auth-shell)/` |
| Onboarding | `/onboarding` | Post signup |
| Hub | `/dashboard`, `/account`, `/career`, `/discover`, `/plan`, `/finance`, `/apply`, `/succeed` | `app/(hub)/` — sidebar from `lib/dashboard/module-registry.ts` |
| Partner | `/nbfc/*` | `NEXT_PUBLIC_PORTAL_MODE=nbfc` dev server |

## API surface (grouped)

| Prefix | Module |
|--------|--------|
| `/api/ai/*` | Shared Gemini (chat, digest) |
| `/api/career/*` | Risk score, navigator |
| `/api/plan/*` | Admission predictor, timeline |
| `/api/finance/*` | Eligibility |
| `/api/apply/*` | Loan application, OCR, documents |
| `/api/user/*` | Profile, XP, streaks, brief |
| `/api/auth/*` | Sign-out, partner signup completion |
| `/api/nbfc/*` | Partner JSON APIs |

Service-layer entry points (examples): `lib/services/plan/admission.service.ts`, `lib/services/career/risk-score.service.ts`.
