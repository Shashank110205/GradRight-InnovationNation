#!/usr/bin/env node
/**
 * Lightweight architecture checks (no extra npm deps).
 * Run: node scripts/verify-architecture.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
let failed = false;

function fail(msg) {
  console.error(`[verify-architecture] FAIL: ${msg}`);
  failed = true;
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".next-nbfc")
      continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const legacyPaths = [
  join(root, "lib", "admission"),
  join(root, "components", "admission"),
  join(root, "components", "auth"),
  join(root, "components", "nbfc"),
  join(root, "lib", "validations", "admission-predictor.ts"),
  join(root, "src", "api", "client.ts"),
];
for (const p of legacyPaths) {
  if (existsSync(p)) fail(`Remove or relocate legacy path: ${relative(root, p)}`);
}

// Duplicate API handlers (two route.ts resolving to same URL — rare but catastrophic)
const apiRoot = join(root, "app", "api");
if (existsSync(apiRoot)) {
  const routeFiles = walk(apiRoot).filter((f) => f.endsWith(`${join.sep}route.ts`));
  const rels = routeFiles.map((f) => relative(apiRoot, f).replace(/\\/g, "/"));
  const seen = new Set();
  for (const r of rels) {
    if (seen.has(r)) fail(`Duplicate API route file: ${r}`);
    seen.add(r);
  }
}

console.log("[verify-architecture] Typecheck…");
try {
  execSync("pnpm exec tsc --noEmit", { cwd: root, stdio: "inherit" });
} catch {
  fail("TypeScript check failed");
}

if (failed) {
  process.exit(1);
}
console.log("[verify-architecture] OK");
