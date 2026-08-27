"use client";

import { useEffect, useState } from "react";

const REPO_URL = "https://github.com/elafda-org/elafda.org";
const REPO_API_URL = "https://api.github.com/repos/elafda-org/elafda.org";

function formatStars(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  const rounded =
    thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
  return `${rounded}k`;
}

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(REPO_API_URL, {
      signal: controller.signal,
      headers: { accept: "application/vnd.github+json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((repo: { stargazers_count?: unknown } | null) => {
        if (typeof repo?.stargazers_count === "number") {
          setStars(repo.stargazers_count);
        }
      })
      // The count is decoration: offline, rate-limited or blocked requests
      // must leave the plain repository link with no error state.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <a
      className="github-link"
      href={REPO_URL}
      rel="noreferrer"
      aria-label={
        stars === null
          ? "eLafda on GitHub"
          : `eLafda on GitHub, ${stars} ${stars === 1 ? "star" : "stars"}`
      }
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="github-mark">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      {stars === null ? (
        "GitHub"
      ) : (
        <>
          <span className="github-count">{formatStars(stars)}</span>
          <span className="github-star" aria-hidden="true">
            ★
          </span>
        </>
      )}
    </a>
  );
}
