import { NextRequest, NextResponse } from "next/server";
import {
  donationIdParamSchema,
  rowToStatusDto,
} from "@/features/donations/model/donation";
import {
  getDonationById,
  updateDonationFromMpFields,
} from "@/features/donations/server/donations-repo";
import {
  getMercadoPagoPayment,
  mergePaymentFieldsPreservingStoredPix,
} from "@/features/donations/server/mercado-pago";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";

const REFRESH_MS = 15_000;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const parsedParams = donationIdParamSchema.safeParse(params);
  if (!parsedParams.success) return jsonValidationError(parsedParams.error);

  try {
    let row = await getDonationById(parsedParams.data.id);
    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const shouldRefresh =
      row.status === "pending" &&
      (() => {
        const last = row.last_mp_fetch_at
          ? new Date(row.last_mp_fetch_at).getTime()
          : 0;
        return !last || Date.now() - last > REFRESH_MS;
      })();

    if (shouldRefresh) {
      try {
        const mp = await getMercadoPagoPayment(row.id);
        const fields = mergePaymentFieldsPreservingStoredPix(row, mp);
        const nowIso = new Date().toISOString();
        await updateDonationFromMpFields(row.id, {
          ...fields,
          last_mp_fetch_at: nowIso,
        });
        row = await getDonationById(row.id);
        if (!row) {
          return NextResponse.json({ error: "not_found" }, { status: 404 });
        }
      } catch (e) {
        console.error("[donations/pix/status] mp refresh", e);
      }
    }

    const finalRow = row;
    if (!finalRow) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(rowToStatusDto(finalRow));
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    if (
      message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      message.includes("NEXT_SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return jsonServerError("Donations persistence is not configured.", 503);
    }
    if (message.includes("Missing MERCADO_PAGO_ACCESS_TOKEN")) {
      return jsonServerError(
        "Donations are not configured (Mercado Pago).",
        503,
      );
    }
    console.error("[donations/pix/status]", e);
    return jsonServerError(message, 500);
  }
}
