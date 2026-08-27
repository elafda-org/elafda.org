"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import Link from "next/link";

import {
  parseFeedEntry,
  sortTaggedEntries,
  type TaggedFeedEntry,
  type TaggedSort,
  type TaggedTweetKind,
} from "../../../../packages/domain/bot/tagged-feed.ts";

/**
 * Served same-origin by the web Worker, which reads tagged records from the
 * bot's KV namespace. The bot Worker itself stays unreachable over HTTP.
 * Sorting and kind filtering happen here, client-side, on the one cached
 * response.
 */
const FEED_URL = "/api/tagged";

const WIDGETS_SCRIPT_ID = "x-widgets-js";
/** The canonical host per X's own oEmbed output. */
const WIDGETS_SCRIPT_SRC = "https://platform.x.com/widgets.js";

/** Visible on each wall entry, so the distinction needs no filter to see. */
const KIND_LABELS: Record<TaggedTweetKind, string> = {
  original: "Original post",
  commentary: "Commentary",
  reply: "Reply to the bot",
};

type KindFilter = "all" | TaggedTweetKind;

const FILTER_LABELS: Record<KindFilter, string> = {
  all: "All tags",
  original: "Original posts",
  commentary: "Commentary",
  reply: "Replies to the bot",
};

const SORT_LABELS: Record<TaggedSort, string> = {
  latest: "Latest",
  mostTagged: "Most tagged",
};

type FeedState =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; entries: TaggedFeedEntry[] };

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (element?: Element | null) => void } };
  }
}

/** The wire-format rules live in the shared domain codec, never here. */
function parseEntries(payload: { tweets?: unknown[] }): TaggedFeedEntry[] {
  return (payload.tweets ?? [])
    .map(parseFeedEntry)
    .filter((entry): entry is TaggedFeedEntry => entry !== null);
}

function useTaggedFeed() {
  const [state, setState] = useState<FeedState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  // Fetch on mount and again whenever a retry bumps the attempt counter.
  // State only settles after the response arrives, so an unmounted (or
  // superseded) request must not report.
  useEffect(() => {
    let stale = false;
    const run = async () => {
      try {
        const response = await fetch(FEED_URL);
        if (!response.ok) {
          throw new Error(`feed responded with ${response.status}`);
        }
        const payload = (await response.json()) as { tweets?: unknown[] };
        if (!stale) {
          setState({ phase: "ready", entries: parseEntries(payload) });
        }
      } catch {
        if (!stale) {
          setState({ phase: "error" });
        }
      }
    };
    void run();
    return () => {
      stale = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ phase: "loading" });
    setAttempt((current) => current + 1);
  };

  return { state, retry };
}

// X's widgets script upgrades each blockquote into a live embed. It scans
// the document once when it first loads; whenever the visible membership
// changes (fetch, retry, filter) the already-present script rescans the
// list. Callers key on order-insensitive ids, since a pure reorder (sort
// toggle) leaves every blockquote already upgraded.
function useEmbedUpgrade(
  listRef: RefObject<HTMLDivElement | null>,
  visibleIds: string,
) {
  useEffect(() => {
    if (visibleIds.length === 0) {
      return;
    }
    if (window.twttr?.widgets?.load) {
      window.twttr.widgets.load(listRef.current);
      return;
    }
    if (!document.getElementById(WIDGETS_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = WIDGETS_SCRIPT_ID;
      script.src = WIDGETS_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [listRef, visibleIds]);
}

function TweetWall({
  entries,
  listRef,
}: {
  entries: TaggedFeedEntry[];
  listRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="tweet-list" ref={listRef}>
      {entries.map((entry) => (
        <div className="tweet-item" key={entry.id}>
          <p className="tweet-kind" data-kind={entry.kind}>
            <span>{KIND_LABELS[entry.kind]}</span>
            {entry.tagCount > 1 && (
              <span className="tweet-count">
                Tagged {entry.tagCount} times
              </span>
            )}
          </p>
          <blockquote className="twitter-tweet" data-dnt="true" data-theme="dark">
            <a href={`https://x.com/i/status/${entry.id}`}>
              View tweet {entry.id} on X
            </a>
          </blockquote>
        </div>
      ))}
    </div>
  );
}

/** The full wall on the /tagged page, with sort and kind-filter controls. */
export function TaggedFeed() {
  const { state, retry } = useTaggedFeed();
  const [sort, setSort] = useState<TaggedSort>("latest");
  const [filter, setFilter] = useState<KindFilter>("all");
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(
    () => (state.phase === "ready" ? state.entries : []),
    [state],
  );
  const visible = useMemo(() => {
    const kept =
      filter === "all" ? entries : entries.filter((entry) => entry.kind === filter);
    return sortTaggedEntries(kept, sort);
  }, [entries, filter, sort]);

  useEmbedUpgrade(listRef, visible.map((entry) => entry.id).sort().join(","));

  const orderingLabel =
    sort === "latest" ? "latest first" : "most tagged first";

  return (
    <div className="tagged-feed">
      {state.phase === "ready" && entries.length > 0 && (
        <div className="tag-toolbar">
          <div className="topic-filters" role="group" aria-label="Sort tags">
            {(Object.keys(SORT_LABELS) as TaggedSort[]).map((option) => (
              <button
                type="button"
                key={option}
                className={sort === option ? "active" : undefined}
                aria-pressed={sort === option}
                onClick={() => setSort(option)}
              >
                {SORT_LABELS[option]}
              </button>
            ))}
          </div>
          <div className="topic-filters" role="group" aria-label="Filter tags by kind">
            {(Object.keys(FILTER_LABELS) as KindFilter[]).map((option) => (
              <button
                type="button"
                key={option}
                className={filter === option ? "active" : undefined}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {FILTER_LABELS[option]}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="result-count" role="status" aria-live="polite">
        {state.phase === "loading" && "Loading tagged tweets…"}
        {state.phase === "error" && "The tag feed is unavailable right now."}
        {state.phase === "ready" &&
          (entries.length === 0 ? (
            "No tagged tweets yet"
          ) : (
            <>
              Showing <strong>{visible.length}</strong> of {entries.length}{" "}
              {entries.length === 1 ? "tagged tweet" : "tagged tweets"},{" "}
              {orderingLabel}
            </>
          ))}
      </p>

      {state.phase === "error" && (
        <div className="empty-state">
          <span aria-hidden="true">!</span>
          <h2>The tag feed is unavailable.</h2>
          <p>The feed did not respond. This is usually temporary.</p>
          <button type="button" className="button button-dark" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {state.phase === "ready" && entries.length === 0 && (
        <div className="empty-state">
          <span aria-hidden="true">∅</span>
          <h2>Nothing has been tagged yet.</h2>
          <p>
            Reply to any tweet on X and tag{" "}
            <a href="https://x.com/eLafdaBot" rel="noreferrer">
              @eLafdaBot
            </a>
            . The tweet you replied to will show up here.
          </p>
        </div>
      )}

      {state.phase === "ready" && entries.length > 0 && visible.length === 0 && (
        <div className="empty-state">
          <span aria-hidden="true">∅</span>
          <h2>No tags of this kind yet.</h2>
          <p>
            Nothing recorded so far is {FILTER_LABELS[filter].toLowerCase()}.
          </p>
          <button
            type="button"
            className="button button-dark"
            onClick={() => setFilter("all")}
          >
            Show all tags
          </button>
        </div>
      )}

      {visible.length > 0 && <TweetWall entries={visible} listRef={listRef} />}
    </div>
  );
}

/**
 * The freshest slice of the wall, for the homepage. Recency only, never
 * bot-conversation chatter: kind `reply` records are exactly what a
 * three-tweet teaser must not spend slots on.
 */
export function TaggedWallTeaser({ count = 3 }: { count?: number }) {
  const { state } = useTaggedFeed();
  const listRef = useRef<HTMLDivElement>(null);

  const teaser = useMemo(
    () =>
      state.phase === "ready"
        ? sortTaggedEntries(
            state.entries.filter((entry) => entry.kind !== "reply"),
            "latest",
          ).slice(0, count)
        : [],
    [state, count],
  );

  useEmbedUpgrade(listRef, teaser.map((entry) => entry.id).sort().join(","));

  if (teaser.length > 0) {
    return (
      <div className="tagged-feed tagged-teaser">
        <TweetWall entries={teaser} listRef={listRef} />
      </div>
    );
  }

  return (
    <p className="wall-note" role="status">
      {state.phase === "loading" && "Loading the latest tags…"}
      {state.phase === "error" && "The tag feed is unavailable right now."}
      {state.phase === "ready" &&
        (state.entries.length > 0 ? (
          // Everything recent is bot-conversation chatter the teaser skips;
          // claiming the wall is empty here would contradict /tagged.
          <>
            The newest tags are replies to the bot. See everything on{" "}
            <Link href="/tagged">the tagged wall</Link>.
          </>
        ) : (
          <>
            Nothing tagged yet. Reply to any tweet on X and tag{" "}
            <a href="https://x.com/eLafdaBot" rel="noreferrer">
              @eLafdaBot
            </a>{" "}
            to start the wall.
          </>
        ))}
    </p>
  );
}
