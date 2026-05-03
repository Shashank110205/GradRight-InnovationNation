# Project structure — monorepo root

## Philosophy

- **Apps stay in named packages** (`gradright-web`, `gradright-backend`, `gradright-mobile`). No application source at repository root.
- **Documentation is centralized** under `docs/` by category: `architecture/`, `implementation/`, `product/`, `audits/`.
- **Tooling and prompts** live under `tooling/` so reviewers see a clean root.
- **Cursor / MCP** configuration remains under `.cursor/` for IDE discovery; human-readable explanations live in `tooling/mcp/` and `tooling/cursor/`.

## Folder tree (conceptual)

```text
GradRight/
├── gradright-web/          # Next.js student + NBFC app
├── gradright-backend/    # FastAPI
├── gradright-mobile/     # Expo
├── risk-service/         # Optional Python risk engine
├── docs/                 # Product + engineering docs
│   ├── architecture/
│   ├── implementation/
│   ├── product/
│   └── audits/
├── tooling/
│   ├── prompts/
│   ├── mcp/
│   └── cursor/
├── scripts/              # Repo-level automation
├── README.md
└── .cursor/              # IDE — keep secrets out of git
```

## Ownership rules

| Concern | Owner package |
|--------|----------------|
| HTTP routes, SSR, UI | `gradright-web` |
| Relational schema + Drizzle | `gradright-web/lib/db` |
| Student journey modules | `gradright-web/app/(hub)/`, matching `components/{career,plan,finance,apply}` |
| Partner console | `gradright-web/app/nbfc/`, `components/nbfc/` |
| Long-running Python APIs | `gradright-backend` / `risk-service` |

## Deeper detail

- **Web app internals**: [`gradright-web/docs/PROJECT_STRUCTURE.md`](../gradright-web/docs/PROJECT_STRUCTURE.md)
- **API listing**: [`gradright-web/docs/ROUTE_MAP.md`](../gradright-web/docs/ROUTE_MAP.md)
