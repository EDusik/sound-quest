import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  getBearerToken,
  getUserFromAccessToken,
} from "@/lib/auth/ai-library-auth";
import { jsonUnauthorized } from "@/lib/api/http-api";

export type BearerAuthOk = { user: User; token: string };

export async function requireBearerUser(
  request: NextRequest,
): Promise<BearerAuthOk | { response: NextResponse }> {
  const token = getBearerToken(request);
  if (!token) return { response: jsonUnauthorized() };
  const user = await getUserFromAccessToken(token);
  if (!user) return { response: jsonUnauthorized() };
  return { user, token };
}
