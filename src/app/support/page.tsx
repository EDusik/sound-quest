"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
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
    <div className="flex flex-col">
      <div ref={navRef}>
        <Navbar
          logo={<SoundQuestLogo size={28} className="text-lg" />}
          logoHref="/dashboard"
          logoAriaLabel={t("brand.name")}
        />
      </div>
      <div
        className="flex w-full shrink-0 flex-col items-center justify-center px-4 py-12"
        style={{ height: contentHeight, minHeight: 0 }}
      >
        <div className="mx-auto w-full max-w-6xl flex flex-col items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-xl">
            <h1 className="text-2xl tracking-wide text-foreground">
              <span>{t("support.titlePrefix")}</span>
              <span className="font-cinzel font-bold">{t("brand.name")}</span>
              {" ❤️"}
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
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-border/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
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
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-border/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
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
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-border/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
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
              className="mt-8 block text-center text-sm text-muted-foreground underline decoration-muted-foreground/50 underline-offset-2 transition hover:text-foreground"
            >
              {t("support.backToDashboard")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
