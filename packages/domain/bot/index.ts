export {
  BOT_COMMANDS,
  UNKNOWN_COMMAND,
  UNRESOLVED,
  isBotCommand,
  type BotCommand,
  type CommandResolution,
  type ResolutionTier,
  type ResolvedCommand,
} from "./commands.ts";
export {
  DEFAULT_LEXICONS,
  EN,
  HI,
  HI_LATN,
  type PhraseLexicon,
} from "./lexicon.ts";
export {
  normalizeMention,
  resolveCommand,
  resolveCommandWithClassifier,
  type BotCommandClassifier,
  type ClassifierVerdict,
  type ResolveOptions,
} from "./resolve-command.ts";
