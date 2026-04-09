"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AiChatSuggestion, ChatMessageInput } from "@/lib/api/api-client";
import {
  aiLibraryChatStorageKeyPage,
  aiLibraryChatStorageKeyScene,
  clearAiLibraryChatStorage,
  loadAiLibraryChatState,
  saveAiLibraryChatState,
} from "@/lib/ai/ai-library-chat-storage";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

export function usePersistedAiLibraryChat(options: {
  userId: string | undefined;
  variant: "page" | "scene";
  sceneId?: string;
  persistAddedKeys?: boolean;
}) {
  const { userId, variant, sceneId, persistAddedKeys = true } = options;

  const storageKey = useMemo(() => {
    if (!userId) return null;
    if (variant === "page") return aiLibraryChatStorageKeyPage(userId);
    if (!sceneId) return null;
    return aiLibraryChatStorageKeyScene(userId, sceneId);
  }, [userId, variant, sceneId]);

  const [chatMessages, setChatMessages] = useState<ChatMessageInput[]>([]);
  const [lastSuggestions, setLastSuggestions] = useState<AiChatSuggestion[]>(
    [],
  );
  const [suggestionTypes, setSuggestionTypes] = useState<
    Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]>
  >({});
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const skipSaveOnce = useRef(true);

  useEffect(() => {
    skipSaveOnce.current = true;
    queueMicrotask(() => {
      if (!storageKey) {
        setChatMessages([]);
        setLastSuggestions([]);
        setSuggestionTypes({});
        setAddedKeys(new Set());
        setHydrated(true);
        return;
      }
      const loaded = loadAiLibraryChatState(storageKey);
      if (loaded) {
        setChatMessages(loaded.messages);
        setLastSuggestions(loaded.lastSuggestions);
        setSuggestionTypes(loaded.suggestionTypes);
        if (persistAddedKeys) {
          setAddedKeys(new Set(loaded.addedKeys ?? []));
        } else {
          setAddedKeys(new Set());
        }
      } else {
        setChatMessages([]);
        setLastSuggestions([]);
        setSuggestionTypes({});
        setAddedKeys(new Set());
      }
      setHydrated(true);
    });
  }, [storageKey, persistAddedKeys]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    if (skipSaveOnce.current) {
      skipSaveOnce.current = false;
      return;
    }
    const t = setTimeout(() => {
      saveAiLibraryChatState(storageKey, {
        messages: chatMessages,
        lastSuggestions,
        suggestionTypes,
        addedKeys: [...addedKeys],
        persistAddedKeys,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [
    hydrated,
    storageKey,
    chatMessages,
    lastSuggestions,
    suggestionTypes,
    addedKeys,
    persistAddedKeys,
  ]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setLastSuggestions([]);
    setSuggestionTypes({});
    setAddedKeys(new Set());
    if (storageKey) {
      clearAiLibraryChatStorage(storageKey);
    }
  }, [storageKey]);

  return {
    chatMessages,
    setChatMessages,
    lastSuggestions,
    setLastSuggestions,
    suggestionTypes,
    setSuggestionTypes,
    addedKeys,
    setAddedKeys,
    clearChat,
  };
}
