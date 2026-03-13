"use client";

import Link from "next/link";
import { useTranslations } from "@/contexts/I18nContext";
import { Section } from "@/components/landing/Section";
import { buttonPrimary, buttonSecondary } from "@/components/landing/sectionStyles";

export function Cta() {
  const t = useTranslations();

  return (
    <Section
      headingId="cta-heading"
      title={t("landing.ctaHeadline")}
      subtitle={t("landing.ctaSubtext")}
      centered
      contentMaxWidth="narrow"
      className="bg-card/50"
    >
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-center">
        <Link href="/login" className={buttonPrimary}>
          {t("landing.ctaCreateAccount")}
        </Link>
        <Link href="/dashboard" className={buttonSecondary}>
          {t("landing.ctaTryGuest")}
        </Link>
      </div>
    </Section>
  );
}
