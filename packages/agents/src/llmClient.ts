import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../../.env.local") });

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey.trim() === "") {
    throw new Error(
      "Missing required environment variable ANTHROPIC_API_KEY. " +
        "Add it to .env.local at the repo root (see .env.example)."
    );
  }
  return new Anthropic({ apiKey });
}
