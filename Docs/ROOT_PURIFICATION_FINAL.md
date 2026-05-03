# Root purification — final notes

## Achieved

- **Single `docs/` tree** (lowercase) — former `Docs/` content merged via folder rename on Windows; all new engineering docs live here.
- **`tooling/`** — prompts (`tooling/prompts/`), MCP guide (`tooling/mcp/`), Cursor system (`tooling/cursor/`).
- **`scripts/`** — environment verification (`verify-environment.mjs`).
- **Workspace manifest** — root `pnpm-workspace.yaml` + `package.json` scripts delegate into packages.
- **Stray empty folders** removed from an aborted partial `apps/` experiment (`components/`, `context/`, `data/` at root).

## Deferred (environment)

- **Physical `apps/` directory** — moving `gradright-web` failed while `pnpm dev` held file locks. Recommendation: stop dev servers, then `git mv gradright-web apps/gradright-web` (and peers) and update CI/README in one PR.

## Ignored artifacts

- `node_modules/`, `.next/`, `.next-nbfc/`, `venv/`, `__pycache__/` — covered by [`.gitignore`](../.gitignore).
