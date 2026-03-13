"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { GuestSignInHintTooltip, useGuestHintSeen } from "@/components/layout/GuestSignInHint";
import { UserMenu } from "@/components/layout/UserMenu";
import { SignOutIcon } from "@/components/icons";

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

  const isGuest = !isAuthenticated;

  useEffect(() => {
    if (!isGuest || hasSeenGuestHint) return;
    const id = window.setTimeout(() => setShowGuestHint(true), GUEST_HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [isGuest, hasSeenGuestHint]);

  const handleDismissGuestHint = () => {
    markGuestHintSeen();
    setShowGuestHint(false);
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-background backdrop-blur" role="banner">
      <div className="flex w-full items-center">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 gap-0">
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
          <div className="flex items-center gap-[6px] shrink-0 justify-end">
            <LanguageSwitch />
            <ThemeToggle />
            {isAuthenticated && user ? (
              <UserMenu
                user={user}
                onSignOut={signOut}
                menuId="user-menu"
                labels={{
                  triggerAriaLabel: `${user.displayName ?? user.email ?? t("nav.userFallback")}, ${t("nav.userMenu")}`,
                  userFallback: t("nav.userFallback"),
                  supportLinkText: t("nav.supportSoundQuest"),
                  supportLinkTitle: t("nav.supportSoundQuestTooltip"),
                  signOutText: t("nav.signOut"),
                }}
              />
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
