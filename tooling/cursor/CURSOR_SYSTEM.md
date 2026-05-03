# Cursor system — GradRight

## Configuration map

| Concern | Location |
|---------|----------|
| MCP servers | [`.cursor/mcp.json`](../../.cursor/mcp.json) (repo root; may be gitignored locally — recreate from [`tooling/mcp/MCP_SETUP.md`](../mcp/MCP_SETUP.md)). |
| Cursor rules / skills | User-level or `.cursor/rules` (optional). |
| Next.js agent hints | [`gradright-web/AGENTS.md`](../../gradright-web/AGENTS.md), [`gradright-web/CLAUDE.md`](../../gradright-web/CLAUDE.md). |

## Engineering rules (for agents)

1. **Imports:** use `@/` from `gradright-web` root; avoid deep relatives in new code.
2. **UI domains:** student product under `components/student/*`; partner under `components/partner/*`; primitives under `components/ui` + `components/shell`; shell helpers under `components/shared`.
3. **API routes:** thin controllers — validate → auth → `lib/services/*` → JSON response.
4. **Verification:** run `pnpm verify:architecture` inside `gradright-web` before large merges.
5. **Never reintroduce** removed legacy trees: `lib/admission`, `components/admission`, top-level `components/auth`, `components/nbfc`.

## Product context

- Canonical flows: [`docs/FULL_PRODUCT_FLOW.md`](../../docs/FULL_PRODUCT_FLOW.md).
- Domain maps: [`docs/STUDENT_DOMAIN_MAP.md`](../../docs/STUDENT_DOMAIN_MAP.md), [`docs/NBFC_DOMAIN_MAP.md`](../../docs/NBFC_DOMAIN_MAP.md).

## Legacy note

Earlier `CURSOR_RULES.md` content is superseded by this file.
