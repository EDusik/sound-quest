"use client";

import Link from "next/link";
import { useTranslations } from "@/contexts/I18nContext";

const BRAND = "SoundQuest";

export function Footer() {
  const t = useTranslations();
  const intro = t("footer.supportIntro", { brand: BRAND });
  const parts = intro.split(BRAND);
  const linkText = t("footer.supportLinkText");

  return (
    <footer
      className="mt-auto min-h-[53px] border-t border-(--foreground)/10 py-4"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 text-center text-sm text-(--foreground)/70">
        <span className="sm:inline">
          {parts.length === 2 ? (
            <>
              {parts[0]}
              <span className="font-cinzel font-semibold tracking-wide">
                {BRAND}
              </span>
              {parts[1]}
            </>
          ) : (
            intro
          )}
          <Link
            href="/support"
            className="font-semibold text-primary underline decoration-primary/60 underline-offset-2 transition hover:text-accent hover:decoration-accent dark:text-foreground dark:decoration-(--foreground)/30 dark:hover:text-accent dark:hover:decoration-accent"
            title={t("footer.buyMeACoffeeTitle")}
            aria-label={linkText}
          >
            {linkText}
          </Link>
          .
        </span>
      </div>
    </footer>
  );
}
