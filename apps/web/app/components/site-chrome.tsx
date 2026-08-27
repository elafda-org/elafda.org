import { Fragment } from "react";
import Link from "next/link";

import { GitHubStars } from "./github-stars";
import { ThemeToggle } from "./theme-toggle";

export const GITHUB_REPO_URL = "https://github.com/elafda-org/elafda.org";

const NAV_PAGES = [
  { key: "cases", href: "/cases", label: "Cases" },
  { key: "how-it-works", href: "/how-it-works", label: "How it works" },
  { key: "principles", href: "/principles", label: "Principles" },
  { key: "tagged", href: "/tagged", label: "Tagged on X" },
] as const;

export type NavPageKey = (typeof NAV_PAGES)[number]["key"];

const PRODUCT_SIGNALS = [
  "OPEN SOURCE",
  "COMMUNITY GOVERNED",
  "SOURCE BACKED",
  "EARLY ARCHIVE PREVIEW",
];

export function SiteHeader({ active }: { active?: NavPageKey }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="eLafda home">
          <span className="brand-dot" aria-hidden="true" />
          eLafda
        </Link>
        <nav aria-label="Primary navigation">
          {NAV_PAGES.map((page) => (
            <Link
              key={page.key}
              href={page.href}
              aria-current={active === page.key ? "page" : undefined}
            >
              {page.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <ThemeToggle />
          <GitHubStars />
        </div>
      </header>
    </>
  );
}

export function SignalStrip({
  label = "Product status",
  signals = PRODUCT_SIGNALS,
}: {
  label?: string;
  signals?: readonly string[];
}) {
  return (
    <div className="signal-strip" aria-label={label}>
      {signals.map((signal, index) => (
        <Fragment key={signal}>
          {index > 0 && <span aria-hidden="true">✦</span>}
          <span>{signal}</span>
        </Fragment>
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-brand">
        eLafda<span>.</span>
      </div>
      <p>The open-source home of internet lafda.</p>
      <div className="footer-links">
        {NAV_PAGES.map((page) => (
          <Link key={page.key} href={page.href}>
            {page.label}
          </Link>
        ))}
        <a href={GITHUB_REPO_URL} rel="noreferrer">
          GitHub ↗
        </a>
      </div>
      <p className="copyright">© 2026 eLafda · Early preview</p>
    </footer>
  );
}
