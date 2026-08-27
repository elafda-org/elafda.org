import type { Metadata } from "next";

import { SignalStrip, SiteFooter, SiteHeader } from "../components/site-chrome";
import { TaggedFeed } from "./tagged-feed";

export const metadata: Metadata = {
  title: "Tagged on X: eLafda",
  description:
    "Tweets the community has tagged @eLafdaBot to keep an eye on. Unreviewed community tags, not part of any case record.",
};

const TAGGED_SIGNALS = [
  "UNREVIEWED COMMUNITY TAGS",
  "NOT A CASE RECORD",
  "SOURCE REVIEW PENDING",
  "EARLY ARCHIVE PREVIEW",
];

export default function TaggedPage() {
  return (
    <>
      <SiteHeader active="tagged" />
      <SignalStrip label="Page status" signals={TAGGED_SIGNALS} />

      <main id="main-content">
        <section className="tagged-page">
          <p className="eyebrow">
            <span>01</span> Tagged on X
          </p>
          <h1>What the community is flagging.</h1>
          <p className="tagged-deck">
            When someone on X tags{" "}
            <a href="https://x.com/eLafdaBot" rel="noreferrer">
              @eLafdaBot
            </a>
            , the tag lands here. Commentary shows the tweet they replied to,
            an original post shows their own tweet and a reply to the bot shows
            just that reply. Sort and filter the wall below. These are
            unreviewed community tags: nothing on this page has passed source
            review or entered any case record.
          </p>
          <TaggedFeed />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
