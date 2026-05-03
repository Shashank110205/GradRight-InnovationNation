# Architecture principles

## Why this structure exists

- **Reviewability**: A senior engineer should infer boundaries from folder names (`plan`, `apply`, `nbfc`), not from tribal knowledge.
- **Dual portal**: Student and NBFC UIs share code but differ by `NEXT_PUBLIC_PORTAL_MODE`; isolation reduces accidental coupling.
- **Evolvability**: Thin HTTP handlers + **`lib/services`** make it safe to change persistence or AI providers without rewriting routes.

## Anti-chaos rules

1. **No orphan “misc” folders** at the web package root — use `lib/`, `components/`, or `tooling/` (repo root).
2. **Plan owns admission** — predictor UI and logic live under `components/plan`, `lib/plan`, `lib/validations/plan.ts`, not a parallel `admission` product tree.
3. **One auth UX** for students: `/sign-in`, `/sign-up` under `(auth-shell)`; legacy paths redirect in middleware.
4. **Sign-out is server-first**: `/api/auth/sign-out` clears the Supabase session before redirect (see `AppUserMenu`).
5. **Imports**: Prefer `@/` absolute paths from `gradright-web` root; avoid deep `../../../` chains in new code.

## Module isolation

- **Career** must not import NBFC-only server modules.
- **Apply** (loans) uses `lib/apply` and `components/apply`, not a legacy `loan` name in new code.
- **Shared** (`components/shared`) is for cross-cutting shell pieces (providers, user menu, chat toggle), not domain cards that belong in one module.

## Refactor rules

- When moving files, **update imports and delete the old path** in the same change set.
- When splitting a route, **extract a service** rather than growing the route file.
- Document non-obvious moves in `docs/PHASE*_REFACTOR_LOG.md`.
