"use client";

import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitch() {
  const { locale, setLocale, t, ready } = useI18n();

  const nextLocale: Locale = locale === "en" ? "pt" : "en";

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="rounded-lg border border-border bg-card p-2 text-sm font-semibold text-foreground transition hover:bg-border focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      aria-label={t("language.switch")}
      title={locale === "pt" ? t("language.portuguese") : t("language.english")}
    >
      {locale === "en" ? "EN" : "PT"}
    </button>
  );
}
