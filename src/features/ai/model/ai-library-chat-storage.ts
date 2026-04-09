import type { AiChatSuggestion, ChatMessageInput } from "@/lib/api/api-client";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

const STORAGE_VERSION = 1 as const;
const PREFIX = "soundquest:aiLibraryChat";
const MAX_PERSISTED_MESSAGES = 200;

const TYPE_SET = new Set<string>(AUDIO_LIBRARY_TYPES);

export function aiLibraryChatStorageKeyPage(userId: string): string {
  return `${PREFIX}:v${STORAGE_VERSION}:page:${userId}`;
}

export function aiLibraryChatStorageKeyScene(userId: string, sceneId: string): string {
  return `${PREFIX}:v${STORAGE_VERSION}:scene:${userId}:${sceneId}`;
}

export type PersistedAiLibraryChatPayload = {
  v: typeof STORAGE_VERSION;
  messages: ChatMessageInput[];
  lastSuggestions: AiChatSuggestion[];
  suggestionTypes: Record<string, string>;
  addedKeys?: string[];
};

export type LoadedAiLibraryChatState = {
  messages: ChatMessageInput[];
  lastSuggestions: AiChatSuggestion[];
  suggestionTypes: Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]>;
  addedKeys?: string[];
};

function trimMessages(messages: ChatMessageInput[]): ChatMessageInput[] {
  if (messages.length <= MAX_PERSISTED_MESSAGES) return messages;
  return messages.slice(-MAX_PERSISTED_MESSAGES);
}

function isChatMessage(x: unknown): x is ChatMessageInput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const role = o.role;
  return (
    (role === "user" || role === "assistant" || role === "system") &&
    typeof o.content === "string"
  );
}

function isSuggestion(x: unknown): x is AiChatSuggestion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.sourceUrl === "string" &&
    typeof o.source === "string" &&
    (o.previewUrl === undefined || typeof o.previewUrl === "string")
  );
}

function normalizeSuggestionTypes(raw: unknown): Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const idx = Number(k);
    if (!Number.isInteger(idx) || typeof v !== "string" || !TYPE_SET.has(v)) continue;
    out[idx] = v as (typeof AUDIO_LIBRARY_TYPES)[number];
  }
  return out;
}

export function loadAiLibraryChatState(key: string): LoadedAiLibraryChatState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    if (o.v !== STORAGE_VERSION) return null;
    if (!Array.isArray(o.messages) || !o.messages.every(isChatMessage)) return null;
    if (!Array.isArray(o.lastSuggestions) || !o.lastSuggestions.every(isSuggestion)) return null;
    const addedKeys = Array.isArray(o.addedKeys)
      ? o.addedKeys.filter((x): x is string => typeof x === "string")
      : undefined;
    return {
      messages: o.messages,
      lastSuggestions: o.lastSuggestions,
      suggestionTypes: normalizeSuggestionTypes(o.suggestionTypes),
      addedKeys,
    };
  } catch {
    return null;
  }
}

export function clearAiLibraryChatStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveAiLibraryChatState(
  key: string,
  payload: {
    messages: ChatMessageInput[];
    lastSuggestions: AiChatSuggestion[];
    suggestionTypes: Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]>;
    addedKeys: string[];
    persistAddedKeys: boolean;
  },
): void {
  if (typeof window === "undefined") return;
  try {
    const messages = trimMessages(payload.messages);
    const body: PersistedAiLibraryChatPayload = {
      v: STORAGE_VERSION,
      messages,
      lastSuggestions: payload.lastSuggestions,
      suggestionTypes: suggestionTypesToRecord(payload.suggestionTypes),
    };
    if (payload.persistAddedKeys) {
      body.addedKeys = payload.addedKeys;
    }
    localStorage.setItem(key, JSON.stringify(body));
  } catch {
    // quota or private mode
  }
}

export function suggestionTypesToRecord(
  types: Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(types)) {
    out[String(k)] = v;
  }
  return out;
}

