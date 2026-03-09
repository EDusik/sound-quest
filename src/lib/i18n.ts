/**
 * i18n configuration and types.
 * Locale is stored in localStorage and applied on load; default is English.
 */

export const LOCALE_STORAGE_KEY = "soundtable-locale";

export type Locale = "en" | "pt";

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: Locale[] = ["en", "pt"];

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (raw === "en" || raw === "pt") return raw;
  return null;
}

export function storeLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

/** Resolve initial locale: stored value or default. */
export function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return getStoredLocale() ?? DEFAULT_LOCALE;
}

export type Translations = Record<string, string>;
