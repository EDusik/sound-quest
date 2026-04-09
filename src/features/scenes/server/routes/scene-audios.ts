import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";
import { isPgUniqueViolation } from "@/lib/db/supabase/pg-error";
import { audioFromRow } from "@/lib/audio/mappers/scene-audio-map";
import { createUserSupabase } from "@/lib/db/supabase/supabase-user";
import { postAudioBodySchema } from "@/lib/validators/scenes-api";

async function updateAudioInScene(
  supabase: ReturnType<typeof createUserSupabase>,
  id: string,
  sceneId: string,
  fields: {
    name: string;
    source_url: string;
    kind: string;
    created_at: string;
    order: number;
  },
) {
  return supabase
    .from("audios")
    .update({
      name: fields.name,
      source_url: fields.source_url,
      kind: fields.kind,
      created_at: fields.created_at,
      order: fields.order,
    })
    .eq("id", id)
    .eq("scene_id", sceneId)
    .select("*")
    .single();
}

async function sceneOwnedByUser(
  supabase: ReturnType<typeof createUserSupabase>,
  sceneId: string,
  userId: string,
): Promise<{ ok: boolean; dbError?: string }> {
  const { data, error } = await supabase
    .from("scenes")
    .select("id")
    .eq("id", sceneId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { ok: false, dbError: error.message };
  return { ok: data != null };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sceneId: string }> },
) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const sceneId = params.sceneId?.trim();
  if (!sceneId) return jsonServerError("Missing scene id", 400);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const owned = await sceneOwnedByUser(supabase, sceneId, auth.user.id);
  if (owned.dbError) return jsonServerError(owned.dbError, 500);
  if (!owned.ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("audios")
    .select("*")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: true });

  if (error) return jsonServerError(error.message, 500);

  const list = (data ?? []).map(audioFromRow);
  list.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt;
    const bOrder = b.order ?? b.createdAt;
    return aOrder !== bOrder ? aOrder - bOrder : a.createdAt - b.createdAt;
  });

  return NextResponse.json({ audios: list });
}

export async function POST(
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

  const parsed = postAudioBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const owned = await sceneOwnedByUser(supabase, sceneId, auth.user.id);
  if (owned.dbError) return jsonServerError(owned.dbError, 500);
  if (!owned.ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: existingAudios, error: listErr } = await supabase
    .from("audios")
    .select("id, order")
    .eq("scene_id", sceneId);

  if (listErr) return jsonServerError(listErr.message, 500);

  const existing = existingAudios ?? [];
  const id = parsed.data.id ?? nanoid();
  const existingAudio = existing.find((r) => r.id === id);
  const order =
    parsed.data.order ??
    (existingAudio != null
      ? (existingAudio.order ?? 0)
      : existing.filter((r) => r.id !== id).length);

  const createdAtIso = parsed.data.createdAt
    ? new Date(parsed.data.createdAt).toISOString()
    : new Date().toISOString();

  const payload = {
    id,
    scene_id: sceneId,
    name: parsed.data.name,
    source_url: parsed.data.sourceUrl,
    kind: parsed.data.kind ?? "file",
    created_at: createdAtIso,
    order,
  };

  const updateFields = {
    name: payload.name,
    source_url: payload.source_url,
    kind: payload.kind,
    created_at: payload.created_at,
    order: payload.order,
  };

  let row;
  let error;

  if (existingAudio != null) {
    ({ data: row, error } = await updateAudioInScene(
      supabase,
      id,
      sceneId,
      updateFields,
    ));
  } else {
    ({ data: row, error } = await supabase.from("audios").insert(payload).select("*").single());

    if (error && isPgUniqueViolation(error)) {
      const insErr = error;
      const { data: alreadyMine } = await supabase
        .from("audios")
        .select("id")
        .eq("id", id)
        .eq("scene_id", sceneId)
        .maybeSingle();

      if (alreadyMine) {
        ({ data: row, error } = await updateAudioInScene(
          supabase,
          id,
          sceneId,
          updateFields,
        ));
      } else {
        return jsonServerError(
          insErr.message || "This audio id is already used in another scene or account.",
          409,
        );
      }
    }
  }

  if (error) return jsonServerError(error.message, 500);

  return NextResponse.json(audioFromRow(row), { status: 201 });
}

