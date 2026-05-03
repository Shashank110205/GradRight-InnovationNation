# Phase 2 — structural tightening (log)

## Summary

Hardened **module boundaries** for Plan/admission, introduced a **service layer** for high-traffic APIs, centralized **hub navigation metadata**, added **`pnpm verify:architecture`**, and aligned **Zod plan validations** under `lib/validations/plan.ts`.

## Code changes

| Item | Detail |
|------|--------|
| Plan purity | `components/plan/AdmissionPredictorClient.tsx`, `lib/plan/admission-predictor-logic.ts`, removed `components/admission`, `lib/admission`. |
| Validations | `lib/validations/plan.ts` replaces `admission-predictor.ts`; `types/plan.ts` re-exports for `@/types`. |
| Services | `lib/services/plan/admission.service.ts`, `lib/services/career/risk-score.service.ts`; routes thin wrappers. |
| Nav registry | `lib/dashboard/module-registry.ts`; dashboard imports updated. |
| Dead code | Removed unused `src/api/client.ts` and empty `src/`. |
| CI helper | `gradright-web/scripts/verify-architecture.mjs` + `package.json` script. |
| Env example | Dropped stale CRA `src/api` comment line; optional `REACT_APP_API_URL` noted as legacy-only. |

## Docs

- Updated `gradright-web/docs/PROJECT_STRUCTURE.md`, `ROUTE_MAP.md`, `REFACTOR_LOG.md`.
- Added root `docs/DEVELOPER_GUIDE.md`, `docs/ARCHITECTURE_PRINCIPLES.md`, `docs/PROJECT_STRUCTURE.md`, `docs/ROUTE_MAP.md`, `docs/REPOSITORY_MAP.md`, this file.

## Follow-up

- Migrate additional `app/api/**/route.ts` files into `lib/services/*` using the same pattern.
