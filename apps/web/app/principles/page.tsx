import type { Metadata } from "next";

import { SignalStrip, SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "Principles: eLafda",
  description:
    "The safety commitments behind the archive: attribution, right to reply, privacy and transparent moderation.",
};

export default function PrinciplesPage() {
  return (
    <>
      <SiteHeader active="principles" />
      <SignalStrip />

      <main id="main-content">
        <section className="principles" aria-labelledby="principles-title">
          <div className="principles-title">
            <p className="eyebrow">
              <span>01</span> Receipts, responsibly
            </p>
            <h1 id="principles-title">
              Built for memory.
              <br />
              <em>Designed for restraint.</em>
            </h1>
            <p>Archiving controversy carries real risk. Safety isn’t footer copy; it is part of the product model.</p>
          </div>
          <div className="principle-list">
            <article><span>ATTRIBUTION</span><h3>Allegations stay allegations.</h3><p>We say who alleged what and never turn an investigation, complaint or arrest into a declaration of guilt.</p></article>
            <article><span>RIGHT TO REPLY</span><h3>Responses get equal daylight.</h3><p>Material responses, corrections and contrary evidence appear with comparable prominence.</p></article>
            <article><span>PRIVACY</span><h3>Public interest has boundaries.</h3><p>No doxxing, intimate media, private records or attempts to identify private people from images.</p></article>
            <article><span>TRANSPARENCY</span><h3>Power leaves a paper trail.</h3><p>Canonical edits and moderation decisions are versioned, attributed and open to appeal.</p></article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
