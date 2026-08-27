/**
 * Drizzle schema for eLafda's PostgreSQL database.
 *
 * Deliberately empty: the `adopt-supabase-postgres` change lands the provider,
 * migration workflow and connectivity only. The first product tables (SPEC.md
 * section 14) belong to the readable-archive change, so their review happens
 * next to the feature that needs them.
 *
 * Everything defined here must run on vanilla PostgreSQL. Do not depend on
 * Supabase-specific extensions or services; self-hosters point these same
 * migrations at their own database.
 */

export {};
