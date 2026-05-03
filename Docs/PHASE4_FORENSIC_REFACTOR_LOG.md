# Phase 4 — forensic refactor (log)

## Summary

Documented and executed **canonical vs duplicate** decisions for dashboard loading boundaries, admission/plan ownership, dead API client duplicate, and navigation config merge.

## Actions

| Action | Target |
|--------|--------|
| Documented | `docs/FORENSIC_DUPLICATE_AUDIT.md` |
| Kept loader split | `dashboard-shell-loader.tsx` remains (SSR/webpack boundary). |
| Merged nav config | `module-registry.ts` only; removed `module-routes.ts`. |
| Relocated predictor | `components/plan`, `lib/plan`, validations `plan.ts`. |
| Deleted | `src/api/client.ts`, empty `src/`, `lib/admission`, `components/admission`. |

## Naming

- No renames of `dashboard-shell.tsx` → `DashboardShell.tsx` (Windows + git default case sensitivity); behavior-first names retained to avoid churn.

## Route truth

- `/plan/admission` continues to render `AdmissionPredictorClient` from **`components/plan`**.
- `POST /api/plan/admission` unchanged URL; implementation delegates to **service**.
