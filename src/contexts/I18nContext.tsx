"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  type Locale,
  type Translations,
  getInitialLocale,
  storeLocale,
} from "@/lib/utils/i18n";

// Lazy-load translations to keep initial bundle smaller
const localeModules: Record<Locale, () => Promise<{ default: Translations }>> = {
  en: () => import("@/locales/en.json").then((m) => ({ default: m as unknown as Translations })),
  pt: () => import("@/locales/pt.json").then((m) => ({ default: m as unknown as Translations })),
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    text,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [ready, setReady] = useState(false);

  // Load translations for initial locale on mount
  useEffect(() => {
    localeModules[locale]()
      .then((m) => {
        setTranslations(m.default);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [locale]);

  // When locale changes, load new translations and persist
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    storeLocale(newLocale);
    localeModules[newLocale]()
      .then((m) => setTranslations(m.default))
      .catch(() => {});
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale === "pt" ? "pt-BR" : "en";
    }
  }, []);

  // Update document lang when translations are first ready
  useEffect(() => {
    if (!ready || typeof document === "undefined") return;
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [ready, locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const text = translations?.[key] ?? key;
      return interpolate(text, params);
    },
    [translations],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useTranslations() {
  return useI18n().t;
}
