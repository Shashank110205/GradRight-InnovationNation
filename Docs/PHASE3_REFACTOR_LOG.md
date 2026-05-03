# Phase 3 — repository sanitization (log)

## Summary

Reduced **root markdown clutter** by moving specs and architecture files into **`docs/`** (subfolders `architecture/`, `implementation/`, `product/`) and prompts into **`tooling/prompts/`**. README now points at the new locations.

## Moves

| From (repo root) | To |
|------------------|-----|
| `ARCHITECTURE.md` | `docs/architecture/ARCHITECTURE.md` |
| `BUILD_ORDER.md`, `PROJECT_SETUP.md`, `PYTHON_SETUP.md`, `PYTHON_BUILD_ORDER.md` | `docs/implementation/` |
| `FEATURE_SPECS.md`, `DATA_MODELS.md` | `docs/product/` |
| `AI_PROMPTS.md`, `GRADRIGHT_CURSOR_PROMPTS_V2.md` | `tooling/prompts/` |

## Created

- `docs/architecture/`, `docs/implementation/`, `docs/product/`, `docs/audits/` (placeholder for future audits).
- `tooling/mcp/`, `tooling/cursor/` with human-readable guides.
- `docs/REPOSITORY_MAP.md`.

## Intentionally unchanged

- **`.cursor/mcp.json`** remains the IDE entrypoint (Cursor reads project MCP from `.cursor/`). Canonical documentation: `tooling/mcp/MCP_SETUP.md`.
- All monorepo engineering docs live under **`docs/`** alongside legacy product/ops files; prefer subfolders (`architecture/`, `implementation/`) over dumping new files at `docs/` root.

## Auth / onboarding

- Confirmed **single** student onboarding at `app/onboarding/` and auth at `app/(auth-shell)/`; no duplicate route groups merged in this pass beyond documentation.
