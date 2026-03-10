"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const t = useTranslations();
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace("/dashboard");
  }, [loading, router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-background" role="status" aria-live="polite" aria-label={t("common.loading")}>
      <Spinner />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
