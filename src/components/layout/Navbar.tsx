"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { GuestSignInHintTooltip, useGuestHintSeen } from "@/components/layout/GuestSignInHint";
import { SignOutIcon, HeartIcon } from "@/components/icons";

interface NavbarProps {
  /** Logo content (e.g. <SoundQuestLogo />). If logoHref is set, logo is wrapped in a link. */
  logo: React.ReactNode;
  /** If provided, logo is a link (e.g. to /dashboard). */
  logoHref?: string;
  /** Accessible name for logo link; include visible brand (e.g. "SoundQuest") so label matches content. */
  logoAriaLabel?: string;
}

const GUEST_HINT_DELAY_MS = 600;

export function Navbar({ logo, logoHref, logoAriaLabel }: NavbarProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const t = useTranslations();
  const [hasSeenGuestHint, markGuestHintSeen] = useGuestHintSeen();
  const [showGuestHint, setShowGuestHint] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuListRef = useRef<HTMLDivElement>(null);
  const signOutButtonRef = useRef<HTMLButtonElement>(null);

  const isGuest = !isAuthenticated;

  useEffect(() => {
    if (!isGuest || hasSeenGuestHint) return;
    const id = window.setTimeout(() => setShowGuestHint(true), GUEST_HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [isGuest, hasSeenGuestHint]);

  useEffect(() => {
    if (!userMenuOpen) return;
    signOutButtonRef.current?.focus();
  }, [userMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen]);

  const handleDismissGuestHint = () => {
    markGuestHintSeen();
    setShowGuestHint(false);
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-background backdrop-blur" role="banner">
      <div className="flex w-full items-center">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4">
          <h1 className="text-base font-semibold text-foreground sm:text-xl">
            {logoHref ? (
              <Link
                href={logoHref}
                className="flex items-center gap-1 hover:opacity-90 transition-opacity"
                aria-label={
                  logoAriaLabel
                    ? `${logoAriaLabel}, ${t("nav.backToDashboard")}`
                    : t("nav.backToDashboard")
                }
              >
                {logo}
              </Link>
            ) : (
              logo
            )}
          </h1>
          <div className="flex items-center gap-[6px] shrink-0 min-w-[180px] justify-end">
            <LanguageSwitch />
            <ThemeToggle />
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-sm text-foreground min-w-0 hover:bg-card transition-colors"
                  aria-label={`${user.displayName ?? user.email ?? t("nav.userFallback")}, ${t("nav.userMenu")}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="user-menu"
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
                      {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[140px] truncate hidden sm:inline">
                    {user.displayName ?? user.email ?? t("nav.userFallback")}
                  </span>
                </button>
                {userMenuOpen && (
                  <div
                    id="user-menu"
                    ref={userMenuListRef}
                    className="absolute right-0 top-full z-20 mt-1.5 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg"
                    role="menu"
                  >
                    <div className="border-b border-border px-3 py-2 text-sm text-muted-foreground" role="none">
                      <p className="truncate font-medium text-foreground">
                        {user.displayName ?? user.email ?? t("nav.userFallback")}
                      </p>
                      {user.email && user.displayName && (
                        <p className="truncate text-xs">{user.email}</p>
                      )}
                    </div>
                    <Link
                      href="/support"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-card transition-colors"
                      role="menuitem"
                      title={t("nav.supportSoundQuestTooltip")}
                    >
                      <HeartIcon className="h-4 w-4 shrink-0" />
                      {t("nav.supportSoundQuest")}
                    </Link>
                    <button
                      ref={signOutButtonRef}
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-card transition-colors"
                      role="menuitem"
                    >
                      <SignOutIcon className="h-4 w-4 shrink-0" />
                      {t("nav.signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Link
                  href="/login"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-card sm:h-auto sm:w-auto sm:px-3 sm:py-2.5 sm:text-sm ${isGuest && showGuestHint ? "guest-sign-in-highlight" : ""}`}
                  aria-label={t("nav.signIn")}
                  title={t("nav.signIn")}
                >
                  <span className="sm:hidden" aria-hidden>
                    <SignOutIcon className="h-5 w-5" />
                  </span>
                  <span className="hidden sm:inline">{t("nav.signIn")}</span>
                </Link>
                <GuestSignInHintTooltip
                  visible={isGuest && showGuestHint}
                  onDismiss={handleDismissGuestHint}
                  message={t("nav.guestSignInHint")}
                  dismissLabel={t("nav.guestSignInHintDismiss")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
