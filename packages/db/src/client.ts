import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

/**
 * Create a Drizzle client over postgres-js for one connection string.
 *
 * In the web Worker the string comes from the Hyperdrive binding
 * (`env.HYPERDRIVE.connectionString`); locally it is a plain `DATABASE_URL`.
 * Hyperdrive pools in transaction mode, so nothing session-scoped is safe:
 * `prepare: false` keeps postgres-js from using session prepared statements,
 * and application code must not rely on advisory locks or temp tables that
 * outlive a transaction.
 */
export function createDb(connectionString: string) {
  const sql = postgres(connectionString, {
    prepare: false,
    // Workers hold connections per-invocation and Hyperdrive does the real
    // pooling, so the driver-side pool stays small.
    max: 5,
  });
  return { db: drizzle(sql, { schema }), sql };
}

export type Db = ReturnType<typeof createDb>["db"];
