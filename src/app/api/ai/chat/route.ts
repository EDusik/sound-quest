import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getBearerToken,
  getUserFromAccessToken,
  isUserOnAiLibraryAllowlist,
} from "@/lib/ai-library-auth";
import {
  jsonForbidden,
  jsonServerError,
  jsonUnauthorized,
  jsonValidationError,
} from "@/lib/http-api";
import { fetchSerperContext } from "@/lib/serper";
import {
  aiChatResponseSchema,
  postAiChatBodySchema,
} from "@/lib/validators/api";

const SYSTEM_JSON = `You are a helpful assistant for finding sound effects and music on the web.
You may receive web search snippets as context. Reply with ONLY valid JSON (no markdown fence) matching this shape:
{"message":{"role":"assistant","content":"<your reply to the user>"},"suggestions":[{"name":"<short label>","sourceUrl":"<https URL to audio or page>","source":"<site or note>"}]}
Use 2–6 suggestions when relevant; use [] if none. sourceUrl must be https URLs when possible.`;

async function requireProtected(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return { response: jsonUnauthorized() };
  const user = await getUserFromAccessToken(token);
  if (!user) return { response: jsonUnauthorized() };
  if (!isUserOnAiLibraryAllowlist(user.id)) return { response: jsonForbidden() };
  return { user, token };
}

function lastUserQuery(
  messages: { role: string; content: string }[],
): string {
  const userMsgs = messages.filter((m) => m.role === "user");
  return userMsgs[userMsgs.length - 1]?.content?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  const auth = await requireProtected(request);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = postAiChatBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonServerError("OPENAI_API_KEY is not configured", 503);
  }

  const query = lastUserQuery(parsed.data.messages);
  let searchContext = "";
  try {
    searchContext = await fetchSerperContext(query);
  } catch {
    searchContext = "";
  }

  const openai = new OpenAI({ apiKey });

  const contextBlock = searchContext
    ? `\n\nWeb search context:\n${searchContext.slice(0, 12_000)}`
    : "";

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_JSON + contextBlock },
        ...parsed.data.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return jsonServerError("Empty model response", 502);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return jsonServerError("Invalid JSON from model", 502);
    }

    const validated = aiChatResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
      let content = raw;
      if (
        typeof parsedJson === "object" &&
        parsedJson !== null &&
        "message" in parsedJson
      ) {
        const mc = (parsedJson as { message?: { content?: string } }).message
          ?.content;
        if (typeof mc === "string") content = mc;
      }
      return NextResponse.json(
        {
          message: { role: "assistant" as const, content },
          suggestions: [] as {
            name: string;
            sourceUrl: string;
            source: string;
          }[],
        },
        { status: 200 },
      );
    }

    return NextResponse.json(validated.data);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    if (err?.status === 429) {
      return jsonServerError("Rate limited", 429);
    }
    return jsonServerError(err?.message ?? "LLM request failed", 502);
  }
}
