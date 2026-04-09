import { NextResponse } from "next/server";
import { isFreesoundConfigured } from "../freesound-env";

/**
 * GET /api/freesound-configured
 * Returns whether Freesound API key is set (server-side). Client uses this to show/hide search UI.
 */
export async function GET() {
  return NextResponse.json(
    { configured: isFreesoundConfigured() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}

