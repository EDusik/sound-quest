import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import {
  createPixDonationBodySchema,
  rowToPixDto,
} from "@/features/donations/model/donation";
import { insertDonation } from "@/features/donations/server/donations-repo";
import {
  createPixPayment,
  getMercadoPagoApiError,
  paymentToDonationRowFields,
} from "@/features/donations/server/mercado-pago";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createPixDonationBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  try {
    const externalReference = `sqdon_${nanoid(12)}`;
    const mpPayment = await createPixPayment({
      amountCents: parsed.data.amountCents,
      description: "Doação SoundQuest",
      externalReference,
    });
    const fields = paymentToDonationRowFields(
      mpPayment,
      parsed.data.amountCents,
    );
    if (!fields.id) {
      return jsonServerError("Mercado Pago did not return a payment id.", 502);
    }

    const nowIso = new Date().toISOString();
    await insertDonation({
      id: fields.id,
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
    });

    const row = {
      id: fields.id,
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
      created_at: nowIso,
      updated_at: nowIso,
    };

    return NextResponse.json(rowToPixDto(row));
  } catch (e) {
    const mpErr = getMercadoPagoApiError(e);
    if (mpErr && mpErr.status >= 400 && mpErr.status < 500) {
      console.warn("[donations/pix] mercado_pago_client_error", mpErr.message);
      return NextResponse.json(
        { error: "mercado_pago_client_error" },
        { status: mpErr.status },
      );
    }

    const message = e instanceof Error ? e.message : "payment_error";
    if (message.includes("Missing MERCADO_PAGO_ACCESS_TOKEN")) {
      return jsonServerError(
        "Donations are not configured (Mercado Pago).",
        503,
      );
    }
    if (
      message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      message.includes("NEXT_SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return jsonServerError(
        "Donations persistence is not configured (Supabase service role).",
        503,
      );
    }
    console.error("[donations/pix]", e);
    if (mpErr) {
      return jsonServerError(
        mpErr.message,
        mpErr.status >= 500 ? mpErr.status : 502,
      );
    }
    return jsonServerError(message, 502);
  }
}
