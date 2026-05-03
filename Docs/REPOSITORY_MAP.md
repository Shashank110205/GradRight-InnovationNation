# Repository map — GradRight monorepo

This document is the **orientation layer** for the whole repository. For the Next.js app’s internal folders, see [`gradright-web/docs/PROJECT_STRUCTURE.md`](../gradright-web/docs/PROJECT_STRUCTURE.md). **Canonical monorepo documentation** lives in this **`docs/`** tree (lowercase folder name).

## Top-level folders

| Path | Purpose |
|------|---------|
| [`gradright-web/`](../gradright-web/) | Primary product: student + NBFC portals (Next.js 16, App Router). |
| [`gradright-backend/`](../gradright-backend/) | Python FastAPI services (risk engine, auth helpers, etc.). |
| [`gradright-mobile/`](../gradright-mobile/) | Expo / React Native client scaffold. |
| [`risk-service/`](../risk-service/) | Standalone scoring service (Python) used when `RISK_ENGINE_URL` points at it. |
| **`docs/`** (this folder) | Architecture, implementation guides, product specs, refactor logs, push checklist, masterplan. |
| [`tooling/`](../tooling/) | Prompts, MCP documentation, Cursor guidance (not runtime code). |
| [`scripts/`](../scripts/) | Repo-level scripts: `verify-environment.mjs`, **`verify-repo.mjs`** (`pnpm verify:repo`). |
| [`.github/`](../.github/) | CI and GitHub templates (if present). |
| [`.cursor/`](../.cursor/) | Cursor IDE project config (MCP, rules). **Do not commit secrets.** |

## Root files

| File | Role |
|------|------|
| [`README.md`](../README.md) | Quick start, prerequisites, links into `docs/`. |
| [`gradright-web/vercel.json`](../gradright-web/vercel.json) | Deployment / cron for the web app. |

## Data

Controlled datasets and static reference data should live next to the consumer (e.g. under `gradright-web/lib/.../data/` or a future `gradright-web/data/` tree). Avoid dumping unversioned JSON at repository root.

## Authored in Phase 2–4

- [`docs/PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) — monorepo folder philosophy.
- [`docs/ROUTE_MAP.md`](ROUTE_MAP.md) — high-level route index (details in web `docs/ROUTE_MAP.md`).
- [`docs/DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) — how to extend modules safely.
- [`docs/ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md) — non-negotiable structure rules.
- [`docs/FORENSIC_DUPLICATE_AUDIT.md`](FORENSIC_DUPLICATE_AUDIT.md) — resolved duplicate implementations.
- [`tooling/mcp/MCP_SETUP.md`](../tooling/mcp/MCP_SETUP.md) — MCP server purposes and cost notes.
- [`tooling/cursor/CURSOR_SYSTEM.md`](../tooling/cursor/CURSOR_SYSTEM.md) — Cursor + agent conventions.
