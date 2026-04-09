import { NextRequest, NextResponse } from "next/server";
import {
  getBearerToken,
  getUserFromAccessToken,
  isUserOnAiLibraryAllowlist,
} from "@/lib/auth/ai-library-auth";
import {
  jsonForbidden,
  jsonServerError,
  jsonUnauthorized,
  jsonValidationError,
} from "@/lib/api/http-api";
import {
  librarySupabaseErrorResponse,
  logCreateUserSupabaseFailure,
} from "@/lib/api/library-api-helpers";
import { createUserSupabase } from "@/lib/db/supabase/supabase-user";
import { libraryIdParamSchema } from "@/lib/validators/api";

async function requireProtected(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return { response: jsonUnauthorized() };
  const user = await getUserFromAccessToken(token);
  if (!user) return { response: jsonUnauthorized() };
  if (!isUserOnAiLibraryAllowlist(user)) return { response: jsonForbidden() };
  return { user, token };
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ libraryItemId: string }> },
) {
  const auth = await requireProtected(request);
  if ("response" in auth) return auth.response;

  const rawParams = await context.params;
  const parsed = libraryIdParamSchema.safeParse({ id: rawParams.libraryItemId });
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  const { error } = await supabase
    .from("audio_library_default_favorites")
    .delete()
    .eq("library_item_id", parsed.data.id);

  if (error) {
    return librarySupabaseErrorResponse(error, " DELETE default-favorites");
  }

  return new NextResponse(null, { status: 204 });
}

