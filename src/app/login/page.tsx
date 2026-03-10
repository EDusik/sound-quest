"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 w-full shrink-0 border-b border-border bg-background py-3" role="banner">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:opacity-90 transition-opacity"
            aria-label={`${t("brand.name")}, ${t("nav.backToDashboard")}`}
          >
            <SoundQuestLogo size={28} className="text-lg" />
          </Link>
          <div className="flex items-center gap-[6px] shrink-0">
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 shadow-xl">
        <h1 className="flex justify-center text-foreground" aria-label={t("brand.name")}>
          <SoundQuestLogo size={44} className="text-3xl" />
        </h1>
        <p className="text-center text-lg text-muted mt-2">
          {t("login.tagline")}
        </p>
        {!isConfigured && (
          <p className="mt-4 rounded-lg bg-accent-soft/30 p-3 text-sm text-accent" role="alert">
            {t("login.demoNotice")}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={!isConfigured}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-card px-4 py-3 text-sm text-foreground transition hover:bg-border disabled:opacity-50 disabled:hover:bg-card"
          aria-label={t("login.signInWithGoogle")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
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
              className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition hover:bg-card"
              aria-label={t("login.continueLocalStorageAria")}
            >
              {t("login.continueLocalStorage")}
            </button>
            <p className="mt-4 text-center text-xs text-muted">
              {t("login.addSupabaseEnv")}
            </p>
          </>
        )}
        {isConfigured && !isAuthenticated && (
          <p className="mt-4 text-center text-sm text-muted">
            <Link
              href="/dashboard"
              className="text-accent underline hover:text-accent-hover"
            >
              {t("login.continueAsGuest")}
            </Link>
          </p>
        )}
        {isAuthenticated && (
          <p className="mt-6 text-center text-sm text-muted">
            {t("login.alreadySignedIn")}{" "}
            <Link
              href="/dashboard"
              className="text-accent underline hover:text-accent-hover"
            >
              {t("login.goToDashboard")}
            </Link>
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
