"use client";

import { useTranslations } from "@/contexts/I18nContext";

const BRAND = "SoundTable";

export function Footer() {
  const t = useTranslations();
  const supportText = t("footer.support", { brand: BRAND });
  const parts = supportText.split(BRAND);

  return (
    <footer className="mt-auto border-t border-(--foreground)/10 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 text-center text-sm text-(--foreground)/70">
        <span className="sm:inline">
          {parts.length === 2 ? (
            <>
              {parts[0]}
              <span className="font-cinzel font-bold tracking-wide">{BRAND}</span>
              {parts[1]}
            </>
          ) : (
            supportText
          )}
        </span>
        <span className="sm:inline text-(--foreground)/40">·</span>
        <a
          href={`${process.env.PIX_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline decoration-primary/60 underline-offset-2 transition hover:text-accent hover:decoration-accent dark:text-foreground dark:decoration-(--foreground)/30 dark:hover:text-accent dark:hover:decoration-accent"
          title={t("footer.buyMeACoffeeTitle")}
          aria-label={t("footer.buyMeACoffeeAria")}
        >
          {t("footer.buyMeACoffee")}
        </a>
      </div>
    </footer>
  );
}
