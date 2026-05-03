#!/usr/bin/env node
/**
 * GradRight environment checks for local dev (Node, Python, optional Docker, Expo).
 * Run from repo root: node scripts/verify-environment.mjs
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: "utf-8",
    shell: process.platform === "win32",
    ...opts,
  });
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

function parseSemverMajorMinor(s) {
  const m = String(s).match(/(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]) };
}

function checkNode() {
  const r = run("node", ["-v"]);
  if (!r.ok) {
    console.error("FAIL: Node.js not found. Install Node 20 LTS+.");
    return false;
  }
  const v = r.out || "";
  const parsed = parseSemverMajorMinor(v.replace(/^v/, ""));
  if (!parsed || parsed.major < 20) {
    console.error(`FAIL: Node ${v} — need v20+ (see docs/implementation/PROJECT_SETUP.md).`);
    return false;
  }
  console.log(`OK: Node ${v}`);
  return true;
}

function checkPython() {
  const candidates = [
    ["python", ["--version"]],
    ["python3", ["--version"]],
    ["py", ["-3", "--version"]],
  ];
  for (const [cmd, args] of candidates) {
    const r = run(cmd, args);
    if (!r.ok) continue;
    const line = `${r.out}\n${r.err}`.trim() || "";
    const parsed = parseSemverMajorMinor(line);
    if (parsed && parsed.major === 3 && parsed.minor >= 11) {
      if (parsed.minor > 12) {
        console.log(
          `OK: Python (${cmd}) ${line} (3.13+ can work; project docs target 3.11–3.12.)`
        );
      } else {
        console.log(`OK: Python (${cmd}) ${line}`);
      }
      return true;
    }
    if (parsed && parsed.major === 3 && parsed.minor < 11) {
      console.error(`FAIL: ${line.trim()} — need Python 3.11+`);
      return false;
    }
  }
  console.error("FAIL: Python 3.11+ not found (tried python, python3, py -3).");
  return false;
}

function checkDocker() {
  const r = run("docker", ["--version"]);
  if (r.ok) {
    console.log(`OK: Docker ${r.out.split("\n")[0]}`);
    return true;
  }
  console.log("SKIP: Docker not installed (optional unless you containerize services).");
  return true;
}

function checkExpoMobile() {
  const mobile = path.join(root, "gradright-mobile");
  if (!existsSync(mobile)) {
    console.log("SKIP: gradright-mobile/ not present — run Expo scaffold first.");
    return true;
  }
  const r = run("npx", ["expo-doctor"], { cwd: mobile });
  if (r.ok) {
    console.log("OK: npx expo-doctor passed.");
    return true;
  }
  console.error("WARN: npx expo-doctor failed — run manually in gradright-mobile/");
  if (r.err) console.error(r.err);
  return true;
}

let allOk = true;
console.log("--- GradRight verify-environment ---\n");
allOk = checkNode() && allOk;
allOk = checkPython() && allOk;
checkDocker();
checkExpoMobile();
console.log("\nNext steps:");
console.log(
  "  gradright-backend: python -m venv venv → activate venv → pip install -r requirements.txt"
);
console.log("  gradright-backend: uvicorn main:app --reload --port 8000 (venv active)");
console.log("  gradright-mobile: copy .env.example to .env, npm run start");
console.log("");
process.exit(allOk ? 0 : 1);
