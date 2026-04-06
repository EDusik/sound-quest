/**
 * Calls same-origin Next.js `/api/*` routes with the Supabase access JWT.
 * Postgres-backed app data (scenes, audios, library) goes through these routes, not direct client queries.
 */

import { supabase } from "@/lib/supabase";
import type { AudioLibraryItem } from "@/lib/audio-library-map";
import type { AudioItem, AudioKind, Label, Scene } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    message?: string,
  ) {
    super(message ?? `Request failed (${status})`);
    this.name = "ApiError";
  }
}

export type ChatMessageInput = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AiChatResponse = {
  message: { role: "assistant"; content: string };
  suggestions: { name: string; sourceUrl: string; source: string }[];
};

/** Returns the JWT for Authorization: Bearer, or null if not signed in. */
export async function getAccessTokenForApi(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function parseJsonOrEmpty(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as { error: unknown }).error;
    return typeof e === "string" ? e : undefined;
  }
  return undefined;
}

export async function apiFetchJson<T>(
  path: string,
  init: RequestInit & { parseJson?: boolean } = {},
): Promise<T> {
  const token = await getAccessTokenForApi();
  if (!token) {
    throw new ApiError(401, "unauthorized", "Not signed in");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  const body = await parseJsonOrEmpty(res);
  if (!res.ok) {
    const msg = getErrorMessage(body) ?? res.statusText;
    const code =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined;
    throw new ApiError(res.status, code, msg);
  }
  return body as T;
}

export async function fetchLibraryItems(
  type?: string,
): Promise<{ items: AudioLibraryItem[] }> {
  const q = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiFetchJson<{ items: AudioLibraryItem[] }>(`/api/library${q}`);
}

export async function createLibraryItem(body: {
  name: string;
  sourceUrl: string;
  type: string;
}): Promise<AudioLibraryItem> {
  return apiFetchJson<AudioLibraryItem>("/api/library", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateLibraryItem(
  id: string,
  body: { name?: string; type?: string; order?: number },
): Promise<AudioLibraryItem> {
  return apiFetchJson<AudioLibraryItem>(`/api/library/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteLibraryItem(id: string): Promise<void> {
  const token = await getAccessTokenForApi();
  if (!token) {
    throw new ApiError(401, "unauthorized", "Not signed in");
  }
  const res = await fetch(`/api/library/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
  });
  if (res.status === 204) return;
  const body = await parseJsonOrEmpty(res);
  if (!res.ok) {
    const msg = getErrorMessage(body) ?? res.statusText;
    const code =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined;
    throw new ApiError(res.status, code, msg);
  }
}

export async function postAiChat(
  messages: ChatMessageInput[],
): Promise<AiChatResponse> {
  return apiFetchJson<AiChatResponse>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

async function fetchWithAuth(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessTokenForApi();
  if (!token) {
    throw new ApiError(401, "unauthorized", "Not signed in");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers, credentials: "same-origin" });
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await parseJsonOrEmpty(res);
  const msg = getErrorMessage(body) ?? res.statusText;
  const code =
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
      ? (body as { error: string }).error
      : undefined;
  throw new ApiError(res.status, code, msg);
}

export async function fetchScenesApi(): Promise<Scene[]> {
  const { scenes } = await apiFetchJson<{ scenes: Scene[] }>("/api/scenes");
  return scenes;
}

export async function fetchSceneApi(
  sceneIdOrSlug: string,
): Promise<Scene | null> {
  try {
    return await apiFetchJson<Scene>(
      `/api/scenes/${encodeURIComponent(sceneIdOrSlug)}`,
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createSceneApi(body: {
  title: string;
  description: string;
  labels: Label[];
  id?: string;
  slug?: string;
  order?: number;
  createdAt?: number;
}): Promise<Scene> {
  return apiFetchJson<Scene>("/api/scenes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSceneApi(
  sceneId: string,
  body: {
    title?: string;
    description?: string;
    labels?: Label[];
    slug?: string;
    order?: number;
  },
): Promise<Scene> {
  return apiFetchJson<Scene>(`/api/scenes/${encodeURIComponent(sceneId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteSceneApi(sceneId: string): Promise<void> {
  const res = await fetchWithAuth(
    `/api/scenes/${encodeURIComponent(sceneId)}`,
    { method: "DELETE" },
  );
  if (res.status === 204) return;
  await throwIfNotOk(res);
}

export async function reorderScenesApi(orderedIds: string[]): Promise<void> {
  const res = await fetchWithAuth("/api/scenes/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });
  if (res.status === 204) return;
  await throwIfNotOk(res);
}

export async function fetchAudiosApi(sceneId: string): Promise<AudioItem[]> {
  const { audios } = await apiFetchJson<{ audios: AudioItem[] }>(
    `/api/scenes/${encodeURIComponent(sceneId)}/audios`,
  );
  return audios;
}

export async function createAudioApi(
  sceneId: string,
  body: {
    name: string;
    sourceUrl: string;
    kind?: AudioKind;
    id?: string;
    createdAt?: number;
    order?: number;
  },
): Promise<AudioItem> {
  return apiFetchJson<AudioItem>(
    `/api/scenes/${encodeURIComponent(sceneId)}/audios`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function updateAudioApi(
  audioId: string,
  body: {
    name?: string;
    sourceUrl?: string;
    kind?: AudioKind;
    order?: number;
  },
): Promise<AudioItem> {
  return apiFetchJson<AudioItem>(
    `/api/audios/${encodeURIComponent(audioId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteAudioApi(audioId: string): Promise<void> {
  const res = await fetchWithAuth(
    `/api/audios/${encodeURIComponent(audioId)}`,
    { method: "DELETE" },
  );
  if (res.status === 204) return;
  await throwIfNotOk(res);
}

export async function reorderAudiosApi(
  sceneId: string,
  orderedIds: string[],
): Promise<void> {
  const res = await fetchWithAuth(
    `/api/scenes/${encodeURIComponent(sceneId)}/audios/reorder`,
    {
      method: "PATCH",
      body: JSON.stringify({ orderedIds }),
    },
  );
  if (res.status === 204) return;
  await throwIfNotOk(res);
}
