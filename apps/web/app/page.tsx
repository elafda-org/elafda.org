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
      "A public disagreement over campaign terms, payment schedules, and what collaborators say was promised.",
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
      "Researchers and builders debated dataset provenance, credit, and the language used in a launch announcement.",
    topic: "AI",
    status: "Resolved",
    sources: 31,
    updates: 15,
    updated: "2w ago",
    accent: "violet",
  },
];

const topics = ["All topics", "Creator economy", "Open source", "Media", "AI"] as const;

export default function Home() {
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
    <main>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="eLafda home">
          <span className="brand-dot" aria-hidden="true" />
          eLafda
        </a>
        <nav aria-label="Primary navigation">
          <a href="#archive">Cases</a>
          <a href="#how-it-works">How it works</a>
          <a href="#principles">Principles</a>
        </nav>
        <a className="header-cta" href="#archive">
          Explore archive <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="signal-strip" aria-label="Product status">
        <span>OPEN SOURCE</span>
        <span aria-hidden="true">✦</span>
        <span>COMMUNITY GOVERNED</span>
        <span aria-hidden="true">✦</span>
        <span>SOURCE BACKED</span>
        <span aria-hidden="true">✦</span>
        <span>EARLY ARCHIVE PREVIEW</span>
      </div>

      <section className="hero" id="top">
        <div className="hero-copy" id="main-content">
          <p className="eyebrow"><span>01</span> The public memory of Indian internet culture</p>
          <h1>
            Internet forgets.
            <br />
            <em>Receipts shouldn’t.</em>
          </h1>
          <p className="hero-deck">
            Follow the conversation, inspect the evidence, and preserve what actually happened—without confusing popularity for truth.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#archive">
              Browse the cases <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="#how-it-works">
              See how verification works <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-proof" aria-label="Archive preview facts">
            <div><strong>2 layers</strong><span>discussion + record</span></div>
            <div><strong>Every edit</strong><span>publicly traceable</span></div>
            <div><strong>Zero votes</strong><span>treated as proof</span></div>
          </div>
        </div>

        <aside className="hero-file" aria-label="Example case file">
          <div className="file-tab">CASE FILE / PREVIEW</div>
          <div className="file-meta">
            <span>ELF-2026-0021</span>
            <span className="status-pill"><i /> DEVELOPING</span>
          </div>
          <p className="file-label">LATEST VERIFIED UPDATE</p>
          <h2>Public statement adds context to the original campaign terms.</h2>
          <div className="timeline-line" aria-hidden="true">
            <span /><span /><span /><span className="active" />
          </div>
          <div className="evidence-stamp">
            <span className="stamp-mark">✓</span>
            <div><strong>SOURCE REVIEWED</strong><small>2 primary · 3 secondary</small></div>
          </div>
          <p className="file-note">Representative interface content—not a published allegation.</p>
        </aside>
      </section>

      <section className="archive" id="archive" aria-labelledby="archive-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span>02</span> Case discovery</p>
            <h2 id="archive-title">What’s in the record?</h2>
          </div>
          <p>Browse representative case files from the early archive preview. Full editorial records will follow the review workflow.</p>
        </div>

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
      </section>

      <section className="two-layers" id="how-it-works" aria-labelledby="layers-title">
        <div className="layers-intro">
          <p className="eyebrow light"><span>03</span> One controversy, two layers</p>
          <h2 id="layers-title">Conversation is loud.<br /><em>The record is careful.</em></h2>
          <p>eLafda gives both a place to exist without pretending they are the same thing.</p>
        </div>
        <div className="layer-card discussion-layer">
          <span className="layer-index">A</span>
          <p className="layer-label">COMMUNITY DISCUSSION</p>
          <h3>People react, debate, question, and add context.</h3>
          <ul>
            <li><span>↗</span> Opinions and analysis</li>
            <li><span>↗</span> Questions and firsthand accounts</li>
            <li><span>↗</span> Votes shape discovery—not truth</li>
          </ul>
          <p className="layer-rule">OPEN WITHIN POLICY</p>
        </div>
        <div className="layer-card record-layer">
          <span className="layer-index">B</span>
          <p className="layer-label">CANONICAL RECORD</p>
          <h3>Claims enter the timeline only after sources and wording pass review.</h3>
          <ul>
            <li><span>✓</span> Neutral, attributed wording</li>
            <li><span>✓</span> Evidence attached to every claim</li>
            <li><span>✓</span> Corrections and revisions preserved</li>
          </ul>
          <p className="layer-rule">REVIEWED BEFORE PUBLISHING</p>
        </div>
      </section>

      <section className="process" aria-labelledby="process-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow"><span>04</span> Built in public</p>
            <h2 id="process-title">From “did you see this?”<br />to a durable record.</h2>
          </div>
        </div>
        <ol className="process-list">
          <li><span>01</span><div><h3>Nominate</h3><p>Share a thread, source, or missing update through the web—or eventually tag the bot.</p></div></li>
          <li><span>02</span><div><h3>Source</h3><p>Separate fact, allegation, opinion, and satire. Attach lawful primary evidence.</p></div></li>
          <li><span>03</span><div><h3>Review</h3><p>Contributors check duplicates; archivists review wording, relevance, and support.</p></div></li>
          <li><span>04</span><div><h3>Preserve</h3><p>Accepted events join a versioned timeline with attribution and a public change trail.</p></div></li>
        </ol>
      </section>

      <section className="principles" id="principles" aria-labelledby="principles-title">
        <div className="principles-title">
          <p className="eyebrow"><span>05</span> Receipts, responsibly</p>
          <h2 id="principles-title">Built for memory.<br /><em>Designed for restraint.</em></h2>
          <p>Archiving controversy carries real risk. Safety isn’t footer copy—it is part of the product model.</p>
        </div>
        <div className="principle-list">
          <article><span>ATTRIBUTION</span><h3>Allegations stay allegations.</h3><p>We say who alleged what and never turn an investigation, complaint, or arrest into a declaration of guilt.</p></article>
          <article><span>RIGHT TO REPLY</span><h3>Responses get equal daylight.</h3><p>Material responses, corrections, and contrary evidence appear with comparable prominence.</p></article>
          <article><span>PRIVACY</span><h3>Public interest has boundaries.</h3><p>No doxxing, intimate media, private records, or attempts to identify private people from images.</p></article>
          <article><span>TRANSPARENCY</span><h3>Power leaves a paper trail.</h3><p>Canonical edits and moderation decisions are versioned, attributed, and open to appeal.</p></article>
        </div>
      </section>

      <section className="closing">
        <div>
          <p className="eyebrow light"><span>06</span> The archive is opening</p>
          <h2>Help the internet<br />remember better.</h2>
        </div>
        <div className="closing-copy">
          <p>eLafda is open source and in active development. The first archive will focus on Indian Tech Twitter while the review and moderation systems take shape.</p>
          <a className="button button-lime" href="https://github.com/elafda" rel="noreferrer">Follow the build <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer>
        <div className="footer-brand">eLafda<span>.</span></div>
        <p>The open-source home of internet lafda.</p>
        <div className="footer-links">
          <a href="#archive">Cases</a>
          <a href="#how-it-works">How it works</a>
          <a href="#principles">Principles</a>
          <a href="https://github.com/elafda" rel="noreferrer">GitHub ↗</a>
        </div>
        <p className="copyright">© 2026 eLafda · Early preview</p>
      </footer>
    </main>
  );
}
