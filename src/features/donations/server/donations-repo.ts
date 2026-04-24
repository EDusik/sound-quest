import { createServiceSupabase } from "@/lib/db/supabase/supabase-service";
import type { DonationRow, DonationStatus } from "@/features/donations/model/donation";

export async function insertDonation(row: {
  id: string;
  amount_cents: number;
  currency: string;
  status: DonationStatus;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
  payer_email: string | null;
  raw: unknown;
  expires_at: string | null;
  last_mp_fetch_at: string;
}): Promise<void> {
  const supabase = createServiceSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase.from("donations").insert({
    id: row.id,
    amount_cents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    qr_code: row.qr_code,
    qr_code_base64: row.qr_code_base64,
    ticket_url: row.ticket_url,
    payer_email: row.payer_email,
    raw: row.raw as object,
    expires_at: row.expires_at,
    last_mp_fetch_at: row.last_mp_fetch_at,
    updated_at: now,
  });
  if (error) {
    const err = new Error(`donations insert: ${error.message}`) as Error & { pgCode?: string };
    err.pgCode = error.code;
    throw err;
  }
}

export async function getDonationById(id: string): Promise<DonationRow | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`donations select: ${error.message}`);
  return data as DonationRow | null;
}

export async function updateDonationFromMpFields(
  id: string,
  fields: {
    amount_cents: number;
    currency: string;
    status: DonationStatus;
    qr_code: string | null;
    qr_code_base64: string | null;
    ticket_url: string | null;
    payer_email: string | null;
    raw: unknown;
    expires_at: string | null;
    last_mp_fetch_at: string;
  },
): Promise<void> {
  const supabase = createServiceSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("donations")
    .update({
      amount_cents: fields.amount_cents,
      currency: fields.currency,
      status: fields.status,
      qr_code: fields.qr_code,
      qr_code_base64: fields.qr_code_base64,
      ticket_url: fields.ticket_url,
      payer_email: fields.payer_email,
      raw: fields.raw as object,
      expires_at: fields.expires_at,
      last_mp_fetch_at: fields.last_mp_fetch_at,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw new Error(`donations update: ${error.message}`);
}
