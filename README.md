# GradRight

**GradRight** is an AI-first study-abroad and education-finance platform for Indian students: guided **onboarding**, **GradRight Score** (risk + placement outlook), a central **dashboard**, **Gemini** mentor chat, and **loan / NBFC** workflows. A separate **partner (NBFC) console** shares the Next.js codebase behind `NEXT_PUBLIC_PORTAL_MODE=nbfc`.

## Monorepo layout

| Path | Role |
|------|------|
| [`gradright-web/`](gradright-web/) | Next.js 16 — student journey + partner console |
| [`gradright-backend/`](gradright-backend/) | Python FastAPI |
| [`gradright-mobile/`](gradright-mobile/) | Expo scaffold |
| [`risk-service/`](risk-service/) | Optional Python scoring service (`RISK_ENGINE_URL`) |
| [`docs/`](docs/) | Architecture, flows, setup, dependency policy, refactor logs |
| [`tooling/`](tooling/) | Prompts, MCP docs, Cursor notes |
| [`scripts/`](scripts/) | `verify-environment.mjs`, **`verify-repo.mjs`** |
| [`pnpm-workspace.yaml`](pnpm-workspace.yaml) + [`package.json`](package.json) | **pnpm workspace** — only Node packages (`gradright-web`, `gradright-mobile`); **one root `pnpm-lock.yaml`** |

Python services are **not** in the pnpm workspace; use pip/uv per package README.

## Student flow (canonical URLs)

1. `/` — Landing  
2. `/sign-up` → `/onboarding` — First run  
3. `/dashboard` — Hub  
4. `/career` → `/discover` → `/plan` → `/finance` → `/apply` → `/succeed` — Modules  

**Alternate:** `/` → `/sign-in` → `/dashboard`. Legacy `/login`, `/signup`, `/financing`, `/loan` redirect in middleware.

## NBFC (partner) flow

- Run **`pnpm dev:web:all`** or **`pnpm --dir gradright-web dev:nbfc`** (see web `package.json`).
- Same `/sign-in` / `/sign-up` routes render **partner** forms when the NBFC portal is active.
- Console: `/nbfc/applications`, `/nbfc/portfolio`, `/nbfc/settings`.

Detail: [`docs/FULL_PRODUCT_FLOW.md`](docs/FULL_PRODUCT_FLOW.md).

## Setup (one truth)

**Always install from the repo root** (single lockfile policy):

```bash
pnpm install
cp gradright-web/.env.example gradright-web/.env.local   # then edit
pnpm dev:web
# or both student + NBFC dev servers:
pnpm dev:web:all
```

- **Prerequisites:** Node 20+, pnpm 9+, Python 3.11+ for backend — [`docs/implementation/PROJECT_SETUP.md`](docs/implementation/PROJECT_SETUP.md)  
- **Workspace / types / lockfile rules:** [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md), [`docs/DEVELOPER_SETUP.md`](docs/DEVELOPER_SETUP.md)

Do **not** rely on `gradright-web/pnpm-lock.yaml` (removed); use the **root** lockfile only.

## Verify & build

```bash
pnpm verify:repo     # structural + tsc + web architecture guards (use before PRs)
pnpm typecheck:web   # tsc only
pnpm build:web       # production Next build
pnpm lint:web
```

See [`docs/BUILD_AND_VERIFY.md`](docs/BUILD_AND_VERIFY.md). Optional: `node scripts/verify-environment.mjs` (Node/Python presence).

## Contributing

1. Branch from `main`  
2. Run **`pnpm verify:repo`**  
3. Never commit `.env`, `.env.local`, `node_modules`, `.next`, or Python `venv/`  

## Security & shipping

- [`docs/SECURITY_PRE_PUSH_CHECKLIST.md`](docs/SECURITY_PRE_PUSH_CHECKLIST.md)  
- Product / implementation specs under [`docs/product/`](docs/product/) and [`docs/implementation/`](docs/implementation/)

## License

Proprietary — All Rights Reserved (unless and until a license file is added).
