"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "soundquest-guest-hint-seen";

function getInitialHasSeen(): boolean {
  if (typeof window === "undefined") return true; // avoid flash during SSR
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Returns whether the guest hint was already seen this session and a function to mark it seen. Uses sessionStorage so the hint shows again when the user closes the site. */
export function useGuestHintSeen(): [boolean, () => void] {
  const [hasSeen, setHasSeen] = useState(getInitialHasSeen);

  const markSeen = useCallback(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setHasSeen(true);
    } catch {
      setHasSeen(true);
    }
  }, []);

  return [hasSeen, markSeen];
}

export interface GuestSignInHintTooltipProps {
  /** Whether the tooltip is visible. */
  visible: boolean;
  /** Called when the user dismisses the tooltip. */
  onDismiss: () => void;
  /** Main message (e.g. sign in to save permanently, guest = localStorage). */
  message: string;
  /** Dismiss button label. */
  dismissLabel: string;
}

/**
 * Tooltip shown near the Sign In button for guests. Desktop: to the left of the button;
 * mobile: below, aligned left. Parent must be position: relative.
 */
export function GuestSignInHintTooltip({
  visible,
  onDismiss,
  message,
  dismissLabel,
}: GuestSignInHintTooltipProps) {
  if (!visible) return null;

  return (
    <div
      role="tooltip"
      className="absolute right-0 top-full z-20 mt-2 w-[min(200px,calc(100vw-2rem))] guest-hint-tooltip-enter rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-lg sm:w-[min(280px,calc(100vw-2rem))] sm:right-auto sm:left-auto sm:right-full sm:top-0 sm:mt-0 sm:mr-2"
      aria-live="polite"
    >
      <p className="mb-2 text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md bg-accent/15 px-2.5 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/25 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        aria-label={dismissLabel}
      >
        {dismissLabel}
      </button>
    </div>
  );
}
