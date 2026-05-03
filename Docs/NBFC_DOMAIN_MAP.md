# NBFC (partner) domain map

## Runtime separation

- **Environment:** `NEXT_PUBLIC_PORTAL_MODE=nbfc` (see [`gradright-web/package.json`](../gradright-web/package.json) `dev:nbfc`).
- **Middleware:** Blocks student hub paths on NBFC host; routes supervisors to `/nbfc/applications` ([`middleware.ts`](../gradright-web/middleware.ts)).

## Routes

| Route | Purpose |
|-------|---------|
| `/sign-in` | Partner login only (`PartnerLoginForm`). |
| `/sign-up` | Partner signup when enabled (`PartnerSignupForm`). |
| `/nbfc/applications` | Queue |
| `/nbfc/applications/[id]` | Detail + decision |
| `/nbfc/portfolio` | Cohort view |
| `/nbfc/settings` | Ops / compliance copy |

## UI ownership

| Folder | Role |
|--------|------|
| `components/partner/` | Nbfc shell, tables, decision UI, partner auth forms. |

## APIs

| Prefix | Role |
|--------|------|
| `/api/nbfc/*` | Partner JSON surface ([`app/api/nbfc`](../gradright-web/app/api/nbfc)). |

## Shared read-only widgets

- Application detail may import **student career visualization** components (`components/student/career/*`) to show modeled risk for an applicant. That is a **read-only presentation dependency**, not mixed business ownership of the partner console.
