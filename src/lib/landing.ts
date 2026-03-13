/**
 * Landing page config and utilities.
 * Single source of truth for nav links and scroll behavior.
 */

export const LANDING_PATH = "/" as const;

export const NAV_LINKS = [
  { href: "#features", key: "landing.navFeatures" },
  { href: "#how-it-works", key: "landing.navHowItWorks" },
  { href: "#faq", key: "landing.navFaq" },
] as const;

/**
 * Scrolls the page to the element with id = hash without the leading "#".
 * Updates history with replaceState so the hash appears in the URL.
 */
export function scrollToSection(hash: string): void {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }
}
