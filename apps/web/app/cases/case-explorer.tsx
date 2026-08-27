"use client";

import { useMemo, useState } from "react";

type CasePreview = {
  id: string;
  title: string;
  summary: string;
  topic: "Creator economy" | "Open source" | "Media" | "AI";
  status: "Developing" | "Resolved" | "Dormant";
  sources: number;
  updates: number;
  updated: string;
  accent: "coral" | "lime" | "blue" | "violet";
};

const cases: CasePreview[] = [
  {
    id: "ELF-2026-0021",
    title: "Creator collective revenue-share dispute",
    summary:
      "A public disagreement over campaign terms, payment schedules and what collaborators say was promised.",
    topic: "Creator economy",
    status: "Developing",
    sources: 14,
    updates: 8,
    updated: "2h ago",
    accent: "coral",
  },
  {
    id: "ELF-2026-0018",
    title: "Open-source maintainer access dispute",
    summary:
      "A project handover sparked competing accounts about repository control and contributor attribution.",
    topic: "Open source",
    status: "Resolved",
    sources: 23,
    updates: 12,
    updated: "Yesterday",
    accent: "lime",
  },
  {
    id: "ELF-2026-0013",
    title: "Conference sponsorship disclosure debate",
    summary:
      "Community questions about sponsor visibility led organizers to publish a revised disclosure policy.",
    topic: "Media",
    status: "Dormant",
    sources: 9,
    updates: 6,
    updated: "6d ago",
    accent: "blue",
  },
  {
    id: "ELF-2026-0009",
    title: "AI benchmark attribution controversy",
    summary:
      "Researchers and builders debated dataset provenance, credit and the language used in a launch announcement.",
    topic: "AI",
    status: "Resolved",
    sources: 31,
    updates: 15,
    updated: "2w ago",
    accent: "violet",
  },
];

const topics = ["All topics", "Creator economy", "Open source", "Media", "AI"] as const;

export function CaseExplorer() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<(typeof topics)[number]>("All topics");

  const filteredCases = useMemo(() => {
    const term = query.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesTopic = topic === "All topics" || item.topic === topic;
      const matchesQuery =
        !term ||
        `${item.title} ${item.summary} ${item.topic} ${item.id}`.toLowerCase().includes(term);
      return matchesTopic && matchesQuery;
    });
  }, [query, topic]);

  const resetFilters = () => {
    setQuery("");
    setTopic("All topics");
  };

  return (
    <>
      <div className="archive-tools">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search preview cases</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, topics, case IDs…"
            type="search"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </label>
        <div className="topic-filters" aria-label="Filter by topic">
          {topics.map((item) => (
            <button
              key={item}
              type="button"
              className={topic === item ? "active" : ""}
              aria-pressed={topic === item}
              onClick={() => setTopic(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count" aria-live="polite">
        Showing <strong>{filteredCases.length}</strong> of {cases.length} preview cases
      </p>

      {filteredCases.length > 0 ? (
        <div className="case-grid">
          {filteredCases.map((item, index) => (
            <article className={`case-card accent-${item.accent}`} key={item.id}>
              <div className="case-number" aria-hidden="true">0{index + 1}</div>
              <div className="case-card-meta">
                <span>{item.id}</span>
                <span className={`case-status status-${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <p className="case-topic">{item.topic}</p>
              <h3>{item.title}</h3>
              <p className="case-summary">{item.summary}</p>
              <dl className="case-stats">
                <div><dt>Sources</dt><dd>{item.sources}</dd></div>
                <div><dt>Updates</dt><dd>{item.updates}</dd></div>
                <div><dt>Last checked</dt><dd>{item.updated}</dd></div>
              </dl>
              <div className="case-foot">
                <span><i aria-hidden="true" /> Evidence-linked</span>
                <span aria-hidden="true">↗</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">∅</span>
          <h3>No case files match that search.</h3>
          <p>Try a broader term or return to all preview topics.</p>
          <button type="button" className="button button-dark" onClick={resetFilters}>Clear filters</button>
        </div>
      )}
    </>
  );
}
