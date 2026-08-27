/**
 * Dev-only connectivity smoke check. Never deployed.
 *
 * Runs under `npm run smoke` (wrangler dev) and answers on localhost only. It
 * round-trips one trivial query through the HYPERDRIVE binding, which is the
 * exact path the web Worker will use, without adding any public endpoint to
 * the production Worker.
 */
import postgres from "postgres";

interface Env {
  HYPERDRIVE: { connectionString: string };
}

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      prepare: false,
      max: 1,
    });
    try {
      const rows = await sql`
        select 1 as ok, current_database() as database, version() as version
      `;
      const row = rows[0];
      return Response.json({
        ok: row?.ok === 1,
        database: row?.database ?? null,
        version: row?.version ?? null,
      });
    } catch (error) {
      return Response.json(
        { ok: false, error: error instanceof Error ? error.message : "unknown" },
        { status: 500 },
      );
    } finally {
      await sql.end();
    }
  },
};
