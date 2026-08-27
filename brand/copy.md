# eLafda copy kit

Profile fields, bios, and boilerplate. Voice rules from `README.md` apply: plain,
declarative, a little dry. The record speaks; it doesn't hype. Keep discussion and
record vocabulary distinct. Casing is always **eLafda**.

## X (Twitter) profile

| Field | Value |
| --- | --- |
| Display name | `eLafda.` — the full stop is part of the name |
| Handle | `@elafda` (fallbacks: `@elafdadotorg`, `@elafda_org`) |
| Bot handle | `@eLafdaBot` (separate account, replies to tags) |
| Bio | Option A below (144/160 chars) |
| Location | `Indian internet` |
| Website | `elafda.org` |
| Avatar | `x/avatar-400.png` |
| Banner | `x/banner-1500x500.png` |

**Bio options** (all within 160):

- **A (default):** Internet forgets. Receipts shouldn't. The open-source public memory of Indian internet culture. Every case source-backed. Early archive preview.
- **B:** Putting the full stop on internet lafda. Source-backed timelines of what actually happened, kept apart from the noise. Open source. Early preview.
- **C:** The public memory of Indian internet culture. Discussion on one side, the source-backed record on the other. Open source. Early archive preview.

**Pinned post** (268/280 chars):

> Internet forgets. Receipts shouldn't.
>
> eLafda is an open-source archive of internet lafda: every case a timeline where claims only enter the record once their sources hold up.
>
> Discussion is loud. The record is quiet. We keep them separate.
>
> Early preview → elafda.org

## GitHub organization

- **Description** (96/160): The open-source home of internet lafda: source-backed case timelines of Indian internet culture.
- **Website:** `https://elafda.org`
- **Repo about line:** Community discussion and canonical record, kept separate. Cases, claims, sources — eLafda's monorepo.

## Website metadata

- **Title:** `eLafda: The open-source home of internet lafda` (as shipped)
- **Meta / OG description** (154 chars): eLafda archives internet lafda as case files: community discussion on one side, a source-backed canonical record on the other. Open source, early preview.

## Boilerplate

**One-liner** (10 words):

> The open-source public memory of Indian internet culture.

**Short** (~40 words):

> eLafda archives internet lafda as case files. The community discusses, votes, and
> argues in one layer; a source-backed canonical record grows in the other. Popularity
> drives discovery, never truth. Open source, community governed, currently in early
> preview.

**Full** (~90 words):

> eLafda is the public memory of Indian internet culture. Every lafda becomes a case:
> a timeline of claims that only enter the record after their sources and wording pass
> community and archivist review. Discussion (posts, votes, popularity) stays in its
> own layer and drives discovery, never truth. The archive is open source and community
> governed, starting with Indian Tech Twitter while the review and moderation systems
> take shape. The internet forgets; the receipts shouldn't. eLafda is in early preview
> at elafda.org.

## Tag replies (pre-launch)

For people tagging `@eLafdaBot` expecting the bot from `SPEC.md` §9. Acknowledge the
tag, never the claim in the thread. Lowercase and casual is the point here: the
formal register belongs to the record, not to replies.

**This is now automated.** `apps/bot` posts one of these on a schedule, once per
conversation. Each reply is picked at random from a fixed pool in
`apps/bot/src/reply.ts`: a few standard replies, each in a couple of small
wordings, always ending in the tagged wall link `elafda.org/tagged` (the tag is
recorded there in the same run, so the link is honest). Editing the lists below
does not change what the bot posts. Change the pool in `reply.ts` and redeploy.

The standard replies (write like a person typing, not like copy):

> tea received. teapot pending. it's up on the wall though: elafda.org/tagged
>
> you brought tea to a construction site. we'll hold it properly soon, till
> then it's pinned on the wall: elafda.org/tagged
>
> not live yet. we're still building the thing that holds the tea. your tag
> made the wall though: elafda.org/tagged
>
> we saw this lol. nowhere to put it properly yet, but it's on the wall:
> elafda.org/tagged

Each has one or two sibling wordings in `reply.ts` that swap a word or a clause
and nothing else.

A reply may also carry one meme image (kermit-sipping-tea energy), picked at
random from a curated set the maintainer uploads to the bot's KV namespace under
`meme:` keys. No set uploaded means text-only replies; see `apps/bot/README.md`.

One reply per conversation, enforced by a KV ledger rather than by hand. No dates,
and never "on it": nothing is queued yet.

## Usage notes

- No em dashes anywhere in outward-facing copy. Use a period, colon, or parentheses
  instead (matches the sitewide convention).
- "lafda" stays lowercase in running text, and never takes quotes. It's vocabulary,
  not slang to apologize for.
- Never claim a case is "true" or "settled". Cases are *source-backed*, *developing*,
  *resolved*, or *disputed*. The record describes; readers judge.
- "Early preview" appears in every profile until the interactive product ships.
  The preview cue is a product requirement, not marketing modesty.
