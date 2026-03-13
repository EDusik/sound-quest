"use client";

import {
  Music2,
  Upload,
  Crown,
  Zap,
  LayoutGrid,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "@/contexts/I18nContext";
import { Section } from "@/components/landing/Section";

const FEATURE_KEYS = [
  "landing.feature1Title",
  "landing.feature2Title",
  "landing.feature3Title",
  "landing.feature4Title",
  "landing.feature5Title",
  "landing.feature6Title",
] as const;

const FEATURE_DESC_KEYS = [
  "landing.feature1Desc",
  "landing.feature2Desc",
  "landing.feature3Desc",
  "landing.feature4Desc",
  "landing.feature5Desc",
  "landing.feature6Desc",
] as const;

const FEATURE_ICONS: LucideIcon[] = [
  Music2,
  Upload,
  Crown,
  Zap,
  LayoutGrid,
  UserCircle,
];

function FeatureIconSlot({ Icon }: { Icon: LucideIcon }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground"
      aria-hidden
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </div>
  );
}

export function Features() {
  const t = useTranslations();

  return (
    <Section
      id="features"
      headingId="features-heading"
      title={t("landing.featuresHeading")}
      subtitle={t("landing.featuresSubheading")}
      centered
      className="bg-background"
    >
      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_KEYS.map((key, i) => (
          <li
            key={key}
            className="flex gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/20 hover:bg-card/80"
          >
            <FeatureIconSlot Icon={FEATURE_ICONS[i]} />
            <div>
              <h3 className="font-semibold text-foreground">{t(FEATURE_KEYS[i])}</h3>
              <p className="mt-1 text-sm text-muted">{t(FEATURE_DESC_KEYS[i])}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
