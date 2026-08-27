## Context

`SPEC.md` §9 states the bot is a nomination interface and never an autonomous publisher, and §22 lists prompt injection in bot-linked content as an adversarial test target. Both constraints land on the same component: the thing that decides what a mention is asking for.

The repository is at Phase 1 of §24. There is no database, no queue, and no bot credentials, so the ingestion flow in §9 cannot be built yet. Command resolution can, and everything downstream depends on its output.

## Goals

- One resolved command per mention, drawn from a closed set, with no path that produces an unlisted value.
- Fully deterministic behavior in the shipped version, so the resolver is testable without a network or a model.
- A seam that admits a model-backed classifier later without changing the resolver's contract or its callers.

## Decisions

### Resolution is a pure function

`resolveCommand(input)` takes the mention text plus the resolution options and returns a result object. No I/O, no clock, no randomness. The caller owns fetching, persistence, and replying. This keeps the §23 unit-test target honest and lets the same module run in a Worker, in a container worker, or in a test.

### Three tiers, two implemented

1. `exact`: the first word after the mention matches a command.
2. `phrase`: a locale-keyed lexicon of known variants matches the normalized mention.
3. `classifier`: an injected port returning one command and a confidence.

Tier three is a defined interface with no implementation. It also sits behind a separate entry point: `resolveCommand` stays synchronous and pure for the exact and phrase tiers, and `resolveCommandWithClassifier` is the async wrapper that consults a classifier only when the deterministic tiers return `unknown`. A real model adapter is asynchronous, and folding it into the hot path would make every mention await a promise to answer a question that string matching already settles. The shipped resolver never calls a model, so behavior is reproducible and free. When a classifier is added it must return a value from the same enum, and the resolver still validates that value against the enum before returning it. A classifier that returns anything else is treated as a failure, not as a new command.

Alternative rejected: sending every mention to a model. It would make the resolver untestable without a network, add per-mention cost to the cheapest possible decision, and widen the prompt-injection surface for no gain on the exact-match majority.

### Mention text is the only input

The resolver accepts the tagging account's own text. Parent, quoted, and linked tweet bodies are never passed to it. This is the structural defense against prompt injection: an attacker who writes instructions into a thread cannot reach the resolver, because thread content is captured as evidence by a different code path and is never classified.

### Confidence gates writes, not reads

`help` and `find` are read-only. `track`, `open`, `update`, and `archive` create or modify private nominations. The resolver reports confidence and tier; the caller decides. The rule the caller must implement is that anything below the write threshold degrades to the `help` response. The resolver does not perform the degrade itself, because the caller owns rate limiting and the pause switch and must be the single place a write is authorized.

### The lexicon is data, not logic

Phrase variants live in a locale-keyed table separate from the matcher. AGENTS.md requires user-visible strings to stay out of domain logic, and the product targets Hindi and Hinglish phrasings from the start. Adding a language is a data edit.

## Risks

- **Lexicon drift.** A phrase table hand-written before launch will miss real phrasings. Mitigated by recording tier and confidence on every resolution so misses are measurable, and by `unknown` degrading to `help` rather than to a wrong write.
- **`track` and `open` overlap.** `SPEC.md` distinguishes them only by duplicate detection. The lexicon keeps them separate, but the product question of whether they should be one command is unresolved and is called out in the tasks.

## Open questions

- Whether `open` should collapse into `track`.
- Which confidence threshold authorizes a write. Deferred to the ingestion change, where rate limits and the pause switch are also decided.
