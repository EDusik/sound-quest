import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";
import { createUserSupabase } from "@/lib/db/supabase/supabase-user";
import { reorderIdsSchema } from "@/lib/validators/scenes-api";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const sceneId = params.sceneId?.trim();
  if (!sceneId) return jsonServerError("Missing scene id", 400);

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

  const { data: scene, error: sceneErr } = await supabase
    .from("scenes")
    .select("id")
    .eq("id", sceneId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (sceneErr) return jsonServerError(sceneErr.message, 500);
  if (!scene) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { orderedIds } = parsed.data;

  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    const { error } = await supabase
      .from("audios")
      .update({ order: index })
      .eq("id", id)
      .eq("scene_id", sceneId);
    if (error) return jsonServerError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}

