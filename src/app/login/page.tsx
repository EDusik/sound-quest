"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { buttonSecondary } from "@/components/landing/sectionStyles";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";

export default function LoginPage() {
  const t = useTranslations();
  const {
    isAuthenticated,
    loading,
    signInWithGoogle,
    signInDemo,
    isConfigured,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      alert(t("login.signInFailed"));
    }
  };

  const handleSignInDemo = () => {
    signInDemo();
    router.replace("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div
          className="h-10 w-10 animate-pulse rounded-full bg-primary/25 ring-4 ring-primary/10"
          aria-hidden
        />
        <p className="sr-only">{t("nav.signIn")}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-88 w-88 rounded-full bg-accent/25 blur-3xl dark:bg-accent/22" />
        <div className="absolute -bottom-32 -right-20 h-104 w-104 rounded-full bg-accent/18 blur-3xl dark:bg-accent/14" />
        <div className="absolute left-1/2 top-[20%] h-48 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-accent/12 blur-[80px] dark:bg-accent/10" />
      </div>

      <header
        className="sticky top-0 z-20 w-full shrink-0 border-b border-border/70 bg-background/80 py-3 backdrop-blur-md supports-backdrop-filter:bg-background/60"
        role="banner"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${t("brand.name")}, ${t("nav.backToDashboard")}`}
          >
            <SoundQuestLogo size={28} className="text-lg" />
          </Link>
          <div className="flex shrink-0 items-center gap-[6px]">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-accent/30 bg-card/75 p-8 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-accent/35 dark:bg-card/55 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] sm:p-10">
          <div
            className="absolute inset-x-8 top-0 h-px rounded-full bg-linear-to-r from-transparent via-accent/45 to-transparent"
            aria-hidden
          />

          <div className="flex flex-col items-center text-center">
            <p className="font-cinzel text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {t("nav.signIn")}
            </p>
            <h1
              className="mt-3 flex justify-center text-foreground"
              aria-label={t("brand.name")}
            >
              <SoundQuestLogo size={52} className="text-3xl sm:text-4xl" />
            </h1>
            <p className="mt-4 max-w-[340px] text-base leading-relaxed text-muted sm:text-[1.05rem]">
              {t("login.tagline")}
            </p>
          </div>

          {!isConfigured && (
            <p
              className="mt-6 rounded-2xl border border-accent/20 bg-accent-soft/25 p-4 text-sm leading-snug text-foreground dark:border-accent/30 dark:bg-accent/10 dark:text-accent-soft"
              role="alert"
            >
              {t("login.demoNotice")}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={!isConfigured}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/90 bg-white px-4 py-3.5 text-sm font-medium text-foreground shadow-sm transition hover:border-border hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none dark:border-border dark:bg-card dark:hover:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label={t("login.signInWithGoogle")}
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("login.signInWithGoogle")}
            </button>

            {!isConfigured && (
              <>
                <button
                  type="button"
                  onClick={handleSignInDemo}
                  className={`${buttonSecondary} w-full rounded-xl py-3.5 text-sm`}
                  aria-label={t("login.continueLocalStorageAria")}
                >
                  {t("login.continueLocalStorage")}
                </button>
                <p className="text-center text-xs leading-relaxed text-muted">
                  {t("login.addSupabaseEnv")}
                </p>
              </>
            )}
          </div>

          {isConfigured && !isAuthenticated && (
            <p className="mt-8 border-t border-border/60 pt-6 text-center text-sm text-muted">
              <Link
                href="/dashboard"
                className="font-medium text-accent underline decoration-accent/30 underline-offset-4 transition hover:text-accent-hover hover:decoration-accent-hover"
              >
                {t("login.continueAsGuest")}
              </Link>
            </p>
          )}

          {isAuthenticated && (
            <p className="mt-8 border-t border-border/60 pt-6 text-center text-sm text-muted">
              {t("login.alreadySignedIn")}{" "}
              <Link
                href="/dashboard"
                className="font-medium text-accent underline decoration-accent/30 underline-offset-4 transition hover:text-accent-hover hover:decoration-accent-hover"
              >
                {t("login.goToDashboard")}
              </Link>
            </p>
          )}

          <p className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs font-medium text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
            >
              {t("landing.plansBackToHome")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
