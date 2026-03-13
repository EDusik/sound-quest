"use client";

import { useTranslations } from "@/contexts/I18nContext";
import { Section } from "@/components/landing/Section";

const STEP_KEYS = [
  "landing.howStep2Title",
  "landing.howStep1Title",
  "landing.howStep3Title",
] as const;

const STEP_DESC_KEYS = [
  "landing.howStep2Desc",
  "landing.howStep1Desc",
  "landing.howStep3Desc",
] as const;

export function HowItWorks() {
  const t = useTranslations();

  return (
    <Section
      id="how-it-works"
      headingId="how-heading"
      title={t("landing.howHeading")}
      subtitle={t("landing.howSubheading")}
      centered
      className="bg-card/30"
    >
      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {STEP_KEYS.map((key, i) => (
          <li
            key={key}
            className="relative flex flex-col rounded-xl border border-border bg-background p-6 text-center transition-colors hover:border-foreground/20"
          >
            <span
              className="absolute -top-3 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
              aria-hidden
            >
              {i + 1}
            </span>
            <h3 className="mt-2 font-semibold text-foreground">{t(STEP_KEYS[i])}</h3>
            <p className="mt-2 text-sm text-muted">{t(STEP_DESC_KEYS[i])}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
