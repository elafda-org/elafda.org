import Link from "next/link";

import {
  GITHUB_REPO_URL,
  SignalStrip,
  SiteFooter,
  SiteHeader,
} from "./components/site-chrome";
import { TaggedWallTeaser } from "./tagged/tagged-feed";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <SignalStrip />

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <span>01</span> The public memory of Indian internet culture
            </p>
            <h1>
              Internet forgets.
              <br />
              <em>Receipts shouldn’t.</em>
            </h1>
            <p className="hero-deck">
              Follow the conversation, inspect the evidence and preserve what
              actually happened without confusing popularity for truth.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" href="/cases">
                Browse the cases <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="/how-it-works">
                See how verification works <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hero-proof" aria-label="Archive preview facts">
              <div>
                <strong>2 layers</strong>
                <span>discussion + record</span>
              </div>
              <div>
                <strong>Every edit</strong>
                <span>publicly traceable</span>
              </div>
              <div>
                <strong>Zero votes</strong>
                <span>treated as proof</span>
              </div>
            </div>
          </div>

          <aside className="hero-file" aria-label="Example case file">
            <div className="file-tab">CASE FILE / PREVIEW</div>
            <div className="file-meta">
              <span>ELF-2026-0021</span>
              <span className="status-pill">
                <i /> DEVELOPING
              </span>
            </div>
            <p className="file-label">LATEST VERIFIED UPDATE</p>
            <h2>Public statement adds context to the original campaign terms.</h2>
            <div className="timeline-line" aria-hidden="true">
              <span />
              <span />
              <span />
              <span className="active" />
            </div>
            <div className="evidence-stamp">
              <span className="stamp-mark">✓</span>
              <div>
                <strong>SOURCE REVIEWED</strong>
                <small>2 primary · 3 secondary</small>
              </div>
            </div>
            <p className="file-note">
              Representative interface content, not a published allegation.
            </p>
          </aside>
        </section>

        <section className="tag-wall-preview" aria-labelledby="wall-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <span>02</span> Tagged on X
              </p>
              <h2 id="wall-title">Fresh on the wall.</h2>
            </div>
            <p>
              The latest tweets the community has flagged with{" "}
              <a href="https://x.com/eLafdaBot" rel="noreferrer">
                @eLafdaBot
              </a>
              . Unreviewed, not part of any case record.{" "}
              <Link className="text-link" href="/tagged">
                See the full wall <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
          <TaggedWallTeaser count={3} />
        </section>

        <section className="closing">
          <div>
            <p className="eyebrow light">
              <span>03</span> The archive is opening
            </p>
            <h2>
              Help the internet
              <br />
              remember better.
            </h2>
          </div>
          <div className="closing-copy">
            <p>
              eLafda is open source and in active development. The first archive
              will focus on Indian Tech Twitter while the review and moderation
              systems take shape.
            </p>
            <a className="button button-lime" href={GITHUB_REPO_URL} rel="noreferrer">
              Follow the build <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
