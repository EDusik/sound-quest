/**
 * Highlights for nav links: active → accent, inactive → muted (see NAV_LINK_* in components).
 */

function normalizePath(p: string): string {
  let s = p.split("?")[0] || "/";
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

/** Whether `pathname` should highlight a link to `href` (App Router pathnames, no query). */
export function isNavLinkActive(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  const target = normalizePath(href.split("?")[0]);
  if (path === target) return true;
  if (target === "/library") return path === "/library";
  if (target === "/library/defaults" || target === "/library/ai") {
    return path === target || path.startsWith(`${target}/`);
  }
  if (target === "/dashboard") {
    return path === "/dashboard" || path.startsWith("/dashboard/");
  }
  if (target === "/support") {
    return path === "/support" || path.startsWith("/support/");
  }
  if (target === "/login") {
    return path === "/login" || path.startsWith("/login/");
  }
  return false;
}

/** Landing page: anchor nav when we're on `/` and the hash matches (e.g. `#features`). */
export function isLandingHashNavActive(
  pathname: string,
  hash: string,
  linkHref: string,
): boolean {
  const p = normalizePath(pathname);
  if (p !== "/" && p !== "") return false;
  const h = hash || "";
  return h === linkHref;
}

/** Text/icon color for nav links (icons use currentColor). */
export function navLinkTone(active: boolean): string {
  return active
    ? "text-accent font-medium"
    : "text-muted-foreground hover:text-foreground";
}

