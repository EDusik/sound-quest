"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AuthUser } from "@/contexts/AuthContext";
import { SignOutIcon, HeartIcon } from "@/components/icons";

export interface UserMenuLabels {
  /** Accessible label for the trigger button (e.g. "John, User menu"). */
  triggerAriaLabel: string;
  /** Fallback when user has no displayName/email (e.g. "User"). */
  userFallback: string;
  /** Support link text (e.g. "Support SoundQuest ❤️"). */
  supportLinkText: string;
  /** Optional tooltip for support link. */
  supportLinkTitle?: string;
  /** Sign out button text. */
  signOutText: string;
  /** Optional "Go to Dashboard" menuitem text. When set, the item is shown. */
  dashboardLinkText?: string;
}

export interface UserMenuProps {
  user: AuthUser;
  onSignOut: () => Promise<void>;
  /** Unique id for the dropdown (aria-controls). */
  menuId: string;
  labels: UserMenuLabels;
  /** When true, dashboard link is shown only in dropdown (e.g. on mobile). Default false. */
  showDashboardInDropdownOnly?: boolean;
}

const TRIGGER_CLASS =
  "flex items-center gap-2 rounded-lg border border-border bg-card/80 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-sm text-foreground min-w-0 hover:bg-card transition-colors";
const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-card transition-colors";
const MENU_PANEL_CLASS =
  "absolute right-0 top-full z-20 mt-1.5 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg";

function getUserDisplay(user: AuthUser, fallback: string): string {
  return user.displayName ?? user.email ?? fallback;
}

export function UserMenu({
  user,
  onSignOut,
  menuId,
  labels,
  showDashboardInDropdownOnly = false,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signOutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    signOutButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const displayName = getUserDisplay(user, labels.userFallback);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={TRIGGER_CLASS}
        aria-label={labels.triggerAriaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft/50 text-xs font-medium text-accent">
            {(displayName || "?")[0].toUpperCase()}
          </span>
        )}
        <span className="max-w-[140px] truncate hidden sm:inline">{displayName}</span>
      </button>
      {open && (
        <div id={menuId} className={MENU_PANEL_CLASS} role="menu">
          <div className="border-b border-border px-3 py-2 text-sm text-muted-foreground" role="none">
            <p className="truncate font-medium text-foreground">{displayName}</p>
            {user.email && user.displayName && <p className="truncate text-xs">{user.email}</p>}
          </div>
          {labels.dashboardLinkText && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={`${MENU_ITEM_CLASS} ${showDashboardInDropdownOnly ? "sm:hidden" : ""}`}
              role="menuitem"
            >
              {labels.dashboardLinkText}
            </Link>
          )}
          <Link
            href="/support"
            onClick={() => setOpen(false)}
            className={MENU_ITEM_CLASS}
            role="menuitem"
            title={labels.supportLinkTitle}
          >
            <HeartIcon className="h-4 w-4 shrink-0" />
            {labels.supportLinkText}
          </Link>
          <button
            ref={signOutButtonRef}
            type="button"
            onClick={async () => {
              setOpen(false);
              await onSignOut();
              window.location.href = "/";
            }}
            className={MENU_ITEM_CLASS}
            role="menuitem"
          >
            <SignOutIcon className="h-4 w-4 shrink-0" />
            {labels.signOutText}
          </button>
        </div>
      )}
    </div>
  );
}
