# Developer setup — GradRight

## Monorepo policy (canonical)

**Install once at the repository root.** A single [`pnpm-lock.yaml`](../pnpm-lock.yaml) resolves `gradright-web` and `gradright-mobile`. Do **not** commit or regenerate `gradright-web/pnpm-lock.yaml`.

```bash
git clone <repo>
cd GradRight
pnpm install
```

Requires **Node.js 20+** and **pnpm 9+** (see root [`package.json`](../package.json) `packageManager` field).

## Environment files

| Package | Template | Local file |
|---------|-----------|------------|
| Web | [`gradright-web/.env.example`](../gradright-web/.env.example) | `gradright-web/.env.local` |
| Backend | [`gradright-backend/.env.example`](../gradright-backend/.env.example) | `gradright-backend/.env` |
| Mobile | (Expo) | per [`gradright-mobile/README.md`](../gradright-mobile/README.md) |

## Daily commands

| Goal | Command |
|------|---------|
| Student + NBFC dev (two ports) | `pnpm dev:web:all` |
| Web only | `pnpm dev:web` |
| Typecheck web | `pnpm typecheck:web` |
| Repo verification | `pnpm verify:repo` |
| Web-only architecture guard | `pnpm verify:web` |

## Deeper references

- Environment variables & tooling versions: [`docs/implementation/PROJECT_SETUP.md`](implementation/PROJECT_SETUP.md)
- Web app folder map: [`gradright-web/docs/PROJECT_STRUCTURE.md`](../gradright-web/docs/PROJECT_STRUCTURE.md)
- Product flows: [`FULL_PRODUCT_FLOW.md`](FULL_PRODUCT_FLOW.md)
