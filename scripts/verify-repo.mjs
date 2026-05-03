#!/usr/bin/env node
/**
 * Single entry: structural + type + layout checks for the GradRight monorepo.
 * Run from repo root: pnpm verify:repo
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const web = join(root, "gradright-web");
let failed = false;

function fail(msg) {
  console.error(`[verify-repo] FAIL: ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`[verify-repo] OK: ${msg}`);
}

// --- 1) Root lockfile policy (single source of truth) ---
if (!existsSync(join(root, "pnpm-lock.yaml"))) {
  fail("Missing root pnpm-lock.yaml — run `pnpm install` at repo root.");
} else ok("root pnpm-lock.yaml present");

if (existsSync(join(web, "pnpm-lock.yaml"))) {
  fail("Remove gradright-web/pnpm-lock.yaml — workspace uses root lockfile only.");
}

// --- 2) Docs tree ---
const docsDir = join(root, "docs");
if (!existsSync(docsDir)) fail("Missing docs/");
else {
  const need = [
    "FINAL_MONOREPO_ARCHITECTURE.md",
    "FULL_PRODUCT_FLOW.md",
    "DEVELOPER_SETUP.md",
    "BUILD_AND_VERIFY.md",
    "DEPENDENCY_POLICY.md",
    "FINAL_REFACTOR_LOG.md",
  ];
  for (const f of need) {
    if (!existsSync(join(docsDir, f))) fail(`Missing docs/${f}`);
  }
  if (!failed) ok("required docs/ files present");
}

// --- 3) Legacy UI / admission paths (web) ---
const legacy = [
  join(web, "lib", "admission"),
  join(web, "components", "admission"),
  join(web, "components", "auth"),
  join(web, "components", "nbfc"),
  join(web, "lib", "validations", "admission-predictor.ts"),
  join(web, "src", "api", "client.ts"),
];
for (const p of legacy) {
  if (existsSync(p)) fail(`Legacy path must not exist: ${relative(root, p)}`);
}
if (!failed) ok("no legacy admission/auth/nbfc top-level folders");

// --- 4) Student hub routes: each journey segment has page.tsx ---
const hub = join(web, "app", "(hub)");
const requiredHubPages = [
  "dashboard/page.tsx",
  "career/page.tsx",
  "discover/page.tsx",
  "plan/page.tsx",
  "finance/page.tsx",
  "apply/page.tsx",
  "succeed/page.tsx",
];
for (const rel of requiredHubPages) {
  const p = join(hub, rel);
  if (!existsSync(p)) fail(`Missing hub route file: ${relative(web, p)}`);
}
if (!failed) ok("student hub segment pages exist");

// --- 5) Single onboarding + auth route files ---
const singles = [
  join(web, "app", "onboarding", "page.tsx"),
  join(web, "app", "(auth-shell)", "sign-in", "page.tsx"),
  join(web, "app", "(auth-shell)", "sign-up", "page.tsx"),
];
for (const p of singles) {
  if (!existsSync(p)) fail(`Missing canonical route: ${relative(web, p)}`);
}
if (!failed) ok("canonical onboarding + auth routes present");

// --- 6) package.json: web should pin aligned React types (documented in DEPENDENCY_POLICY) ---
const webPkg = JSON.parse(readFileSync(join(web, "package.json"), "utf8"));
const tr = webPkg.devDependencies?.["@types/react"];
const trd = webPkg.devDependencies?.["@types/react-dom"];
if (!tr?.includes("19.2") || !trd?.includes("19.2")) {
  fail(`gradright-web devDependencies should use @types/react 19.2.x and @types/react-dom 19.2.x (got ${tr}, ${trd})`);
} else ok("gradright-web React type packages aligned to 19.2.x");

// --- 7) TypeScript + layout (verify-architecture includes `tsc --noEmit`) ---
console.log("[verify-repo] gradright-web: verify-architecture (tsc + guards) …");
try {
  execSync("node scripts/verify-architecture.mjs", { cwd: web, stdio: "inherit" });
} catch {
  fail("verify-architecture failed");
}

// --- 8) Root clutter (accidental app source) ---
const rootDirs = new Set(
  readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
);
const forbiddenRoot = ["components", "app", "lib", "pages"];
for (const n of forbiddenRoot) {
  if (rootDirs.has(n)) fail(`Unexpected app-like folder at repo root: ${n}/`);
}

if (failed) {
  process.exit(1);
}
console.log("[verify-repo] All checks passed.");
