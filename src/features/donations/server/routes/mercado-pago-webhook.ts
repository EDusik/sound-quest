import { NextRequest, NextResponse } from "next/server";
import {
  getDonationById,
  insertDonation,
  updateDonationFromMpFields,
} from "@/features/donations/server/donations-repo";
import {
  getMercadoPagoPayment,
  mergePaymentFieldsPreservingStoredPix,
  paymentToDonationRowFields,
  verifyMercadoPagoWebhookSignature,
} from "@/features/donations/server/mercado-pago";

function extractDataId(request: NextRequest, body: unknown): string | null {
  const q = request.nextUrl.searchParams.get("data.id");
  if (q) return q.trim();
  if (body && typeof body === "object" && "data" in body) {
    const data = (body as { data?: { id?: string | number } }).data;
    if (data?.id != null) return String(data.id).trim();
  }
  return null;
}

function isPaymentNotification(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as { type?: string; topic?: string; action?: string };
  if (b.type === "payment") return true;
  if (b.topic === "payment") return true;
  if (typeof b.action === "string" && b.action.startsWith("payment."))
    return true;
  return false;
}

export async function POST(request: NextRequest) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error(
      "[webhooks/mercado-pago] MERCADO_PAGO_WEBHOOK_SECRET is not set.",
    );
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isPaymentNotification(body)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const dataId = extractDataId(request, body);
  if (!dataId) {
    return NextResponse.json({ error: "missing_data_id" }, { status: 400 });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (
    !verifyMercadoPagoWebhookSignature({
      xSignature,
      xRequestId,
      dataId,
      secret,
    })
  ) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    const mp = await getMercadoPagoPayment(dataId);
    const fallbackCents = Math.max(
      100,
      Math.round(Number(mp.transaction_amount ?? 0) * 100) || 100,
    );
    const nowIso = new Date().toISOString();
    const idFromMp = mp.id != null ? String(mp.id) : "";
    if (!idFromMp) {
      return NextResponse.json({ error: "no_payment_id" }, { status: 502 });
    }
    const existing = await getDonationById(idFromMp);
    const fields = existing
      ? mergePaymentFieldsPreservingStoredPix(
          {
            amount_cents: existing.amount_cents,
            qr_code: existing.qr_code,
            qr_code_base64: existing.qr_code_base64,
            ticket_url: existing.ticket_url,
          },
          mp,
        )
      : paymentToDonationRowFields(mp, fallbackCents);
    if (!fields.id) {
      return NextResponse.json({ error: "no_payment_id" }, { status: 502 });
    }
    const payload = {
      amount_cents: fields.amount_cents,
      currency: fields.currency,
      status: fields.status,
      qr_code: fields.qr_code,
      qr_code_base64: fields.qr_code_base64,
      ticket_url: fields.ticket_url,
      payer_email: fields.payer_email,
      raw: fields.raw,
      expires_at: fields.expires_at,
      last_mp_fetch_at: nowIso,
    };
    if (existing) {
      await updateDonationFromMpFields(fields.id, payload);
    } else {
      try {
        await insertDonation({
          id: fields.id,
          ...payload,
        });
      } catch (insertErr: unknown) {
        const pg =
          insertErr && typeof insertErr === "object" && "pgCode" in insertErr
            ? String((insertErr as { pgCode?: string }).pgCode)
            : "";
        const msg = insertErr instanceof Error ? insertErr.message : "";
        if (
          pg === "23505" ||
          msg.includes("duplicate") ||
          msg.includes("unique")
        ) {
          const row = await getDonationById(fields.id);
          const merged = row
            ? mergePaymentFieldsPreservingStoredPix(
                {
                  amount_cents: row.amount_cents,
                  qr_code: row.qr_code,
                  qr_code_base64: row.qr_code_base64,
                  ticket_url: row.ticket_url,
                },
                mp,
              )
            : fields;
          await updateDonationFromMpFields(fields.id, {
            amount_cents: merged.amount_cents,
            currency: merged.currency,
            status: merged.status,
            qr_code: merged.qr_code,
            qr_code_base64: merged.qr_code_base64,
            ticket_url: merged.ticket_url,
            payer_email: merged.payer_email,
            raw: merged.raw,
            expires_at: merged.expires_at,
            last_mp_fetch_at: nowIso,
          });
        } else {
          throw insertErr;
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhooks/mercado-pago]", e);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}
