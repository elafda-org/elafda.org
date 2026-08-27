import type { Metadata } from "next";

import { SignalStrip, SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "How it works: eLafda",
  description:
    "How eLafda separates community discussion from the reviewed canonical record, from nomination to a preserved timeline.",
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader active="how-it-works" />
      <SignalStrip />

      <main id="main-content">
        <section className="two-layers" aria-labelledby="layers-title">
          <div className="layers-intro">
            <p className="eyebrow light">
              <span>01</span> One controversy, two layers
            </p>
            <h1 id="layers-title">
              Conversation is loud.
              <br />
              <em>The record is careful.</em>
            </h1>
            <p>eLafda gives both a place to exist without pretending they are the same thing.</p>
          </div>
          <div className="layer-card discussion-layer">
            <span className="layer-index">A</span>
            <p className="layer-label">COMMUNITY DISCUSSION</p>
            <h3>People react, debate, question and add context.</h3>
            <ul>
              <li><span>↗</span> Opinions and analysis</li>
              <li><span>↗</span> Questions and firsthand accounts</li>
              <li><span>↗</span> Votes shape discovery, not truth</li>
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
              <p className="eyebrow">
                <span>02</span> Built in public
              </p>
              <h2 id="process-title">
                From “did you see this?”
                <br />
                to a durable record.
              </h2>
            </div>
          </div>
          <ol className="process-list">
            <li><span>01</span><div><h3>Nominate</h3><p>Share a thread, source or missing update through the web or by tagging the bot.</p></div></li>
            <li><span>02</span><div><h3>Source</h3><p>Separate fact, allegation, opinion and satire. Attach lawful primary evidence.</p></div></li>
            <li><span>03</span><div><h3>Review</h3><p>Contributors check duplicates; archivists review wording, relevance and support.</p></div></li>
            <li><span>04</span><div><h3>Preserve</h3><p>Accepted events join a versioned timeline with attribution and a public change trail.</p></div></li>
          </ol>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
