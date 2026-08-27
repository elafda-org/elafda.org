import type { Metadata } from "next";

import { SignalStrip, SiteFooter, SiteHeader } from "../components/site-chrome";
import { CaseExplorer } from "./case-explorer";

export const metadata: Metadata = {
  title: "Cases: eLafda",
  description:
    "Search and filter representative case files from the early eLafda archive preview.",
};

export default function CasesPage() {
  return (
    <>
      <SiteHeader active="cases" />
      <SignalStrip />

      <main id="main-content">
        <section className="archive" aria-labelledby="archive-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <span>01</span> Case discovery
              </p>
              <h1 id="archive-title">What’s in the record?</h1>
            </div>
            <p>
              Browse representative case files from the early archive preview.
              Full editorial records will follow the review workflow.
            </p>
          </div>
          <CaseExplorer />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
