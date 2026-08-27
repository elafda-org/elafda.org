"use client";

import { THEME_STORAGE_KEY } from "./theme";

/**
 * Flips between the light and dark palettes. The active theme lives on
 * <html data-theme>; with no attribute the site is light. The knob's
 * position and icon are chosen by CSS from the same state, so this
 * component needs no React state and renders identically on server and
 * client.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the flip still applies.
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle between the light and dark theme"
    >
      <span className="theme-knob" aria-hidden="true">
        <svg
          className="theme-icon-sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4.4" />
          <path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M19.2 4.8l-1.9 1.9M6.7 17.3l-1.9 1.9" />
        </svg>
        <svg className="theme-icon-moon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>
    </button>
  );
}
