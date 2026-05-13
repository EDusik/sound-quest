import { env } from "@/lib/env";

/**
 * Web search via Serper (https://serper.dev). If NEXT_SERPER_API_KEY is unset, returns empty context.
 */
export async function fetchSerperContext(query: string): Promise<string> {
  const key = env.NEXT_SERPER_API_KEY;
  if (!key || !query.trim()) return "";

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query.trim(), num: 8 }),
  });

  if (!res.ok) return "";

  const data = (await res.json()) as {
    organic?: { title?: string; link?: string; snippet?: string }[];
  };
  const organic = data.organic ?? [];
  return organic
    .map((x) => [x.title, x.link, x.snippet].filter(Boolean).join("\n"))
    .join("\n\n---\n\n");
}
