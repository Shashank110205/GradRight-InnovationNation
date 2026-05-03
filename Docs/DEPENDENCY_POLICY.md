# Dependency policy — GradRight

## Single lockfile (Option A — canonical root workspace)

- **One** [`pnpm-lock.yaml`](../pnpm-lock.yaml) at the **repository root**.
- Workspace members: [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) (`gradright-web`, `gradright-mobile`).
- **Python** trees (`gradright-backend`, `risk-service`) use **pip** / **uv** — they are **not** pnpm workspace packages.

## React typings (peer discipline)

- **`gradright-web`** uses **React 19.2.x** runtime; **`@types/react`** and **`@types/react-dom`** are pinned to **`^19.2.0`** in [`gradright-web/package.json`](../gradright-web/package.json).
- The root [`package.json`](../package.json) declares **`pnpm.overrides`** for `@types/react` and `@types/react-dom` so hoisted installs stay aligned across workspace packages and **peer warnings are eliminated**.

## Mobile (`gradright-mobile`)

- Ships its own `react` / `react-native` versions required by Expo; **`@types/react`** tracks **`~19.2.0`** to stay compatible with the monorepo override policy.

## Adding dependencies

- **Web:** `pnpm --dir gradright-web add <pkg>` (from repo root), then commit the **root** lockfile change.
- **Mobile:** `pnpm --dir gradright-mobile add <pkg>` similarly.

## Forbidden

- Per-package `pnpm-lock.yaml` under `gradright-web/` (removed — causes ambiguous installs).
- Committing **secrets**, **`.env.local`**, **`node_modules/`**, **`.next/`**, Python **`venv/`**.
