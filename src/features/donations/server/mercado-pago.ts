import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { nanoid } from "nanoid";
import type { DonationStatus } from "@/features/donations/model/donation";

/** Subset of Mercado Pago payment JSON used by this integration. */
/** Body returned by the REST client on failed `/v1/payments` calls (thrown as JSON). */
export type MercadoPagoApiErrorBody = {
  message?: string;
  error?: string;
  status?: number;
  cause?: Array<{ description?: string; code?: string }>;
};

export function getMercadoPagoApiError(
  e: unknown,
): { status: number; message: string } | null {
  if (!e || typeof e !== "object") return null;
  const o = e as MercadoPagoApiErrorBody;
  const status =
    typeof o.status === "number" && o.status >= 400 && o.status < 600
      ? o.status
      : 400;
  let message = typeof o.message === "string" ? o.message.trim() : "";
  const firstCause = Array.isArray(o.cause) ? o.cause[0] : undefined;
  if (firstCause?.description) {
    const d = String(firstCause.description).trim();
    message = message ? `${message} (${d})` : d;
  }
  if (!message) return null;
  return { status, message };
}

export type MpPaymentJson = {
  id?: number | string;
  status?: string;
  date_of_expiration?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
  payer?: { email?: string };
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

function getAccessToken(): string {
  const t = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!t) throw new Error("Missing MERCADO_PAGO_ACCESS_TOKEN.");
  return t;
}

function getPaymentClient(): Payment {
  const client = new MercadoPagoConfig({
    accessToken: getAccessToken(),
    options: { timeout: 15_000 },
  });
  return new Payment(client);
}

export function getNotificationUrl(): string | undefined {
  const explicit = process.env.MERCADO_PAGO_NOTIFICATION_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!site) return undefined;
  return `${site}/api/webhooks/mercado-pago`;
}

export function resolveDonationPayerEmail(): string {
  const fromEnv = process.env.MERCADO_PAGO_DONATION_PAYER_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return `soundquest.donor+${nanoid(16)}@users.noreply.github.com`;
}

export function mapMpPaymentStatusToDonation(mp: {
  status?: string;
  date_of_expiration?: string | null;
}): DonationStatus {
  const s = mp.status ?? "pending";
  if (s === "approved") return "approved";
  if (s === "cancelled") return "cancelled";
  if (s === "rejected") return "rejected";
  if (s === "refunded" || s === "charged_back") return "rejected";
  if (s === "pending" || s === "in_process" || s === "in_mediation") {
    if (mp.date_of_expiration) {
      const exp = new Date(mp.date_of_expiration);
      if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now())
        return "expired";
    }
    return "pending";
  }
  return "pending";
}

export function extractPixPayload(payment: MpPaymentJson): {
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
} {
  const td = payment.point_of_interaction?.transaction_data;
  return {
    qrCode: td?.qr_code ?? null,
    qrCodeBase64: td?.qr_code_base64 ?? null,
    ticketUrl: td?.ticket_url ?? null,
  };
}

/**
 * GET /v1/payments/:id often omits `point_of_interaction.transaction_data`.
 * Merging avoids wiping stored PIX payload on status refresh or webhooks.
 */
export function mergePaymentFieldsPreservingStoredPix(
  existing: {
    amount_cents: number;
    qr_code: string | null;
    qr_code_base64: string | null;
    ticket_url: string | null;
  },
  payment: MpPaymentJson,
): ReturnType<typeof paymentToDonationRowFields> {
  const fresh = paymentToDonationRowFields(payment, existing.amount_cents);
  return {
    ...fresh,
    qr_code: fresh.qr_code ?? existing.qr_code,
    qr_code_base64: fresh.qr_code_base64 ?? existing.qr_code_base64,
    ticket_url: fresh.ticket_url ?? existing.ticket_url,
  };
}

export function paymentToDonationRowFields(
  payment: MpPaymentJson,
  amountCentsFallback: number,
): {
  id: string;
  amount_cents: number;
  currency: string;
  status: DonationStatus;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
  payer_email: string | null;
  raw: MpPaymentJson;
  expires_at: string | null;
} {
  const id = payment.id != null ? String(payment.id) : "";
  const amount =
    payment.transaction_amount != null
      ? Math.round(Number(payment.transaction_amount) * 100)
      : amountCentsFallback;
  const pix = extractPixPayload(payment);
  return {
    id,
    amount_cents:
      Number.isFinite(amount) && amount > 0 ? amount : amountCentsFallback,
    currency: payment.currency_id ?? "BRL",
    status: mapMpPaymentStatusToDonation(payment),
    qr_code: pix.qrCode,
    qr_code_base64: pix.qrCodeBase64,
    ticket_url: pix.ticketUrl,
    payer_email: payment.payer?.email ?? null,
    raw: payment,
    expires_at: payment.date_of_expiration ?? null,
  };
}

export async function createPixPayment(params: {
  amountCents: number;
  description: string;
  /** Correlation id in the Mercado Pago dashboard (max 64 chars). */
  externalReference: string;
}): Promise<MpPaymentJson> {
  const payment = getPaymentClient();
  const transaction_amount = Math.round(params.amountCents) / 100;
  const notificationUrl = getNotificationUrl();
  const payerEmail = resolveDonationPayerEmail();
  const external_reference = params.externalReference.slice(0, 64);

  const created = await payment.create({
    body: {
      transaction_amount,
      description: params.description,
      payment_method_id: "pix",
      external_reference,
      metadata: { integration: "soundquest_donation" },
      payer: {
        email: payerEmail,
        first_name: "Apoiador",
        last_name: "SoundQuest",
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
    requestOptions: { idempotencyKey: nanoid() },
  });
  return created as MpPaymentJson;
}

export async function getMercadoPagoPayment(
  id: string,
): Promise<MpPaymentJson> {
  const payment = getPaymentClient();
  const got = await payment.get({ id });
  return got as MpPaymentJson;
}

/**
 * Validates Mercado Pago webhook `x-signature` (HMAC-SHA256 hex).
 * @see https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoWebhookSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!opts.xSignature || !opts.xRequestId || !opts.secret) return false;
  const dataId = opts.dataId.trim().toLowerCase();
  const parts = opts.xSignature.split(",");
  let ts: string | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "ts") ts = val;
    if (key === "v1") v1 = val;
  }
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${opts.xRequestId};ts:${ts};`;
  const hmac = createHmac("sha256", opts.secret).update(manifest).digest("hex");
  try {
    const a = Buffer.from(hmac, "utf8");
    const b = Buffer.from(v1.toLowerCase(), "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
