"use client";

import { scrollToSection } from "@/lib/landing";

type ScrollToHashLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Called after scroll (e.g. close mobile menu). */
  onNavigate?: () => void;
  "aria-current"?: React.AriaAttributes["aria-current"];
};

/**
 * Link that scrolls to the in-page section instead of navigating.
 * Use for landing nav and footer anchor links.
 */
export function ScrollToHashLink({
  href,
  children,
  className,
  onNavigate,
  "aria-current": ariaCurrent,
}: ScrollToHashLinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        scrollToSection(href);
        onNavigate?.();
      }}
      className={className}
      aria-current={ariaCurrent}
    >
      {children}
    </a>
  );
}
