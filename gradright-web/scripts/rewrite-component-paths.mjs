/**
 * One-off migration helper — rewrites legacy @/components/* paths.
 * Do not run again unless you extend the replacement table.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const repl = [
  ["@/components/auth/", "@/components/student/auth/"],
  ["@/components/onboarding/", "@/components/student/onboarding/"],
  ["@/components/landing/", "@/components/student/landing/"],
  ["@/components/dashboard/", "@/components/student/dashboard/"],
  ["@/components/career/", "@/components/student/career/"],
  ["@/components/plan/", "@/components/student/plan/"],
  ["@/components/finance/", "@/components/student/finance/"],
  ["@/components/apply/", "@/components/student/apply/"],
  ["@/components/nbfc/", "@/components/partner/"],
];

function walk(dir) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) {
      if (
        n.name === "node_modules" ||
        n.name === ".next" ||
        n.name === ".next-nbfc"
      )
        continue;
      walk(p);
    } else if (
      /\.(tsx|ts|md|mjs)$/.test(n.name) &&
      n.name !== "rewrite-component-paths.mjs"
    ) {
      let s = fs.readFileSync(p, "utf8");
      const o = s;
      for (const [a, b] of repl) s = s.split(a).join(b);
      if (s !== o) fs.writeFileSync(p, s);
    }
  }
}

walk(root);
