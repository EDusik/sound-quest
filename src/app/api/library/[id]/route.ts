import { NextRequest, NextResponse } from "next/server";
import {
  getBearerToken,
  getUserFromAccessToken,
  isUserOnAiLibraryAllowlist,
} from "@/lib/ai-library-auth";
import type { AudioLibraryRow } from "@/lib/audio-library-map";
import { rowToItem } from "@/lib/audio-library-map";
import {
  jsonForbidden,
  jsonServerError,
  jsonUnauthorized,
  jsonValidationError,
} from "@/lib/http-api";
import {
  librarySupabaseErrorResponse,
  logCreateUserSupabaseFailure,
} from "@/lib/library-api-helpers";
import { createUserSupabase } from "@/lib/supabase-user";
import { libraryIdParamSchema, patchLibraryBodySchema } from "@/lib/validators/api";

async function requireProtected(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return { response: jsonUnauthorized() };
  const user = await getUserFromAccessToken(token);
  if (!user) return { response: jsonUnauthorized() };
  if (!isUserOnAiLibraryAllowlist(user)) return { response: jsonForbidden() };
  return { user, token };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireProtected(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const parsedParams = libraryIdParamSchema.safeParse(params);
  if (!parsedParams.success) return jsonValidationError(parsedParams.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = patchLibraryBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.order !== undefined) updates.order = parsed.data.order;

  const { data, error } = await supabase
    .from("audio_library")
    .update(updates)
    .eq("id", parsedParams.data.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return librarySupabaseErrorResponse(error, " PATCH");
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(rowToItem(data as AudioLibraryRow));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireProtected(request);
  if ("response" in auth) return auth.response;

  const params = await context.params;
  const parsedParams = libraryIdParamSchema.safeParse(params);
  if (!parsedParams.success) return jsonValidationError(parsedParams.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  const { data: existing, error: selErr } = await supabase
    .from("audio_library")
    .select("id")
    .eq("id", parsedParams.data.id)
    .maybeSingle();

  if (selErr) {
    return librarySupabaseErrorResponse(selErr, " DELETE");
  }
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("audio_library")
    .delete()
    .eq("id", parsedParams.data.id);

  if (error) {
    return librarySupabaseErrorResponse(error, " DELETE");
  }

  return new NextResponse(null, { status: 204 });
}
