"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db/supabase/supabase";
import { useTranslations } from "@/contexts/I18nContext";

export default function LoginVerifyPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = code.replace(/\s/g, "").trim();
    if (!trimmed) {
      setError(t("loginVerify.enterCodeError"));
      return;
    }
    if (!supabase) {
      setError(t("loginVerify.supabaseNotConfigured"));
      return;
    }

    setLoading(true);
    try {
      const factorsRes = await supabase.auth.mfa.listFactors();
      if (factorsRes.error) throw factorsRes.error;

      const totpFactor = factorsRes.data.totp?.[0];
      if (!totpFactor) {
        setError(t("loginVerify.noAuthenticator"));
        setLoading(false);
        return;
      }

      const challengeRes = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeRes.error) throw challengeRes.error;

      const verifyRes = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeRes.data.id,
        code: trimmed,
      });
      if (verifyRes.error) throw verifyRes.error;

      if (typeof window !== "undefined") {
        window.location.replace(next);
      } else {
        router.replace(next);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("loginVerify.invalidCode");
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 shadow-xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft/30">
            <svg
              className="h-6 w-6 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold text-foreground">
          {t("loginVerify.title")}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          {t("loginVerify.enterCode")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="code" className="sr-only">
              {t("loginVerify.authenticatorCode")}
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder={t("loginVerify.placeholder")}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-background transition hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent"
          >
            {loading ? t("loginVerify.verifying") : t("loginVerify.continue")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          {t("loginVerify.notSetUp")}{" "}
          <Link
            href="/login/enroll"
            className="text-accent underline hover:text-accent-hover"
          >
            {t("loginVerify.setUpAuthenticator")}
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted">
          <Link href="/login" className="underline hover:text-muted">
            {t("loginVerify.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
