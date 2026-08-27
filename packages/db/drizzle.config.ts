import { readFileSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// Zero-dependency .env loading, same pattern as apps/bot/scripts. A variable
// already exported in the shell wins over the file.
try {
  for (const line of readFileSync(new URL(".env", import.meta.url), "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    process.env[key] ??= trimmed.slice(separator + 1).trim();
  }
} catch {
  // No .env file; rely on the shell environment.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  // Only `drizzle-kit migrate` needs a database. `generate` works offline, so
  // the URL is read lazily from the environment rather than validated here.
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
