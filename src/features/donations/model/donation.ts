import { z } from "zod";

/** Max donation: R$ 50.000,00 */
export const DONATION_MAX_AMOUNT_CENTS = 5_000_000;

export const createPixDonationBodySchema = z.object({
  amountCents: z.number().int().min(100).max(DONATION_MAX_AMOUNT_CENTS),
});

export type CreatePixDonationBody = z.infer<typeof createPixDonationBodySchema>;

export const donationIdParamSchema = z.object({
  id: z.string().min(1).max(256),
});

export type DonationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type DonationRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
  payer_email: string | null;
  raw: unknown;
  expires_at: string | null;
  last_mp_fetch_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DonationPixDto = {
  id: string;
  amountCents: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  status: DonationStatus;
  expiresAt: string | null;
  createdAt: string;
};

export type DonationStatusDto = DonationPixDto & {
  lastMpFetchAt: string | null;
};

export function rowToPixDto(row: DonationRow): DonationPixDto {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    qrCode: row.qr_code,
    qrCodeBase64: row.qr_code_base64,
    ticketUrl: row.ticket_url,
    status: normalizeDonationStatus(row.status),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function rowToStatusDto(row: DonationRow): DonationStatusDto {
  return {
    ...rowToPixDto(row),
    lastMpFetchAt: row.last_mp_fetch_at,
  };
}

const DONATION_FALLBACK_EXPIRY_MS = 15 * 60 * 1000;

/** Effective Pix expiry (Mercado Pago `expiresAt` or created + 15 min). */
export function donationExpiresAt(d: DonationPixDto): Date {
  if (d.expiresAt) {
    const parsed = new Date(d.expiresAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(new Date(d.createdAt).getTime() + DONATION_FALLBACK_EXPIRY_MS);
}

/** True if pending window is past (for polling / UI). */
export function isDonationPendingTimeExpired(d: DonationPixDto, nowMs: number): boolean {
  return nowMs > donationExpiresAt(d).getTime();
}

export function normalizeDonationStatus(s: string): DonationStatus {
  if (
    s === "pending" ||
    s === "approved" ||
    s === "rejected" ||
    s === "cancelled" ||
    s === "expired"
  ) {
    return s;
  }
  if (s === "in_process" || s === "in_mediation") return "pending";
  return "pending";
}
