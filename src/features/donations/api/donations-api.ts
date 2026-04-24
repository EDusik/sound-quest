import type { DonationPixDto, DonationStatusDto } from "@/features/donations/model/donation";

export class DonationApiError extends Error {
  constructor(
    public readonly status: number,
    /** Stable machine code from `{ error }` JSON; never show raw MP text to users. */
    public readonly code: string,
  ) {
    super(code);
    this.name = "DonationApiError";
  }
}

async function readErrorCode(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return typeof j.error === "string" && j.error.length > 0 ? j.error : "unknown_error";
  } catch {
    return "unknown_error";
  }
}

/** Maps API `{ error }` codes + HTTP status to locale-backed copy (never raw provider text). */
export function messageForDonationPixApiError(
  t: (key: string) => string,
  err: DonationApiError,
): string {
  if (err.status === 503) return t("support.pixErrorNotConfigured");
  if (
    err.code === "mercado_pago_client_error" &&
    err.status >= 400 &&
    err.status < 500
  ) {
    return t("support.pixErrorPaymentProvider");
  }
  if (err.status === 400) {
    if (err.code === "invalid_json") return t("support.pixErrorGeneric");
    return t("support.pixErrorInvalidAmount");
  }
  if (err.status >= 401 && err.status < 500) {
    return t("support.pixErrorGeneric");
  }
  return t("support.pixErrorGeneric");
}

export async function createDonationPix(amountCents: number): Promise<DonationPixDto> {
  const res = await fetch("/api/donations/pix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountCents }),
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new DonationApiError(res.status, await readErrorCode(res));
  }
  return (await res.json()) as DonationPixDto;
}

export async function fetchDonationStatus(donationId: string): Promise<DonationStatusDto> {
  const res = await fetch(
    `/api/donations/pix/${encodeURIComponent(donationId)}/status`,
    { credentials: "same-origin" },
  );
  if (!res.ok) {
    throw new DonationApiError(res.status, await readErrorCode(res));
  }
  return (await res.json()) as DonationStatusDto;
}
