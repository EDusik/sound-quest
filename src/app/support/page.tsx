"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { HeartIcon } from "@/components/icons";
import { Navbar } from "@/components/layout/Navbar";
import { useTranslations } from "@/contexts/I18nContext";

const QRCode = dynamic(() => import("react-qr-code").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[180px] w-[180px] items-center justify-center rounded-lg border border-border bg-card text-muted"
      aria-hidden
    >
      …
    </div>
  ),
});

const PIX_KEY = process.env.NEXT_PUBLIC_PIX_ID ?? "";
/** Nubank payment link — QR code opens this URL for Pix payment */

export default function SupportPage() {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
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

  const copyPixKey = useCallback(() => {
    if (!PIX_KEY) return;
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, []);

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
        className="relative z-10 flex w-full shrink-0 flex-col items-center justify-center px-4 py-10 sm:py-14"
        style={{ height: contentHeight, minHeight: 0 }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-accent/30 bg-card/75 p-8 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-accent/35 dark:bg-card/55 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] sm:p-10">
            <div
              className="absolute inset-x-8 top-0 h-px rounded-full bg-linear-to-r from-transparent via-accent/45 to-transparent"
              aria-hidden
            />
            <h1 className="flex flex-wrap items-center gap-2 text-2xl tracking-wide text-foreground">
              <span>{t("support.titlePrefix")}</span>
              <span className="font-cinzel font-bold">{t("brand.name")}</span>
              <HeartIcon className="h-[1.1em] w-[1.1em] shrink-0 text-rose-500 dark:text-rose-400" />
            </h1>
            <p className="mt-4 text-muted-foreground">{t("support.intro")}</p>

            {/* Stripe — Card */}
            <section className="mt-8" aria-labelledby="support-stripe-heading">
              <h2 id="support-stripe-heading" className="sr-only">
                {t("support.payWithCard")}
              </h2>
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_URL ?? ""}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/90 bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-border hover:bg-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:border-border"
                aria-label={t("support.payWithCardAria")}
              >
                💳 {t("support.payWithCard")}
              </a>
            </section>

            {/* Pix — accordion: QR code opens Nubank payment link */}
            <section
              className="mt-6 border-t border-border pt-6"
              aria-labelledby="support-pix-heading"
            >
              <h2 id="support-pix-heading" className="sr-only">
                {t("support.payWithPix")}
              </h2>
              <button
                type="button"
                onClick={() => setPixOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/90 bg-card px-4 py-3.5 text-left text-sm font-semibold text-foreground shadow-sm transition hover:border-border hover:bg-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:border-border"
                aria-expanded={pixOpen}
                aria-controls="support-pix-content"
                id="support-pix-trigger"
              >
                <span>⚡ {t("support.payWithPix")}</span>
                <span
                  className="shrink-0 transition-transform"
                  aria-hidden
                  style={{
                    transform: pixOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>
              <div
                id="support-pix-content"
                role="region"
                aria-labelledby="support-pix-trigger"
                aria-hidden={!pixOpen}
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{
                  gridTemplateRows: pixOpen ? "1fr" : "0fr",
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="mt-4 mb-4 text-sm text-muted-foreground">
                    {t("support.pixQrHint")}
                  </p>
                  <div className="flex flex-col items-center">
                    <div className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-white p-3">
                      <QRCode
                        value={process.env.NEXT_PUBLIC_PIX_URL ?? ""}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="M"
                        title={t("support.payWithPixAria")}
                      />
                    </div>
                  </div>
                  {PIX_KEY && (
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {t("support.pixKeyLabel")}
                      </p>
                      <p
                        className="break-all font-mono text-sm text-foreground"
                        data-pix-key
                      >
                        {PIX_KEY}
                      </p>
                      <button
                        type="button"
                        onClick={copyPixKey}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/90 bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-border hover:bg-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:border-border"
                        aria-label={t("support.copyPixKeyAria")}
                      >
                        {copied
                          ? t("support.pixKeyCopied")
                          : t("support.copyPixKey")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <Link
              href="/dashboard"
              className="mt-8 block text-center text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4 transition hover:text-accent-hover hover:decoration-accent-hover"
            >
              {t("support.backToDashboard")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
