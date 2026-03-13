/**
 * Shared class names for landing sections and CTAs.
 * Use with Link/button so styles stay consistent and easy to change.
 */

/** Primary CTA: solid background (accent). */
export const buttonPrimary =
  "inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Smaller primary for nav (e.g. "Start Free"). */
export const buttonPrimaryNav =
  "rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Secondary: outline/border. */
export const buttonSecondary =
  "inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Nav link style (e.g. "Sign in" without emphasis). */
export const linkNavOutline =
  "rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
