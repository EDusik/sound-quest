import { NextResponse } from "next/server";

/**
 * GET /api/freesound-configured
 * Returns whether Freesound API key is set (server-side). Client uses this to show/hide search UI.
 */
export async function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_FREESOUND_API_KEY?.trim());
  return NextResponse.json({ configured });
}
