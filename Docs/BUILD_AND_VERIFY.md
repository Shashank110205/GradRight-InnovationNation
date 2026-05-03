# Build and verify

## Production build (web)

```bash
pnpm build:web
```

Runs `next build` inside `gradright-web` (webpack mode per package script).

## Lint (web)

```bash
pnpm lint:web
```

## Full repo confidence gate

```bash
pnpm verify:repo
```

This runs (in order):

1. Asserts **root** `pnpm-lock.yaml` exists and **`gradright-web/pnpm-lock.yaml`** does not.
2. Asserts required **`docs/`** deliverables exist.
3. Asserts **no legacy** folders (`components/auth`, `components/nbfc`, `lib/admission`, …).
4. Asserts **student hub** segment routes exist under `app/(hub)/`.
5. Asserts **canonical** `onboarding`, `sign-in`, `sign-up` pages exist.
6. Asserts **`gradright-web`** declares `@types/react` / `@types/react-dom` **19.2.x**.
7. Runs **`node scripts/verify-architecture.mjs`** in `gradright-web` (includes `tsc --noEmit` plus API / legacy-path guards).

## CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `pnpm install` + `pnpm verify:repo` on push/PR.

## Environment smoke test

```bash
node scripts/verify-environment.mjs
```

Checks Node/Python presence (see script header).
