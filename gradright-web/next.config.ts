import type { NextConfig } from "next";
import os from "node:os";
import path from "node:path";

/** Avoid `.next` under OneDrive — sync locks often cause EPERM on `.next/dev/logs` cleanup during `next dev`. */
function resolveDistDir(): string {
  const fromEnv = process.env.NEXT_DIST_DIR?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const cwd = process.cwd();
  const underOneDrive = /oneDrive/i.test(cwd);
  let resolved = ".next";

  if (process.platform === "win32" && underOneDrive) {
    const absTarget = path.join(
      os.homedir(),
      "AppData",
      "Local",
      "GradRight",
      "next-dist"
    );
    const rel = path.relative(cwd, path.resolve(absTarget));
    /* Next joins distDir to the project root; use a relative path, not an absolute second root. */
    if (!path.isAbsolute(rel) && rel.length > 0) {
      resolved = rel;
    }
  }

  return resolved;
}

const nextConfig: NextConfig = {
  distDir: resolveDistDir(),
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"],
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
