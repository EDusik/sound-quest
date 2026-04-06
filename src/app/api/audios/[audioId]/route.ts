import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/http-api";
import { audioFromRow } from "@/lib/scene-audio-map";
import { createUserSupabase } from "@/lib/supabase-user";
import { patchAudioBodySchema } from "@/lib/validators/scenes-api";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ audioId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const audioId = params.audioId?.trim();
  if (!audioId) return jsonServerError("Missing audio id", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = patchAudioBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { data: audioRow, error: selErr } = await supabase
    .from("audios")
    .select("id, scene_id")
    .eq("id", audioId)
    .maybeSingle();

  if (selErr) return jsonServerError(selErr.message, 500);
  if (!audioRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: sceneRow, error: sceneErr } = await supabase
    .from("scenes")
    .select("user_id")
    .eq("id", audioRow.scene_id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (sceneErr) return jsonServerError(sceneErr.message, 500);
  if (!sceneRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.sourceUrl !== undefined) {
    updates.source_url = parsed.data.sourceUrl;
  }
  if (parsed.data.kind !== undefined) updates.kind = parsed.data.kind;
  if (parsed.data.order !== undefined) updates.order = parsed.data.order;

  const { data: updated, error } = await supabase
    .from("audios")
    .update(updates)
    .eq("id", audioId)
    .select("*")
    .single();

  if (error) return jsonServerError(error.message, 500);

  return NextResponse.json(audioFromRow(updated));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ audioId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const audioId = params.audioId?.trim();
  if (!audioId) return jsonServerError("Missing audio id", 400);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { data: audioRow, error: selErr } = await supabase
    .from("audios")
    .select("id, scene_id")
    .eq("id", audioId)
    .maybeSingle();

  if (selErr) return jsonServerError(selErr.message, 500);
  if (!audioRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: sceneRow, error: sceneErr } = await supabase
    .from("scenes")
    .select("user_id")
    .eq("id", audioRow.scene_id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (sceneErr) return jsonServerError(sceneErr.message, 500);
  if (!sceneRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await supabase.from("audios").delete().eq("id", audioId);

  if (error) return jsonServerError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
