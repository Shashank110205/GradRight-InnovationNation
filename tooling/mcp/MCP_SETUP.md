# MCP setup — GradRight

Cursor reads MCP server definitions from **`.cursor/mcp.json`** at the repository root. This file documents **purpose**, **cost**, and **when to use** each server mirrored there.

## Servers (typical free tier)

| Server | Purpose | Cost | Notes |
|--------|---------|------|--------|
| **filesystem** | Read/write workspace files from the agent | Free (`npx` pulls official package) | Scoped to the path passed in args (`.` = repo root). |
| **memory** | Cross-session knowledge graph / notes | Free | Useful for long-running investigations; avoid secrets. |
| **puppeteer** | Headless Chrome for screenshots / scraping | Free | Heavy cold start on first `npx` download. |
| **sqlite** | Query a local SQLite DB | Free | Update the `.sqlite` path in args for your machine. |
| **git** | Repo history, blame, diffs via MCP | Free | Pass `--repository` pointing at this monorepo. |
| **fetch** | HTTP GET for public URLs | Free | Respect robots/terms; no auth tokens in prompts. |
| **sequential-thinking** | Structured step-by-step reasoning graph for agents | Free | Official `@modelcontextprotocol/server-sequential-thinking`. |
| **github** | Issues, PRs, search | Free API with **PAT** | Replace placeholder PAT; never commit a real token. |

## Removed / avoided

- **desktop-commander** — removed from the default template to reduce third-party surface area; add back only if your team explicitly needs desktop automation.

## Maintenance

- Remove servers you do not use to shorten agent startup.
- Prefer **Supabase MCP** (if installed separately) for database work alongside Drizzle in `gradright-web`.

## Security

- **Never** commit live PATs, service role keys, or Supabase secrets into `mcp.json`.
- Use environment variable indirection where Cursor supports it for your team.
