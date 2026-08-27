/**
 * The pre-launch holding reply.
 *
 * Fixed text with no interpolation from any tweet. That is deliberate: SPEC.md
 * section 9 forbids the bot from summarizing unreviewed allegations, and a
 * reply that cannot quote the thread cannot be steered by it either.
 */
export const PRELAUNCH_REPLY =
  "coming soon. we're building the thing that holds all the tea. elafda.org";

/** X counts characters, not bytes. Kept here so a copy edit cannot exceed it. */
export const REPLY_LIMIT = 280;
