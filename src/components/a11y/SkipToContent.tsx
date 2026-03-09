"use client";

import { useTranslations } from "@/contexts/I18nContext";

export function SkipToContent() {
  const t = useTranslations();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-background focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      {t("common.skipToContent")}
    </a>
  );
}
