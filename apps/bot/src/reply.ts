/**
 * The pre-launch holding replies.
 *
 * A fixed pool with no interpolation from any tweet. That is deliberate:
 * SPEC.md section 9 forbids the bot from summarizing unreviewed allegations,
 * and a reply that cannot quote the thread cannot be steered by it either.
 * The pool holds a few standard replies, each with small wording variations
 * so repeats don't read copy-pasted; every wording says the same thing.
 *
 * Every reply ends with the public wall of tagged tweets, because the tag the
 * reply answers is recorded there in the same run.
 *
 * Voice rules come from brand/copy.md: lowercase and casual, no em dashes, no
 * Oxford commas, no dates and never "on it". Write like a person typing a
 * reply, not like copy.
 */

/** Each row is one standard reply; its strings are the small wordings. */
const REPLY_TEMPLATES = [
  [
    "tea received. teapot pending. it's up on the wall though:",
    "tea received. teapot not ready yet. it's up on the wall though:",
    "tea noted. teapot pending. the wall's got it:",
  ],
  [
    "you brought tea to a construction site. we'll hold it properly soon, till then it's pinned on the wall:",
    "you brought tea to a construction site. teapot's not done yet, screenshot it for now. it's pinned on the wall though:",
  ],
  [
    "not live yet. we're still building the thing that holds the tea. your tag made the wall though:",
    "not live yet. still building the thing that holds all the tea. your tag made the wall though:",
    "we're not live yet. the thing that holds the tea is still being built. your tag made the wall though:",
  ],
  [
    "we saw this lol. nowhere to put it properly yet, but it's on the wall:",
    "we saw this. nowhere to put it properly yet, but it's on the wall:",
  ],
] as const;

/** The tagged wall, where the answered tag is already visible. */
const REPLY_LINK = "elafda.org/tagged";

/** Every reply the pool can produce, for tests and copy review. */
export function allPrelaunchReplies(): string[] {
  return REPLY_TEMPLATES.flatMap((wordings) =>
    wordings.map((wording) => `${wording} ${REPLY_LINK}`),
  );
}

/**
 * Compose one holding reply. `random` must return a number in [0, 1) like
 * `Math.random`, and is injected so tests can pin the choice.
 */
export function composePrelaunchReply(random: () => number): string {
  const wordings =
    REPLY_TEMPLATES[Math.floor(random() * REPLY_TEMPLATES.length)] ??
    REPLY_TEMPLATES[0];
  const wording =
    wordings[Math.floor(random() * wordings.length)] ?? wordings[0];
  return `${wording} ${REPLY_LINK}`;
}

/** X counts characters, not bytes. Kept here so a copy edit cannot exceed it. */
export const REPLY_LIMIT = 280;
