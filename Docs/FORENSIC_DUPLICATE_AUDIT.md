# Forensic duplicate audit — resolved decisions

## MODULE: Dashboard shell

### File A

- **path**: `gradright-web/components/dashboard/dashboard-shell.tsx`
- **purpose**: Primary authenticated hub layout — sidebar, header, streak hook, lazy chatbot.
- **UI depth**: Full navigation and chrome.
- **logic depth**: Client-only streak ping, pathname-based active state.
- **API integration**: `fetch("/api/user/streak-check")` (non-blocking).

### File B

- **path**: `gradright-web/components/dashboard/dashboard-shell-loader.tsx`
- **purpose**: `dynamic()` wrapper with `ssr: false` so AI SDK chat code never loads on the Node SSR path.
- **UI depth**: Loading placeholder only.
- **logic depth**: Minimal — delegates to File A.

### DECISION

- **Keep both** — they are not duplicate implementations; B is a deliberate loading boundary for webpack/AI SDK compatibility.

### FINAL PATH

- `DashboardShell` → `dashboard-shell.tsx`
- `DashboardShellLoader` → `dashboard-shell-loader.tsx` (entry from `app/(hub)/layout.tsx`)

### MIGRATION STEPS

- None required; imports already target `DashboardShellLoader` from the hub layout.

---

## MODULE: Admission predictor (Plan)

### File A (removed)

- **path**: `components/admission/AdmissionPredictorClient.tsx` (deleted)
- **purpose**: Full predictor wizard UI.

### File B (canonical)

- **path**: `components/plan/AdmissionPredictorClient.tsx`
- **purpose**: Same UI; imports `@/lib/validations/plan`.

### DECISION

- **Keep B**, delete A — single product home under **Plan**.

### MIGRATION STEPS

- `app/(hub)/plan/admission/page.tsx` imports from `@/components/plan/AdmissionPredictorClient`.

---

## MODULE: API client (HTTP to Python backend)

### File A

- **path**: `gradright-web/lib/api/client.ts` — uses `NEXT_PUBLIC_API_URL`.

### File B (removed)

- **path**: `gradright-web/src/api/client.ts` — CRA `REACT_APP_API_URL`; **zero imports** in the repo.

### DECISION

- **Keep A**, **delete B**.

---

## MODULE: Hub navigation config

### File A (removed as standalone)

- **path**: `lib/dashboard/module-routes.ts` — only `MODULE_ROUTES` + `DASHBOARD_NAV`.

### File B (canonical)

- **path**: `lib/dashboard/module-registry.ts` — adds titles, auth flags, journey stage metadata; exports `DASHBOARD_NAV`.

### DECISION

- **Merge into B**, delete redundant **A**; all imports updated to **B**.

---

## MODULE: Student auth

### Canonical

- `app/(auth-shell)/sign-in`, `sign-up` + `components/auth/*`.

### Legacy

- `/login`, `/signup`, `/nbfc/login` → redirects in `middleware.ts`.

### DECISION

- **One sign-in / sign-up system** for students; partner role still uses same forms with portal-aware copy where applicable.
