/**
 * The localStorage key holding an explicit theme choice. Shared by the
 * client toggle that writes it and the root layout's pre-paint script that
 * reads it, so the two can never drift onto different keys. Kept outside
 * the "use client" module: a client module's exports become client
 * references in server components, not plain values.
 */
export const THEME_STORAGE_KEY = "elafda-theme";
