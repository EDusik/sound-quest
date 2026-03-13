"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { UserMenu } from "@/components/layout/UserMenu";
import { ScrollToHashLink } from "@/components/landing/ScrollToHashLink";
import { buttonPrimaryNav, linkNavOutline } from "@/components/landing/sectionStyles";
import { NAV_LINKS } from "@/lib/landing";

const NAV_DESKTOP_LINK_CLASS =
  "text-sm font-medium text-foreground/90 transition-colors hover:text-foreground";
const MOBILE_LINK_CLASS = "rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-card";

export function LandingNavbar() {
  const t = useTranslations();
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90 focus-visible:opacity-90"
          aria-label={t("landing.navLogoAria")}
        >
          <SoundQuestLogo size={28} />
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label={t("landing.navAria")}
        >
          {NAV_LINKS.map(({ href, key }) => (
            <ScrollToHashLink key={key} href={href} className={NAV_DESKTOP_LINK_CLASS}>
              {t(key)}
            </ScrollToHashLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <ThemeToggle />
          {isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className={`hidden sm:inline-flex ${buttonPrimaryNav}`}
              >
                {t("landing.navGoToDashboard")}
              </Link>
              <UserMenu
                user={user}
                onSignOut={signOut}
                menuId="landing-user-menu"
                showDashboardInDropdownOnly
                labels={{
                  triggerAriaLabel: `${user.displayName ?? user.email ?? t("nav.userFallback")}, ${t("nav.userMenu")}`,
                  userFallback: t("nav.userFallback"),
                  supportLinkText: t("nav.supportSoundQuest"),
                  supportLinkTitle: t("nav.supportSoundQuestTooltip"),
                  signOutText: t("nav.signOut"),
                  dashboardLinkText: t("landing.navGoToDashboard"),
                }}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`hidden sm:inline-block ${linkNavOutline}`}
              >
                {t("nav.signIn")}
              </Link>
              <Link href="/login" className={buttonPrimaryNav}>
                <span className="sm:hidden">{t("landing.navStart")}</span>
                <span className="hidden sm:inline">{t("landing.navStartFree")}</span>
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-card md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? t("landing.navCloseMenu") : t("landing.navOpenMenu")}
          >
            {mobileMenuOpen ? (
              <span className="text-lg leading-none" aria-hidden>×</span>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-border bg-background md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
        role="navigation"
        aria-label={t("landing.navAria")}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map(({ href, key }) => (
            <ScrollToHashLink
              key={key}
              href={href}
              className={MOBILE_LINK_CLASS}
              onNavigate={() => setMobileMenuOpen(false)}
            >
              {t(key)}
            </ScrollToHashLink>
          ))}
          {isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                {t("landing.navGoToDashboard")}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  window.location.href = "/";
                }}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-card"
              >
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-card"
              >
                {t("nav.signIn")}
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                {t("landing.navStart")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
