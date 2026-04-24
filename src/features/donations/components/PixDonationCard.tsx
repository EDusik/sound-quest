"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { useTranslations } from "@/contexts/I18nContext";
import {
  DonationApiError,
  messageForDonationPixApiError,
} from "@/features/donations/api/donations-api";
import { useCreateDonationPixMutation } from "@/features/donations/api/useDonationPix";
import type { DonationPixDto } from "@/features/donations/model/donation";
import {
  formatCentsToBrl,
  parseBrlToCents,
} from "@/features/donations/lib/parse-brl-donation";
import {
  DONATION_MAX_AMOUNT_CENTS,
  donationExpiresAt,
} from "@/features/donations/model/donation";

const MIN_CENTS = 100;

export function PixDonationCard({ className }: { className?: string } = {}) {
  const t = useTranslations();
  const [amountText, setAmountText] = useState("");
  const [donationId, setDonationId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  /** Flip once at expiry; avoids 1s interval re-renders that felt like a “loop”. */
  const [timeExpired, setTimeExpired] = useState(false);

  const createMut = useCreateDonationPixMutation();
  const display = useMemo((): DonationPixDto | null => {
    if (!donationId || !createMut.data) return null;
    if (createMut.data.id !== donationId) return null;
    return createMut.data;
  }, [donationId, createMut.data]);

  const expireAtMs = display ? donationExpiresAt(display).getTime() : null;
  const canGeneratePix = useMemo(() => {
    const cents = parseBrlToCents(amountText);
    if (cents == null) return false;
    return cents >= MIN_CENTS && cents <= DONATION_MAX_AMOUNT_CENTS;
  }, [amountText]);

  useEffect(() => {
    if (display?.status !== "pending" || expireAtMs == null) return;
    const ms = expireAtMs - Date.now();
    if (ms <= 0) {
      queueMicrotask(() => setTimeExpired(true));
      return;
    }
    const id = window.setTimeout(() => setTimeExpired(true), ms);
    return () => window.clearTimeout(id);
  }, [display?.id, display?.status, expireAtMs]);

  const handleGenerate = useCallback(() => {
    const cents = parseBrlToCents(amountText);
    if (
      cents == null ||
      cents < MIN_CENTS ||
      cents > DONATION_MAX_AMOUNT_CENTS
    ) {
      return;
    }
    setFormError(null);
    createMut.mutate(cents, {
      onSuccess: (data) => {
        setTimeExpired(false);
        setDonationId(data.id);
      },
      onError: (err) => {
        if (err instanceof DonationApiError) {
          setFormError(messageForDonationPixApiError(t, err));
          return;
        }
        setFormError(t("support.pixErrorGeneric"));
      },
    });
  }, [amountText, createMut, t]);

  const handleNewCode = useCallback(() => {
    setTimeExpired(false);
    setDonationId(null);
    setFormError(null);
    createMut.reset();
  }, [createMut]);

  const statusLabel = useMemo(() => {
    if (!display) return null;
    if (display.status === "approved") return t("support.pixApproved");
    if (timeExpired && display.status === "pending") return t("support.pixExpired");
    if (display.status === "pending") return null;
    if (display.status === "expired") return t("support.pixExpired");
    if (display.status === "rejected" || display.status === "cancelled") {
      return t("support.pixRejected");
    }
    return t("support.pixErrorGeneric");
  }, [display, t, timeExpired]);

  return (
    <div className={className ? `space-y-4 ${className}` : "space-y-4"}>
      <p className="text-sm text-muted-foreground">{t("support.pixQrHint")}</p>

      {!donationId && (
        <div className="space-y-3">
          <div>
            <label htmlFor="pix-donation-amount" className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("support.pixAmountLabel")}
            </label>
            <input
              id="pix-donation-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t("support.pixAmountPlaceholder")}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              className="w-full rounded-xl border border-border/90 bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
          </div>
          {formError && (
            <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
              {formError}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={createMut.isPending || !canGeneratePix}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/90 bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-border hover:bg-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60 dark:border-border"
          >
            {createMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                {t("support.pixGenerating")}
              </>
            ) : (
              t("support.pixGenerate")
            )}
          </button>
        </div>
      )}

      {donationId && display && (
        <div className="space-y-4 border-t border-border pt-4">
          {display.amountCents != null && (
            <p className="text-center text-sm text-muted-foreground">
              {formatCentsToBrl(display.amountCents)}
            </p>
          )}

          {display.ticketUrl &&
            display.status === "pending" &&
            !timeExpired && (
              <a
                href={display.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/90 bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-border hover:bg-border/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:border-border"
                aria-label={t("support.pixPayOnMpAria")}
              >
                {t("support.pixPayOnMp")}
              </a>
            )}

          {(display.qrCodeBase64 || display.qrCode) && (
            <div className="flex justify-center">
              {display.qrCodeBase64 ? (
                // Mercado Pago returns dynamic base64; next/image offers little benefit here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${display.qrCodeBase64}`}
                  alt={t("support.pixQrAlt")}
                  width={220}
                  height={220}
                  className="rounded-lg border border-border bg-white p-2"
                />
              ) : display.qrCode ? (
                <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
                  <QRCode
                    value={display.qrCode}
                    size={220}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              ) : null}
            </div>
          )}

          {statusLabel && (display.status !== "pending" || timeExpired) && (
            <div
              className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5 text-center text-sm font-medium text-foreground"
              role="status"
            >
              {statusLabel}
            </div>
          )}

          {display.ticketUrl && display.status === "approved" && (
            <a
              href={display.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4"
            >
              {t("support.pixOpenTicket")}
            </a>
          )}

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleNewCode}
              className="text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4"
            >
              {t("support.pixNewCode")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
