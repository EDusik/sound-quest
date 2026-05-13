"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { HeartIcon } from "@/components/icons";
import { Navbar } from "@/components/layout/Navbar";
import { PixDonationCard } from "@/features/donations/components/PixDonationCard";
import { useTranslations } from "@/contexts/I18nContext";
import { env } from "@/lib/env";

export default function SupportPage() {
  const t = useTranslations();
  const [contentHeight, setContentHeight] = useState<string>("100dvh");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      const footer = document.querySelector("footer");
      const navH = nav?.offsetHeight ?? 0;
      const footerH = footer?.offsetHeight ?? 0;
      setContentHeight(`calc(100dvh - ${navH}px - ${footerH}px)`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (navRef.current) ro.observe(navRef.current);
    const footer = document.querySelector("footer");
    if (footer) ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  const panelClass =
    "flex h-full min-h-0 flex-col rounded-2xl border border-border/80 bg-card/70 p-6 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md sm:p-7 dark:border-border/70 dark:bg-card/45 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)]";

  return (
    <div className="relative flex flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-88 w-88 rounded-full bg-accent/25 blur-3xl dark:bg-accent/22" />
        <div className="absolute -bottom-32 -right-20 h-104 w-104 rounded-full bg-accent/18 blur-3xl dark:bg-accent/14" />
        <div className="absolute left-1/2 top-[20%] h-48 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-accent/12 blur-[80px] dark:bg-accent/10" />
      </div>
      <div ref={navRef} className="relative z-20 shrink-0">
        <Navbar
          logo={<SoundQuestLogo size={28} className="text-lg" />}
          logoHref="/dashboard"
          logoAriaLabel={t("brand.name")}
        />
      </div>
      <div
        className="relative z-10 w-full shrink-0 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:py-9"
        style={{ height: contentHeight, minHeight: 0 }}
      >
        <div className="flex min-h-full flex-col justify-center">
          <div className="mx-auto w-full max-w-5xl">
            <h1 className="mb-4 flex w-full flex-wrap items-center justify-center gap-1.5 text-center text-xl font-medium tracking-wide text-foreground sm:mb-5 sm:gap-2 sm:text-2xl">
              <span>{t("support.titlePrefix")}</span>
              <span className="font-cinzel font-bold">{t("brand.name")}</span>
              <HeartIcon className="h-[0.95em] w-[0.95em] shrink-0 text-rose-500 dark:text-rose-400 sm:h-[1em] sm:w-[1em]" />
            </h1>
            <p className="mx-auto mb-6 w-[60%] text-pretty text-center text-sm leading-snug text-muted-foreground lg:mb-8">
              {t("support.intro")}
            </p>

            <div className="grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
              <section
                className={panelClass}
                aria-labelledby="support-stripe-heading"
              >
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-accent shadow-sm dark:bg-muted/25">
                    <CreditCard className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h2
                      id="support-stripe-heading"
                      className="text-base font-semibold tracking-wide text-foreground"
                    >
                      {t("support.stripeSectionTitle")}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("support.stripeSectionIntro")}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                  <a
                    href={env.NEXT_PUBLIC_STRIPE_URL ?? ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/90 bg-background/80 px-4 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-accent/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:border-border dark:bg-background/40"
                    aria-label={t("support.payWithCardAria")}
                  >
                    <CreditCard
                      className="h-4 w-4 shrink-0 opacity-80"
                      aria-hidden
                    />
                    {t("support.payWithCard")}
                  </a>
                </div>
              </section>

              <section
                className={panelClass}
                aria-labelledby="support-mercado-pago-heading"
              >
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-accent shadow-sm dark:bg-muted/25">
                    <svg
                      viewBox="0 0 640 640"
                      className="h-5 w-5"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M306.4 356.5C311.8 351.1 321.1 351.1 326.5 356.5L403.5 433.5C417.7 447.7 436.6 455.5 456.6 455.5L471.7 455.5L374.6 552.6C344.3 582.1 295.1 582.1 264.8 552.6L167.3 455.2L176.6 455.2C196.6 455.2 215.5 447.4 229.7 433.2L306.4 356.5zM326.5 282.9C320.1 288.4 311.9 288.5 306.4 282.9L229.7 206.2C215.5 191.1 196.6 184.2 176.6 184.2L167.3 184.2L264.7 86.8C295.1 56.5 344.3 56.5 374.6 86.8L471.8 183.9L456.6 183.9C436.6 183.9 417.7 191.7 403.5 205.9L326.5 282.9zM176.6 206.7C190.4 206.7 203.1 212.3 213.7 222.1L290.4 298.8C297.6 305.1 307 309.6 316.5 309.6C325.9 309.6 335.3 305.1 342.5 298.8L419.5 221.8C429.3 212.1 442.8 206.5 456.6 206.5L494.3 206.5L552.6 264.8C582.9 295.1 582.9 344.3 552.6 374.6L494.3 432.9L456.6 432.9C442.8 432.9 429.3 427.3 419.5 417.5L342.5 340.5C328.6 326.6 304.3 326.6 290.4 340.6L213.7 417.2C203.1 427 190.4 432.6 176.6 432.6L144.8 432.6L86.8 374.6C56.5 344.3 56.5 295.1 86.8 264.8L144.8 206.7L176.6 206.7z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h2
                      id="support-mercado-pago-heading"
                      className="text-base font-semibold tracking-wide text-foreground"
                    >
                      {t("support.payWithMercadoPago")}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("support.mercadoPagoSectionIntro")}
                    </p>
                  </div>
                </div>
                <PixDonationCard className="mt-5 min-h-0 flex-1" />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
