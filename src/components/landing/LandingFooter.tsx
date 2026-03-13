"use client";

import Link from "next/link";
import { useTranslations } from "@/contexts/I18nContext";
import { SoundQuestBrand, textWithBrand } from "@/components/branding/SoundQuestLogo";
import { ScrollToHashLink } from "@/components/landing/ScrollToHashLink";
import { getCurrentYear } from "@/lib/date";

export function LandingFooter() {
  const t = useTranslations();

  return (
    <footer
      className="mt-auto border-t border-border bg-background"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="text-lg font-medium text-foreground hover:opacity-90"
            >
              <SoundQuestBrand className="text-lg" />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted">
              {textWithBrand(t("landing.footerDescription"), "text-foreground")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {t("landing.footerProduct")}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <ScrollToHashLink
                  href="#features"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {t("landing.navFeatures")}
                </ScrollToHashLink>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {t("landing.footerDashboard")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {t("landing.footerContribute")}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/support"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {t("footer.supportLinkText")}
                </Link>
              </li>
              <li>
                <a
                  href={process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/EDusik/sound-quest"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {t("landing.footerGitHub")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8 text-center text-sm text-muted">
          <p>© {getCurrentYear()} <SoundQuestBrand className="text-sm" />. {t("landing.footerRights")}</p>
        </div>
      </div>
    </footer>
  );
}
