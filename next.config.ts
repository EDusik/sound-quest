import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Pin workspace root so Next does not pick a parent folder’s lockfile (e.g. ~/package-lock.json).
 *
 * With multiple sibling projects (many `package-lock.json` files under the same parent), Next can
 * infer a workspace root above this app. `turbopack.root` / `outputFileTracingRoot` pin tracing to
 * this repo; use `npm run dev` (webpack) if Turbopack still mis-resolves CSS packages from that
 * inferred root.
 *
 * Prefer npm’s `INIT_CWD` when `process.cwd()` / compiled `import.meta.url` do not sit in the repo.
 */
function resolveProjectRoot(): string {
  const configDir = path.dirname(fileURLToPath(import.meta.url));
  const initCwd = process.env.INIT_CWD;
  const candidates = [initCwd, process.cwd(), configDir].filter(
    (d): d is string => Boolean(d),
  );
  for (const dir of candidates) {
    const resolved = path.resolve(dir);
    if (fs.existsSync(path.join(resolved, "node_modules", "next"))) {
      return resolved;
    }
  }
  return configDir;
}

const projectRoot = resolveProjectRoot();

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.buymeacoffee.com", pathname: "/**" },
    ],
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
