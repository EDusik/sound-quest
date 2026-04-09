import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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
import { getPreviewUrl } from "@/lib/audio/providers/freesound";
import {
  type PixabaySoundHit,
  isPixabayHomepageUrl,
  pixabaySoundEffectsSearchUrl,
  resolvePixabayPageAndPreview,
} from "@/lib/audio/providers/pixabay-chat-sounds";
import { postAiChatBodySchema } from "@/lib/validators/api";

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a sound effects and music search assistant for a tabletop RPG application called SoundQuest.
You are bilingual: you understand and respond fluently in Brazilian Portuguese (pt-BR) and English. Always respond in the same language the user writes in.

Your job: help users find specific sound effects, ambience, and music for their RPG scenes.

IMPORTANT — when to ask for clarification:
If the user's request is vague (no scene type, mood, or context), ask 1-2 specific clarifying questions before suggesting. For example:
- "É um combate medieval, moderno ou sci-fi?" / "Is this medieval, modern, or sci-fi combat?"
- "Qual o clima da cena — tenso, misterioso, épico?" / "What's the mood — tense, mysterious, epic?"
When asking questions, use ---SUGGESTIONS--- followed by [].

IMPORTANT — suggestion quality:
- Use DESCRIPTIVE, SPECIFIC sound names (e.g., "Wolf Pack Howling at Night" not just "wolf")
- Prefer Pixabay for sound effects, ambience, AND music — it provides direct download URLs and well-rated community sounds. Use Freesound as a fallback for niche/specialized SFX. Use Incompetech for looping background music.
- Never invent URLs — the system will find the actual audio files using the name you provide
- For each suggestion, set "source" to exactly: "Pixabay", "Freesound", "Incompetech", or the real site name

Structure your response in TWO parts:

PART 1: A natural, helpful conversational reply with brief descriptions of each sound and why it fits the scene.

PART 2: After your text reply, write exactly this delimiter on its own line:
---SUGGESTIONS---
Then write a JSON array:
[{"name":"<descriptive sound name>","sourceUrl":"<leave as freesound.org or pixabay.com homepage — system replaces this>","source":"<Freesound|Pixabay|Incompetech|other>"}]

Example response (Portuguese):
Ótima escolha! Para uma floresta assombrada, aqui estão sons que vão criar a atmosfera perfeita:

1. **Wind Through Dead Trees** - Vento uivando entre árvores secas, ótimo para tensão.
2. **Owl Hooting at Night** - Coruja distante, adiciona vida noturna inquietante.

---SUGGESTIONS---
[{"name":"Wind Through Dead Trees Forest","sourceUrl":"https://pixabay.com","source":"Pixabay"},{"name":"Owl Hooting Night Ambience","sourceUrl":"https://pixabay.com","source":"Pixabay"}]`;

async function requireProtected(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return { response: jsonUnauthorized() };
  const user = await getUserFromAccessToken(token);
  if (!user) return { response: jsonUnauthorized() };
  if (!isUserOnAiLibraryAllowlist(user)) return { response: jsonForbidden() };
  return { user, token };
}

function sendSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown,
) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

function parseSuggestions(fullText: string): {
  text: string;
  suggestions: { name: string; sourceUrl: string; source: string }[];
} {
  const delimiter = "---SUGGESTIONS---";
  const delimiterIndex = fullText.indexOf(delimiter);

  if (delimiterIndex === -1) {
    const jsonMatch = fullText.match(/\[[\s\S]*\]\s*$/);
    if (jsonMatch) {
      try {
        const suggestions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(suggestions)) {
          return {
            text: fullText.slice(0, jsonMatch.index).trim(),
            suggestions,
          };
        }
      } catch {
        // ignore
      }
    }
    return { text: fullText.trim(), suggestions: [] };
  }

  const text = fullText.slice(0, delimiterIndex).trim();
  const jsonPart = fullText.slice(delimiterIndex + delimiter.length).trim();

  try {
    const suggestions = JSON.parse(jsonPart);
    if (Array.isArray(suggestions)) {
      return { text, suggestions };
    }
  } catch {
    // ignore
  }

  return { text, suggestions: [] };
}

async function fetchFreesoundPreview(
  name: string,
  apiKey: string,
): Promise<{ id: number; name: string; previewUrl: string } | null> {
  const queries = [name, name.split(" ").slice(0, 3).join(" ")];
  for (const q of queries) {
    try {
      const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(q)}&token=${apiKey}&fields=id,name,previews&page_size=3`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        results?: { id: number; name: string; previews: Record<string, string> }[];
      };
      const sound = data.results?.[0];
      if (sound?.previews) {
        const previewUrl = getPreviewUrl(sound.previews);
        if (previewUrl) return { id: sound.id, name: sound.name, previewUrl };
      }
    } catch {
      // try next query
    }
  }
  return null;
}

async function enrichSuggestions(
  suggestions: { name: string; sourceUrl: string; source: string }[],
): Promise<{ name: string; sourceUrl: string; source: string; previewUrl?: string }[]> {
  const freesoundApiKey = process.env.NEXT_PUBLIC_FREESOUND_API_KEY;
  const pixabayApiKey = process.env.NEXT_PIXABAY_API_KEY;
  const pixabaySoundsApiBase =
    process.env.NEXT_PIXABAY_SOUNDS_API_URL?.replace(/\/?$/, "/") ??
    "https://pixabay.com/api/sounds/";

  return Promise.all(
    suggestions.map(async (s) => {
      type Enriched = {
        name: string;
        sourceUrl: string;
        source: string;
        previewUrl?: string;
      };

      // Direct audio file URL → use as previewUrl
      if (/\.(mp3|wav|ogg|flac)(\?.*)?$/i.test(s.sourceUrl)) {
        return { ...s, previewUrl: s.sourceUrl };
      }

      const isPixabay =
        s.source.toLowerCase().includes("pixabay") || s.sourceUrl.includes("pixabay.com");
      const isFreesound =
        s.source.toLowerCase().includes("freesound") || s.sourceUrl.includes("freesound.org");

      let working: Enriched = { ...s };

      // Pixabay JSON API (when available) — prefer pageURL / id page over the site homepage
      if (pixabayApiKey) {
        try {
          const q = encodeURIComponent(s.name);
          const res = await fetch(
            `${pixabaySoundsApiBase}?key=${pixabayApiKey}&q=${q}&order=popular&per_page=3`,
            {
              signal: AbortSignal.timeout(8000),
              headers: { Accept: "application/json" },
            },
          );
          const ct = res.headers.get("content-type") ?? "";
          if (res.ok && (ct.includes("application/json") || ct.includes("text/json"))) {
            const data = (await res.json()) as { hits?: PixabaySoundHit[] };
            const hit = data.hits?.[0];
            const { pageUrl, previewUrl } = resolvePixabayPageAndPreview(hit);
            if (pageUrl) {
              working = {
                ...working,
                sourceUrl: pageUrl,
                ...(previewUrl ? { previewUrl } : {}),
              };
            } else if (previewUrl) {
              working = { ...working, previewUrl };
            }
          }
        } catch {
          // fall through
        }
      }

      // Freesound — preview + page URL for Freesound; for Pixabay-labelled items keep Pixabay link
      if (freesoundApiKey && (isFreesound || isPixabay || pixabayApiKey)) {
        const result = await fetchFreesoundPreview(s.name, freesoundApiKey);
        if (result) {
          if (isFreesound) {
            return {
              ...working,
              name: result.name,
              sourceUrl: `https://freesound.org/sounds/${result.id}/`,
              previewUrl: result.previewUrl,
            };
          }
          if (isPixabay) {
            if (isPixabayHomepageUrl(working.sourceUrl)) {
              working = {
                ...working,
                sourceUrl: pixabaySoundEffectsSearchUrl(s.name),
              };
            }
            return {
              ...working,
              previewUrl: working.previewUrl ?? result.previewUrl,
            };
          }
          return {
            ...working,
            previewUrl: result.previewUrl,
          };
        }
      }

      if (isPixabay && isPixabayHomepageUrl(working.sourceUrl)) {
        return {
          ...working,
          sourceUrl: pixabaySoundEffectsSearchUrl(s.name),
        };
      }

      return working;
    }),
  );
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      sendSSE(controller, encoder, "status", { status: "thinking" });

      const abortController = new AbortController();
      const timeout = setTimeout(() => {
        abortController.abort();
        sendSSE(controller, encoder, "error", { error: "Request timed out" });
        controller.close();
      }, 120_000);

      let fullText = "";

      try {
        const sdkStream = anthropic.messages.stream(
          {
            model: process.env.NEXT_ANTHROPIC_MODEL ?? "claude-opus-4-5",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: parsed.data.messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          },
          { signal: abortController.signal },
        );

        for await (const event of sdkStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta" &&
            event.delta.text
          ) {
            const textChunk = event.delta.text;
            fullText += textChunk;

            if (!fullText.includes("---SUGGESTIONS---")) {
              const delimIdx = textChunk.indexOf("---SUGGESTIONS---");
              if (delimIdx === -1) {
                sendSSE(controller, encoder, "text", { text: textChunk });
              } else if (delimIdx > 0) {
                sendSSE(controller, encoder, "text", { text: textChunk.slice(0, delimIdx) });
              }
            }
          }
        }

        clearTimeout(timeout);

        // Fallback: if fullText is still empty use finalMessage
        if (!fullText) {
          const final = await sdkStream.finalMessage();
          const block = final.content[0];
          if (block?.type === "text") fullText = block.text;
        }

        const { text: cleanText, suggestions } = parseSuggestions(fullText);
        const enriched = await enrichSuggestions(suggestions);
        sendSSE(controller, encoder, "suggestions", { suggestions: enriched });
        sendSSE(controller, encoder, "done", { text: cleanText });
        controller.close();
      } catch (err) {
        clearTimeout(timeout);
        if ((err as { name?: string }).name === "AbortError") return;
        const apiErr = err as { status?: number; message?: string };
        const message =
          apiErr.status === 401 || apiErr.status === 403
            ? "Anthropic API authentication failed. Check NEXT_ANTHROPIC_API_KEY."
            : (apiErr.message ?? "Unexpected error from Anthropic API");
        sendSSE(controller, encoder, "error", { error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

