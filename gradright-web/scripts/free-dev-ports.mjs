/**
 * Frees localhost:3000 and :3001 so `pnpm dev:all` can bind both servers.
 * Run automatically before `dev:all`; use `node scripts/free-dev-ports.mjs` manually if needed.
 */
import { execSync } from "node:child_process";
import process from "node:process";

const PORTS = [3000, 3001];

function freeWindows() {
  for (const port of PORTS) {
    try {
      execSync(
        `powershell -NoProfile -Command "$p=${port}; Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: "ignore" }
      );
    } catch {
      /* no listener or access denied */
    }
  }
}

function freeUnix() {
  for (const port of PORTS) {
    try {
      const out = execSync(`lsof -ti:${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (!out) continue;
      for (const pid of out.split(/\s+/).filter(Boolean)) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* lsof: nothing on port */
    }
  }
}

if (process.platform === "win32") {
  freeWindows();
} else {
  freeUnix();
}

console.log("[free-dev-ports] Cleared listeners on ports 3000 and 3001 (if any).");
