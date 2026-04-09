import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";
import { sceneFromRow } from "@/lib/audio/mappers/scene-audio-map";
import { createUserSupabase } from "@/lib/db/supabase/supabase-user";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slug";
import { patchSceneBodySchema } from "@/lib/validators/scenes-api";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const sceneId = params.sceneId?.trim();
  if (!sceneId) {
    return jsonServerError("Missing scene id", 400);
  }

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { data: byId, error: errId } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", sceneId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (errId) return jsonServerError(errId.message, 500);
  if (byId) return NextResponse.json(sceneFromRow(byId));

  const { data: bySlug, error: errSlug } = await supabase
    .from("scenes")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("slug", sceneId)
    .maybeSingle();

  if (errSlug) return jsonServerError(errSlug.message, 500);
  if (bySlug) return NextResponse.json(sceneFromRow(bySlug));

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const sceneId = params.sceneId?.trim();
  if (!sceneId) {
    return jsonServerError("Missing scene id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = patchSceneBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { data: existing, error: selErr } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", sceneId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (selErr) return jsonServerError(selErr.message, 500);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: allScenes, error: listErr } = await supabase
    .from("scenes")
    .select("slug")
    .eq("user_id", auth.user.id);

  if (listErr) return jsonServerError(listErr.message, 500);

  const existingSlugs = (allScenes ?? [])
    .map((r) => r.slug)
    .filter((x): x is string => !!x);

  const title = parsed.data.title !== undefined ? parsed.data.title : existing.title;
  let slug: string | undefined;
  if (parsed.data.slug !== undefined) {
    slug = ensureUniqueSlug(parsed.data.slug, existingSlugs, existing.slug ?? undefined);
  } else if (parsed.data.title !== undefined) {
    slug = ensureUniqueSlug(slugify(title), existingSlugs, existing.slug ?? undefined);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.labels !== undefined) updates.labels = parsed.data.labels;
  if (slug !== undefined) updates.slug = slug;
  if (parsed.data.order !== undefined) updates.order = parsed.data.order;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(sceneFromRow(existing));
  }

  const { data: row, error } = await supabase
    .from("scenes")
    .update(updates)
    .eq("id", sceneId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error) return jsonServerError(error.message, 500);

  return NextResponse.json(sceneFromRow(row));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const sceneId = params.sceneId?.trim();
  if (!sceneId) {
    return jsonServerError("Missing scene id", 400);
  }

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { error: audiosError } = await supabase.from("audios").delete().eq("scene_id", sceneId);

  if (audiosError) return jsonServerError(audiosError.message, 500);

  const { data: deleted, error } = await supabase
    .from("scenes")
    .delete()
    .eq("id", sceneId)
    .eq("user_id", auth.user.id)
    .select("id");

  if (error) return jsonServerError(error.message, 500);
  if (!deleted?.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

