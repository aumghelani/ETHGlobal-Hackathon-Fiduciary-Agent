import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Single source of truth for env: the repo-root .env.local. The workspace packages
// (@fiduciary/hedera, @fiduciary/agents) already load that same root file via dotenv,
// so we load it here too — that way the frontend needs NO separate .env.local. Any var
// already present in process.env (e.g. injected by Vercel's dashboard) is left untouched.
// On Vercel there is no .env.local on disk, so this is a no-op there and the dashboard wins.
try {
  const here = dirname(fileURLToPath(import.meta.url));
  const rootEnv = resolve(here, "../../.env.local");
  for (const line of readFileSync(rootEnv, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
} catch {
  // No root .env.local (e.g. on Vercel, or a fresh checkout) — rely on real env vars.
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fiduciary/agents", "@fiduciary/hedera"],
  webpack: (config) => {
    // The agents package uses NodeNext-style ".js" extension imports in its TS
    // source; map them back to .ts/.tsx so Next's bundler can resolve them.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    // Dynamic (and its deps) reference optional native/node-only modules not needed in
    // the browser bundle — mark them external so the build doesn't fail.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
