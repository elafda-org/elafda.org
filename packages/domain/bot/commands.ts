/**
 * The closed command vocabulary for `@eLafdaBot`, per SPEC.md section 9.
 *
 * Every mention resolves to exactly one of these commands or to `unknown`.
 * Nothing downstream may invent a seventh command: the bot is a nomination
 * interface, and an unrecognized instruction must degrade to `help`, never to
 * a write.
 */
export const BOT_COMMANDS = [
  "track",
  "open",
  "update",
  "find",
  "archive",
  "help",
] as const;

export type BotCommand = (typeof BOT_COMMANDS)[number];

/** Returned when no tier could map the mention to a command. */
export const UNKNOWN_COMMAND = "unknown";

export type ResolvedCommand = BotCommand | typeof UNKNOWN_COMMAND;

/** Which tier produced the resolution. Recorded on the bot event. */
export type ResolutionTier = "exact" | "phrase" | "classifier" | "unknown";

export type CommandResolution = {
  command: ResolvedCommand;
  tier: ResolutionTier;
  /** Between 0 and 1. Callers gate writes on this; the resolver does not. */
  confidence: number;
};

const COMMAND_SET: ReadonlySet<string> = new Set(BOT_COMMANDS);

export function isBotCommand(value: unknown): value is BotCommand {
  return typeof value === "string" && COMMAND_SET.has(value);
}

export const UNRESOLVED: CommandResolution = Object.freeze({
  command: UNKNOWN_COMMAND,
  tier: "unknown",
  confidence: 0,
});
