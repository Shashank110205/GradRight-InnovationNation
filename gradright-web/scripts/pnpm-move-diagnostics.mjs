import { existsSync, lstatSync, readlinkSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const nextShim = join(root, "node_modules", ".bin", "next");
const nextCmdShim = join(root, "node_modules", ".bin", "next.CMD");
const pnpmDir = join(root, "node_modules", ".pnpm");
const expectedNextBin = join(
  root,
  "node_modules",
  ".pnpm",
  "next@16.2.4_@babel+core@7.2_6da10f9b25cc13f88ae52f1001026cca",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

function inspectPath(p) {
  try {
    const stat = lstatSync(p);
    return {
      exists: true,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
      isSymbolicLink: stat.isSymbolicLink(),
      linkTarget: stat.isSymbolicLink() ? readlinkSync(p) : null,
    };
  } catch (e) {
    return {
      exists: false,
      code: e && typeof e === "object" && "code" in e ? e.code : undefined,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

function log(label, data) {
  console.log(`[pnpm-move-diagnostics] ${label}:`, data);
}

log("cwd and package manager context", {
  root,
  nodeVersion: process.version,
  platform: process.platform,
});
log("next command shim state", {
  nextShim: inspectPath(nextShim),
  nextCmdShim: inspectPath(nextCmdShim),
});
log("pnpm virtual store and expected next target", {
  pnpmDir: inspectPath(pnpmDir),
  expectedNextBin: inspectPath(expectedNextBin),
});

console.log("pnpm move diagnostics done");
