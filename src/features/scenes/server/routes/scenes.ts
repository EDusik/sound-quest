import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/api/http-api";
import { sceneFromRow } from "@/lib/audio/mappers/scene-audio-map";
import { createUserSupabase } from "@/lib/db/supabase/supabase-user";
import { isPgUniqueViolation } from "@/lib/db/supabase/pg-error";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slug";
import { postSceneBodySchema } from "@/lib/validators/scenes-api";

async function updateOwnedScene(
  supabase: ReturnType<typeof createUserSupabase>,
  id: string,
  userId: string,
  fields: {
    title: string;
    description: string;
    labels: unknown;
    created_at: string;
    order: number;
    slug: string;
  },
) {
  return supabase
    .from("scenes")
    .update({
      title: fields.title,
      description: fields.description,
      labels: fields.labels,
      created_at: fields.created_at,
      order: fields.order,
      slug: fields.slug,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
}

export async function GET(request: NextRequest) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("order", { ascending: true, nullsFirst: false });

  if (error) return jsonServerError(error.message, 500);

  const list = (data ?? []).map(sceneFromRow);
  list.sort((a, b) => {
    const aVal = a.order !== undefined ? a.order : -a.createdAt;
    const bVal = b.order !== undefined ? b.order : -b.createdAt;
    return aVal - bVal;
  });

  return NextResponse.json({ scenes: list });
}

export async function POST(request: NextRequest) {
  const auth = await requireBearerUser(request);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = postSceneBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch {
    return jsonServerError("Server configuration error", 500);
  }

  const { data: existingRows, error: listErr } = await supabase
    .from("scenes")
    .select("id, slug, order")
    .eq("user_id", auth.user.id);

  if (listErr) return jsonServerError(listErr.message, 500);

  const existing = existingRows ?? [];
  const existingSlugs = existing
    .map((r) => r.slug)
    .filter((x): x is string => !!x);

  const id = parsed.data.id ?? nanoid();
  const existingScene = existing.find((r) => r.id === id);
  const excludeSlug = existingScene?.slug ?? undefined;

  let slug: string;
  if (parsed.data.slug) {
    slug = ensureUniqueSlug(parsed.data.slug, existingSlugs, excludeSlug);
  } else {
    slug = ensureUniqueSlug(slugify(parsed.data.title), existingSlugs, excludeSlug);
  }

  const order =
    parsed.data.order ??
    (existingScene != null
      ? (existingScene.order ?? 0)
      : existing.filter((r) => r.id !== id).length);

  const createdAtIso = parsed.data.createdAt
    ? new Date(parsed.data.createdAt).toISOString()
    : new Date().toISOString();

  const payload = {
    id,
    user_id: auth.user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    labels: parsed.data.labels ?? [],
    created_at: createdAtIso,
    order,
    slug,
  };

  // Avoid upsert on global primary key `id`: if another user already owns this id,
  // ON CONFLICT would try to UPDATE their row and RLS fails ("USING expression").
  const updateFields = {
    title: payload.title,
    description: payload.description,
    labels: payload.labels,
    created_at: payload.created_at,
    order: payload.order,
    slug: payload.slug,
  };

  let row;
  let error;

  if (existingScene != null) {
    ({ data: row, error } = await updateOwnedScene(supabase, id, auth.user.id, updateFields));
  } else {
    ({ data: row, error } = await supabase.from("scenes").insert(payload).select("*").single());

    if (error && isPgUniqueViolation(error)) {
      const insErr = error;
      const { data: alreadyMine } = await supabase
        .from("scenes")
        .select("*")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (alreadyMine) {
        ({ data: row, error } = await updateOwnedScene(
          supabase,
          id,
          auth.user.id,
          updateFields,
        ));
      } else {
        return jsonServerError(
          insErr.message ||
            "This scene id or slug is already taken (including by another account).",
          409,
        );
      }
    }
  }

  if (error) return jsonServerError(error.message, 500);

  return NextResponse.json(sceneFromRow(row), { status: 201 });
}

