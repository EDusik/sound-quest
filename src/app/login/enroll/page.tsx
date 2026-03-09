"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "@/contexts/I18nContext";

export default function LoginEnrollPage() {
  const t = useTranslations();
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setEnrollLoading(false);
      return;
    }
    supabase.auth.mfa
      .enroll({ factorType: "totp" })
      .then(({ data, error: enrollError }) => {
        setEnrollLoading(false);
        if (enrollError) {
          setError(enrollError.message);
          return;
        }
        if (data) {
          setFactorId(data.id);
          setQrSvg(data.totp.qr_code ?? "");
          setSecret(data.totp.secret ?? "");
        }
      })
      .catch(() => {
        setEnrollLoading(false);
        setError(t("loginEnroll.failedStart"));
      });
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = verifyCode.replace(/\s/g, "").trim();
    if (!code || !factorId || !supabase) return;

    setLoading(true);
    try {
      const challengeRes = await supabase.auth.mfa.challenge({ factorId });
      if (challengeRes.error) throw challengeRes.error;

      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeRes.data.id,
        code,
      });
      if (verifyRes.error) throw verifyRes.error;

      setEnrolled(true);
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("loginEnroll.invalidCode");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (enrollLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-muted">{t("loginEnroll.preparing")}</p>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-center text-muted">
          {t("loginEnroll.redirecting")}
        </p>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

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
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold text-foreground">
          {t("loginEnroll.title")}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          {t("loginEnroll.scanQR")}
        </p>

        {(error || (!supabase && !enrollLoading)) && (
          <p className="mt-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">
            {error || (!supabase ? t("loginEnroll.supabaseNotConfigured") : "")}
          </p>
        )}

        {qrSvg && (
          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-lg border border-border bg-card p-2 [&_svg]:h-48 [&_svg]:w-48">
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
            {secret && (
              <p className="mt-3 break-all text-center font-mono text-xs text-muted">
                {t("loginEnroll.orEnter", { secret })}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="verifyCode" className="sr-only">
              {t("loginEnroll.verificationCode")}
            </label>
            <input
              id="verifyCode"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder={t("loginEnroll.placeholder")}
              value={verifyCode}
              onChange={(e) =>
                setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              disabled={loading || !factorId}
            />
          </div>
          <button
            type="submit"
            disabled={loading || verifyCode.length < 6}
            className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-background transition hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent"
          >
            {loading ? t("loginEnroll.verifying") : t("loginEnroll.enableAuthenticator")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/dashboard" className="underline hover:text-muted">
            {t("loginEnroll.backToDashboard")}
          </Link>
        </p>
      </div>
    </div>
  );
}
