"use client";

import { useState } from "react";
import { useTranslations } from "@/contexts/I18nContext";
import { textWithBrand } from "@/components/branding/SoundQuestLogo";
import { Section } from "@/components/landing/Section";

const FAQ_ITEMS = [
  { q: "landing.faq2Question", a: "landing.faq2Answer" },
  { q: "landing.faq3Question", a: "landing.faq3Answer" },
  { q: "landing.faq4Question", a: "landing.faq4Answer" },
] as const;

const FAQ_BUTTON_BASE =
  "flex w-full items-center justify-between gap-4 border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-card/80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Faq() {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      headingId="faq-heading"
      title={t("landing.faqHeading")}
      subtitle={textWithBrand(t("landing.faqSubheading"), "text-foreground")}
      centered
      contentMaxWidth="narrow"
      className="bg-background"
    >
      <ul className="mt-10 space-y-2">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <li key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className={`${FAQ_BUTTON_BASE} ${isOpen ? "rounded-t-lg border-b-0" : "rounded-lg"}`}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                id={`faq-question-${i}`}
              >
                {textWithBrand(t(item.q), "text-foreground")}
                <span
                  className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={isOpen ? "rounded-b-lg border border-border border-t-0 bg-background" : "hidden"}
              >
                <p className="px-4 py-3 text-sm text-muted">
                  {textWithBrand(t(item.a), "text-foreground")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
