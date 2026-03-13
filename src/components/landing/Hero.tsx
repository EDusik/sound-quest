"use client";

import Link from "next/link";
import { useTranslations } from "@/contexts/I18nContext";
import { textWithBrand } from "@/components/branding/SoundQuestLogo";
import { buttonPrimary } from "@/components/landing/sectionStyles";
import { HeroWaveParticles } from "@/components/landing/HeroWaveParticles";

export function Hero() {
  const t = useTranslations();

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-[color-mix(in_oklab,var(--card)_50%,transparent)]"
      aria-labelledby="hero-heading"
    >
      <HeroWaveParticles className="pointer-events-none absolute inset-x-0 -bottom-12 h-[100%] z-0 hidden opacity-80 md:block" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:gap-12 md:py-24 lg:gap-16">
        <div className="space-y-8">
          <h1
            id="hero-heading"
            className="font-cinzel text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {t("landing.heroHeadline")}
          </h1>
          <p className="max-w-xl text-lg text-muted sm:text-xl">
            {textWithBrand(t("landing.heroSupporting"), "text-foreground")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className={buttonPrimary}>
              {t("landing.navStartFree")}
            </Link>
          </div>
        </div>
        <div className="relative hidden h-64 md:block lg:h-80" />
      </div>
    </section>
  );
}

