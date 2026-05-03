/**
 * Inspect / clear `.next/dev/logs` when Next hits EPERM on cleanup (e.g. OneDrive locks).
 * Run from gradright-web: node scripts/next-dev-eprem-diagnostics.mjs
 */
import { execSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const logsDir = join(projectRoot, ".next", "dev", "logs");

function log(label, data) {
  console.log(`[next-dev-eprem-diagnostics] ${label}:`, data);
}

log("path segment check", {
  projectRoot,
  cwdUnderOneDrive: /oneDrive/i.test(projectRoot),
});

let nodeProcessCount = null;
try {
  if (process.platform === "win32") {
    const out = execSync(`tasklist /FI "IMAGENAME eq node.exe" /NH`, {
      encoding: "utf8",
    });
    nodeProcessCount = out.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  }
} catch (e) {
  nodeProcessCount = `error:${e instanceof Error ? e.message : String(e)}`;
}
log("node.exe row count (Windows tasklist)", { nodeProcessCount });

let logsExists = false;
let logsStat = null;
let entries = [];
try {
  logsExists = existsSync(logsDir);
  if (logsExists) {
    logsStat = statSync(logsDir);
    entries = readdirSync(logsDir);
  }
} catch (e) {
  log("stat/readdir failed", {
    error: e instanceof Error ? e.message : String(e),
    code: e && typeof e === "object" && "code" in e ? e.code : undefined,
  });
}
log("logs dir exists + mode", {
  logsDir,
  logsExists,
  isDirectory: logsStat?.isDirectory(),
  entryCount: entries.length,
});

log("logs dir file names (sample)", {
  entries: entries.slice(0, 30),
  truncated: entries.length > 30,
});

let rmResult = { ok: false };
try {
  if (logsExists) {
    rmSync(logsDir, { recursive: true, force: true });
    rmResult = { ok: true, method: "rmSync recursive" };
  } else {
    rmResult = { ok: true, skipped: "logs dir missing" };
  }
} catch (e) {
  rmResult = {
    ok: false,
    code: e && typeof e === "object" && "code" in e ? e.code : undefined,
    errno: e && typeof e === "object" && "errno" in e ? e.errno : undefined,
    message: e instanceof Error ? e.message : String(e),
  };
}
log("manual rmSync(.next/dev/logs)", rmResult);

let probeWrite = null;
try {
  const parent = join(projectRoot, ".next", "dev");
  if (!existsSync(parent)) {
    probeWrite = { skipped: "parent .next/dev missing" };
  } else {
    const testFile = join(parent, ".gradright-probe-write");
    writeFileSync(testFile, "ok");
    unlinkSync(testFile);
    probeWrite = { ok: true };
  }
} catch (e) {
  probeWrite = {
    ok: false,
    message: e instanceof Error ? e.message : String(e),
    code: e && typeof e === "object" && "code" in e ? e.code : undefined,
  };
}
log("probe write under .next/dev", probeWrite);

console.log("EPREM diagnostics done.");
