"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isNavLinkActive, navLinkTone } from "@/lib/nav-link-active";
import { useTranslations } from "@/contexts/I18nContext";
import { useAdminFeatures } from "@/hooks/api";
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
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const { showAudioLibraryNav, showMyAudioLibraryLink } = useAdminFeatures();
  const t = useTranslations();
  const defaultsActive = isNavLinkActive(pathname, "/library/defaults");
  const loginActive = isNavLinkActive(pathname, "/login");
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
            <Link
              href="/library/defaults"
              aria-current={defaultsActive ? "page" : undefined}
              className={`inline-flex max-w-[8rem] items-center truncate rounded-lg border px-2 py-1.5 text-xs transition-colors sm:max-w-none sm:px-3 sm:py-2 sm:text-sm ${
                defaultsActive ? "border-accent/40 bg-accent/5" : "border-border"
              } ${navLinkTone(defaultsActive)}`}
            >
              <span className="truncate">{t("nav.defaultAudios")}</span>
            </Link>
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
                  defaultAudiosLinkText: t("nav.defaultAudios"),
                  ...(showMyAudioLibraryLink
                    ? { audioLibraryLinkText: t("nav.audioLibrary") }
                    : {}),
                  ...(showAudioLibraryNav
                    ? { audioLibraryAiLinkText: t("nav.aiAudioSearch") }
                    : {}),
                }}
              />
            ) : (
              <div className="relative">
                <Link
                  href="/login"
                  aria-current={loginActive ? "page" : undefined}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border transition-colors sm:h-auto sm:w-auto sm:px-3 sm:py-2.5 sm:text-sm ${navLinkTone(loginActive)} ${isGuest && showGuestHint ? "guest-sign-in-highlight" : ""}`}
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
