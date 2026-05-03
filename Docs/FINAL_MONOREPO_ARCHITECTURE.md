# Final monorepo architecture — GradRight

## Workspace decision — **Option A (canonical root)**

The **root** `pnpm install` and **root** `pnpm-lock.yaml` are the **single source of truth** for Node dependencies. Contributors should not rely on per-package lockfiles under `gradright-web/`. See [`DEPENDENCY_POLICY.md`](DEPENDENCY_POLICY.md) and [`DEVELOPER_SETUP.md`](DEVELOPER_SETUP.md).

## Packages (pnpm workspace)

Declared in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml):

| Package | Path | Role |
|---------|------|------|
| **gradright-web** | `gradright-web/` | Next.js 16 — student hub + NBFC partner console (dual `NEXT_PUBLIC_PORTAL_MODE`). |
| **gradright-backend** | `gradright-backend/` | FastAPI services (Python; **not** in the pnpm workspace). |
| **gradright-mobile** | `gradright-mobile/` | Expo client scaffold (**pnpm** workspace member). |
| **risk-service** | `risk-service/` | Optional Python rule engine (**not** in the pnpm workspace); web uses `RISK_ENGINE_URL`. |

Root [`package.json`](../package.json) exposes convenience scripts (`dev:web`, `verify:web`, …). [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) lists only packages that ship a `package.json`.

## Cross-cutting directories

| Path | Role |
|------|------|
| `docs/` | Human-facing architecture, flows, domain maps, refactor logs. |
| `tooling/` | Prompts, MCP documentation, Cursor system notes (not shipped runtime). |
| `scripts/` | Repo-level checks (`verify-environment.mjs`). |

## Target state (physical `apps/` layout)

Moving packages under `apps/*` is **recommended** once no dev process locks `gradright-web` (Windows file locks blocked a bulk move). Until then, workspace paths remain top-level for clarity and CI compatibility.

## Invariants

1. **No application source at repo root** — only manifests, docs, tooling, scripts.
2. **One documentation tree** — `docs/` (lowercase), not mixed `Docs/` / `docs/`.
3. **Web UI split** — `gradright-web/components/student/*` vs `gradright-web/components/partner/*` vs `components/ui` + `components/shell` + `components/shared`.
