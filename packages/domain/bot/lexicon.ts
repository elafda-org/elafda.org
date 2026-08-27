import type { BotCommand } from "./commands.ts";

/**
 * Phrase variants that map free-form mentions onto the command vocabulary.
 *
 * This table is data, not logic: AGENTS.md keeps user-visible strings out of
 * domain logic, and the product targets Hindi and Hinglish phrasings from
 * launch. Adding a language is an edit here and nowhere else.
 *
 * Entries must already be in normalized form: lowercase, punctuation removed,
 * single-spaced. `normalizeMention` produces that form.
 */
export type PhraseLexicon = Readonly<Record<BotCommand, readonly string[]>>;

export const EN: PhraseLexicon = {
  track: [
    "track this",
    "keep an eye",
    "keep an eye on this",
    "keep track",
    "watch this",
    "follow this",
    "log this",
    "note this",
  ],
  open: [
    "open a case",
    "open case",
    "start a case",
    "file a case",
    "create a case",
    "register a case",
    "make a case",
    "needs a case",
  ],
  update: [
    "add update",
    "add an update",
    "new update",
    "an update",
    "new development",
    "there is an update",
    "follow up",
    "followup",
    "latest on this",
  ],
  find: [
    "find this",
    "is there a case",
    "is there already a case",
    "any case for this",
    "already a case",
    "look up",
    "search for",
    "do we have a case",
  ],
  archive: [
    "archive this",
    "archive thread",
    "archive this thread",
    "save this thread",
    "save the thread",
    "capture this",
    "snapshot this",
    "preserve this",
    "before it is deleted",
  ],
  help: [
    "what can you do",
    "how do you work",
    "how does this work",
    "what commands",
    "list commands",
    "what do you do",
  ],
};

/** Roman-script Hindi, the dominant register on Indian X. */
export const HI_LATN: PhraseLexicon = {
  track: ["track karo", "track kar do", "isko track karo", "dekhte raho", "nazar rakho"],
  open: ["case banao", "iska case banao", "case bana do", "case khol do", "case kholo"],
  update: ["update hai", "naya update", "update kar do", "aur update", "update aaya"],
  find: ["koi case hai", "case hai kya", "case mila", "dhoondo", "koi case bana hai"],
  archive: ["save kar lo", "save karo", "archive kar do", "archive karo", "sambhal ke rakho"],
  help: ["kya kar sakte ho", "kaise kaam karta hai", "commands batao"],
};

/** Devanagari Hindi. */
export const HI: PhraseLexicon = {
  track: ["ट्रैक करो", "नज़र रखो", "देखते रहो"],
  open: ["केस बनाओ", "केस खोलो", "इसका केस बनाओ"],
  update: ["नया अपडेट", "अपडेट है", "अपडेट करो"],
  find: ["कोई केस है", "केस है क्या", "ढूंढो"],
  archive: ["सेव करो", "सेव कर लो", "आर्काइव करो", "थ्रेड सेव करो"],
  help: ["क्या कर सकते हो", "कैसे काम करता है"],
};

export const DEFAULT_LEXICONS: readonly PhraseLexicon[] = [EN, HI_LATN, HI];
