import {
  UNKNOWN_COMMAND,
  UNRESOLVED,
  isBotCommand,
  type BotCommand,
  type CommandResolution,
} from "./commands.ts";
import { DEFAULT_LEXICONS, type PhraseLexicon } from "./lexicon.ts";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/giu;
const HANDLE_PATTERN = /@[\p{L}\p{N}_]+/gu;
/** Keep letters, numbers, and combining marks. Marks carry Devanagari vowels. */
const NOISE_PATTERN = /[^\p{L}\p{N}\p{M}\s]/gu;

export type ResolveOptions = {
  /** Defaults to English, Roman-script Hindi, and Devanagari Hindi. */
  lexicons?: readonly PhraseLexicon[];
};

/**
 * Reduce mention text to the form the lexicon is written in.
 *
 * URLs are removed rather than parsed. SPEC.md section 9 forbids the bot from
 * downloading arbitrary linked files, and a link's contents are evidence for a
 * reviewer, never an input to interpreting what the tagging user asked for.
 */
export function normalizeMention(text: string): string {
  return text
    .replace(URL_PATTERN, " ")
    .replace(HANDLE_PATTERN, " ")
    .toLowerCase()
    .replace(NOISE_PATTERN, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Resolve mention text to a single command.
 *
 * Pure and deterministic: no network, storage, clock, or randomness, and no
 * classifier unless the caller reaches for `resolveCommandWithClassifier`.
 *
 * The argument is the tagging account's own text and nothing else. Parent,
 * quoted, and linked content must never be concatenated into it: that
 * separation is what keeps an instruction planted in a thread from steering
 * the bot.
 */
export function resolveCommand(
  mentionText: string,
  options: ResolveOptions = {},
): CommandResolution {
  const normalized = normalizeMention(mentionText);
  if (normalized.length === 0) {
    return UNRESOLVED;
  }

  const [firstWord] = normalized.split(" ");
  if (isBotCommand(firstWord)) {
    return { command: firstWord, tier: "exact", confidence: 1 };
  }

  return resolveByPhrase(normalized, options.lexicons ?? DEFAULT_LEXICONS);
}

function resolveByPhrase(
  normalized: string,
  lexicons: readonly PhraseLexicon[],
): CommandResolution {
  const padded = ` ${normalized} `;
  const strengths = new Map<BotCommand, number>();

  for (const lexicon of lexicons) {
    for (const [command, phrases] of Object.entries(lexicon) as [
      BotCommand,
      readonly string[],
    ][]) {
      for (const phrase of phrases) {
        if (!padded.includes(` ${phrase} `)) {
          continue;
        }
        const strength = phrase.split(" ").length;
        if (strength > (strengths.get(command) ?? 0)) {
          strengths.set(command, strength);
        }
      }
    }
  }

  if (strengths.size === 0) {
    return UNRESOLVED;
  }

  const best = Math.max(...strengths.values());
  const winners = [...strengths].filter(([, strength]) => strength === best);

  // Two commands matched equally well. Guessing between them could open a
  // nomination the tagging user did not ask for, so report nothing and let the
  // caller answer with `help`.
  const winner = winners[0];
  if (winners.length !== 1 || !winner) {
    return UNRESOLVED;
  }

  return {
    command: winner[0],
    tier: "phrase",
    confidence: Math.min(0.9, 0.5 + 0.1 * best),
  };
}

export type ClassifierVerdict = {
  command: string;
  confidence: number;
};

/**
 * Port for a future model-backed tier. Nothing implements it yet, so shipped
 * behavior stays deterministic and free.
 */
export type BotCommandClassifier = (
  normalizedText: string,
) => Promise<ClassifierVerdict | null> | ClassifierVerdict | null;

/**
 * Try the deterministic tiers, then fall back to a classifier.
 *
 * The classifier sees normalized text, so handles and URLs never reach it, and
 * its answer is validated against the command vocabulary before it is trusted.
 * An error, a null, or an unlisted command all resolve to `unknown`: a
 * classifier can suggest a command, never introduce one.
 */
export async function resolveCommandWithClassifier(
  mentionText: string,
  classifier: BotCommandClassifier,
  options: ResolveOptions = {},
): Promise<CommandResolution> {
  const deterministic = resolveCommand(mentionText, options);
  if (deterministic.command !== UNKNOWN_COMMAND) {
    return deterministic;
  }

  const normalized = normalizeMention(mentionText);
  if (normalized.length === 0) {
    return UNRESOLVED;
  }

  let verdict: ClassifierVerdict | null;
  try {
    verdict = await classifier(normalized);
  } catch {
    return UNRESOLVED;
  }

  if (!verdict || !isBotCommand(verdict.command)) {
    return UNRESOLVED;
  }

  const confidence = Number(verdict.confidence);
  if (!Number.isFinite(confidence)) {
    return UNRESOLVED;
  }

  return {
    command: verdict.command,
    tier: "classifier",
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}
