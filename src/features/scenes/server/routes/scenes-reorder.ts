import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";
import { createUserSupabase } from "@/lib/db/supabase/supabase-user";
import { reorderIdsSchema } from "@/lib/validators/scenes-api";

export async function PATCH(request: NextRequest) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = reorderIdsSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { orderedIds } = parsed.data;

  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    const { error } = await supabase
      .from("scenes")
      .update({ order: index })
      .eq("id", id)
      .eq("user_id", auth.user.id);
    if (error) return jsonServerError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}

