"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Trap focus inside the given container when active (e.g. modal open).
 * Focuses the first focusable element when active becomes true.
 */
export function useFocusTrap(active: boolean, options?: { focusFirst?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const focusFirst = options?.focusFirst !== false;

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const el = containerRef.current;

    const getFocusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));

    const focusables = getFocusables();
    if (focusFirst && focusables.length > 0) {
      focusables[0].focus();
    } else if (focusFirst && el.getAttribute("tabindex") !== undefined) {
      el.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const current = getFocusables();
      if (current.length === 0) return;

      const first = current[0];
      const last = current[current.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [active, focusFirst]);

  return containerRef;
}
