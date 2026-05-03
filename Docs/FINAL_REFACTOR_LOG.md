# Final refactor log — structural canonicalization

## 2026 — “Final master” pass

### Monorepo

- Added [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) and root [`package.json`](../package.json) with `dev:web`, `verify:web`, etc.
- Documented optional future `apps/` physical layout in [`FINAL_MONOREPO_ARCHITECTURE.md`](FINAL_MONOREPO_ARCHITECTURE.md).

### Documentation

- Canonical folder: **`docs/`** (renamed from mixed `Docs/` casing on disk).
- New engineering assets: [`FULL_PRODUCT_FLOW.md`](FULL_PRODUCT_FLOW.md), [`STUDENT_DOMAIN_MAP.md`](STUDENT_DOMAIN_MAP.md), [`NBFC_DOMAIN_MAP.md`](NBFC_DOMAIN_MAP.md), [`UI_SYSTEM_ARCHITECTURE.md`](UI_SYSTEM_ARCHITECTURE.md), [`AUTH_ONBOARDING_FORENSIC.md`](AUTH_ONBOARDING_FORENSIC.md), [`ROOT_PURIFICATION_FINAL.md`](ROOT_PURIFICATION_FINAL.md), this file.

### gradright-web — UI domain split

- Moved **`components/auth` → `components/student/auth`**
- **`onboarding`, `landing`, `dashboard`, `career`, `plan`, `finance`, `apply` → `components/student/...`**
- Renamed **`components/nbfc` → `components/partner`**
- Updated all `@/components/*` imports; NBFC detail page intentionally imports `student/career` widgets for read-only charts.
- Extended [`scripts/verify-architecture.mjs`](../gradright-web/scripts/verify-architecture.mjs) to fail if legacy `components/auth` or `components/nbfc` reappear.

### MCP

- [`.cursor/mcp.json`](../.cursor/mcp.json): added **sequential-thinking**, removed **desktop-commander** clutter.

### Hygiene

- Restored packages to repo root after partial `apps/` move failure (backend/mobile/risk only had moved).

## Verification

```bash
pnpm verify:repo          # repo root — recommended before PR
pnpm verify:web           # web-only architecture + tsc
node scripts/verify-environment.mjs
```

## 2026 — Post-workspace quality pass (finalization)

- **Single lockfile:** removed `gradright-web/pnpm-lock.yaml` and `gradright-web/pnpm-workspace.yaml`; root `pnpm-lock.yaml` + `pnpm.overrides` align `@types/react` / `@types/react-dom` to **^19.2.0** (eliminates peer mismatch).
- **`gradright-web`:** pinned `@types/react` / `@types/react-dom` to `^19.2.0`; **`gradright-mobile`:** `@types/react` `~19.2.0`.
- **Root scripts:** `typecheck:web`, `verify:repo` → [`scripts/verify-repo.mjs`](../scripts/verify-repo.mjs).
- **Docs:** [`DEVELOPER_SETUP.md`](DEVELOPER_SETUP.md), [`BUILD_AND_VERIFY.md`](BUILD_AND_VERIFY.md), [`DEPENDENCY_POLICY.md`](DEPENDENCY_POLICY.md); updated [`FINAL_MONOREPO_ARCHITECTURE.md`](FINAL_MONOREPO_ARCHITECTURE.md).
- **CI:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs `pnpm verify:repo` on push/PR.
