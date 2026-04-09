import { NextRequest, NextResponse } from "next/server";
import {
  getBearerToken,
  getUserFromAccessToken,
  isUserOnAiLibraryAllowlist,
} from "@/lib/ai-library-auth";
import { jsonUnauthorized } from "@/lib/http-api";

/** Lightweight capability check: always 200 when authenticated; no Supabase library query. */
export async function GET(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return jsonUnauthorized();
  const user = await getUserFromAccessToken(token);
  if (!user) return jsonUnauthorized();
  return NextResponse.json({ allowed: isUserOnAiLibraryAllowlist(user) });
}
