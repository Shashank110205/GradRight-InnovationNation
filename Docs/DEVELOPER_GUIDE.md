# Developer guide — GradRight web

> **Monorepo / install policy:** start at [`DEVELOPER_SETUP.md`](DEVELOPER_SETUP.md) (root `pnpm install`, single lockfile).

Primary workspace: **`gradright-web/`**. Use **Node 20+** and **pnpm**.

## Add a new hub module (student app)

1. **Route**: Add `app/(hub)/<module>/page.tsx` (and optional nested routes).
2. **UI**: Add `components/student/<module>/` with PascalCase files (student journey only).
3. **Nav**: Extend `HUB_STUDENT_NAV` in [`gradright-web/lib/dashboard/module-registry.ts`](../gradright-web/lib/dashboard/module-registry.ts) (title, `href`, `icon`, `journeyStage` if applicable).
4. **Middleware**: If the path must be session-gated, add the prefix to `STUDENT_AREA_PREFIXES` in [`gradright-web/middleware.ts`](../gradright-web/middleware.ts).

## Add an API route

1. Create `app/api/<area>/<name>/route.ts`.
2. **Thin controller only**: parse JSON → Zod `safeParse` → `createServerClient` + `getUser` → call **`lib/services/...`** → `NextResponse.json(apiSuccess|apiError)`.
3. Put Zod schemas in **`lib/validations/`** (per module file, e.g. `plan.ts`).
4. Put shared response shapes next to Zod types or in `lib/types` when cross-cutting.

## Naming

- Folders: **kebab-case** (`plan`, `auth-shell`).
- React files: **PascalCase** for components.
- Utilities: **camelCase** files exporting `camelCase` functions.
- Services: `*.service.ts` under `lib/services/<module>/`.

## Verification

```bash
cd gradright-web
pnpm verify:architecture
```

Runs TypeScript `--noEmit` and guards against reintroduced legacy paths (`lib/admission`, `components/admission`, `components/auth`, `components/nbfc`, …).

## Environment

Copy [`gradright-web/.env.example`](../gradright-web/.env.example) to `.env.local`. Required public keys are validated at server startup via [`gradright-web/lib/config/env.ts`](../gradright-web/lib/config/env.ts) and [`gradright-web/instrumentation.ts`](../gradright-web/instrumentation.ts).
