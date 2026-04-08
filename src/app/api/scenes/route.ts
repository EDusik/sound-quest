import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireBearerUser } from "@/lib/auth-bearer";
import { jsonServerError, jsonValidationError } from "@/lib/http-api";
import { sceneFromRow } from "@/lib/scene-audio-map";
import { createUserSupabase } from "@/lib/supabase-user";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import { postSceneBodySchema } from "@/lib/validators/scenes-api";

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

  const { data: row, error } = await supabase
    .from("scenes")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return jsonServerError(error.message, 500);

  return NextResponse.json(sceneFromRow(row), { status: 201 });
}
