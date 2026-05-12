"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { useAddAudioMutation, useAiChat, useCreateLibraryItemMutation, useDeleteLibraryItemMutation, useLibraryQuery } from "@/hooks/api";
import { usePersistedAiLibraryChat } from "@/hooks/usePersistedAiLibraryChat";
import type { AiChatSuggestion, ChatMessageInput } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-client";
import type { AudioLibraryItem } from "@/lib/audio/mappers/audio-library-map";
import { useTranslations } from "@/contexts/I18nContext";
import { useAuth, isRealUser, getUserChatLabel } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/utils/errors";
import { libraryStorageUrlFromAiSuggestion } from "@/lib/ai/library-storage-url-from-ai-suggestion";
import { extractYouTubeId } from "@/lib/audio/providers/youtube";
import { formatLibraryType } from "@/lib/audio/mappers/format-library-type";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { SuggestionList } from "./SuggestionList";

interface AiLibraryPanelProps {
  sceneId: string;
  open: boolean;
  onSceneAudioAdded: () => Promise<void>;
}

export function AiLibraryPanel({ sceneId, open, onSceneAudioAdded }: AiLibraryPanelProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const realUser = isRealUser(user);
  const chatUserId = realUser && user ? user.uid : undefined;
  const {
    chatMessages,
    setChatMessages,
    lastSuggestions,
    setLastSuggestions,
    suggestionTypes,
    setSuggestionTypes,
  } = usePersistedAiLibraryChat({
    userId: chatUserId,
    variant: "scene",
    sceneId,
    persistAddedKeys: false,
  });

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [chatInput, setChatInput] = useState("");

  const libraryTypeFilter = typeFilter || undefined;
  const {
    data: libraryItems = [],
    isLoading: libraryLoading,
    error: libraryError,
  } = useLibraryQuery({
    enabled: open && realUser,
    type: libraryTypeFilter,
  });

  const { sendMessage, streamingText, suggestions, status: chatStatus, error: chatError, reset: resetChat } =
    useAiChat();

  const createLibraryMutation = useCreateLibraryItemMutation();
  const deleteLibraryMutation = useDeleteLibraryItemMutation();
  const addAudioMutation = useAddAudioMutation(sceneId);

  const suggestionsRef = useRef(suggestions);
  useLayoutEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  useEffect(() => {
    if (chatStatus === "done" && streamingText) {
      const latestSuggestions = suggestionsRef.current;
      setChatMessages((prev) => [...prev, { role: "assistant", content: streamingText }]);
      setLastSuggestions(latestSuggestions);
      setSuggestionTypes({});
      resetChat();
    }
  }, [
    chatStatus,
    streamingText,
    resetChat,
    setChatMessages,
    setLastSuggestions,
    setSuggestionTypes,
  ]);

  useEffect(() => {
    if (chatStatus === "error" && chatError) {
      if (chatError === "forbidden") {
        toast.error(t("aiLibrary.forbidden"));
      } else {
        toast.error(getErrorMessage(chatError, t("aiLibrary.chatFailed")));
      }
      if (streamingText) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: streamingText }]);
      }
      resetChat();
    }
  }, [chatStatus, chatError, streamingText, resetChat, t, setChatMessages]);

  const forbidden = useMemo(() => {
    if (!libraryError) return false;
    return libraryError instanceof ApiError && libraryError.status === 403;
  }, [libraryError]);

  const libraryErrorMessage = useMemo(() => {
    if (!libraryError || forbidden) return null;
    return getErrorMessage(libraryError, t("aiLibrary.loadFailed"));
  }, [libraryError, forbidden, t]);

  const setSuggestionType = useCallback(
    (index: number, value: (typeof AUDIO_LIBRARY_TYPES)[number]) => {
      setSuggestionTypes((prev) => ({ ...prev, [index]: value }));
    },
    [setSuggestionTypes],
  );

  const addUrlToScene = useCallback(
    async (name: string, sourceUrl: string) => {
      const resolved = sourceUrl.trim();
      const ytId = extractYouTubeId(resolved);
      await addAudioMutation.mutateAsync({
        name,
        sourceUrl: ytId ?? resolved,
        kind: ytId ? "youtube" : "file",
      });
      await onSceneAudioAdded();
      toast.success(t("aiLibrary.addedToScene"));
    },
    [addAudioMutation, onSceneAudioAdded, t],
  );

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || chatStatus === "thinking" || chatStatus === "streaming") return;

    const nextMessages: ChatMessageInput[] = [...chatMessages, { role: "user", content: text }];

    setChatInput("");
    setChatMessages(nextMessages);
    sendMessage(nextMessages);
  }, [chatInput, chatMessages, chatStatus, sendMessage, setChatMessages]);

  const handleAddSuggestionToLibrary = async (s: AiChatSuggestion, index: number) => {
    const type = suggestionTypes[index] ?? "ambience";
    try {
      await createLibraryMutation.mutateAsync({
        name: s.name,
        sourceUrl: libraryStorageUrlFromAiSuggestion(s),
        type,
      });
      toast.success(t("aiLibrary.savedToLibrary"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("aiLibrary.forbidden"));
      } else {
        toast.error(getErrorMessage(err, t("aiLibrary.saveFailed")));
      }
    }
  };

  const handleDeleteLibraryItem = async (item: AudioLibraryItem) => {
    try {
      await deleteLibraryMutation.mutateAsync(item.id);
      toast.success(t("aiLibrary.removedFromLibrary"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("aiLibrary.deleteFailed")));
    }
  };

  if (!realUser) {
    return (
      <CollapsibleSection summary={t("aiLibrary.sectionTitle")}>
        <p className="px-4 py-3 text-sm text-muted-foreground">
          {t("aiLibrary.signInHint")}
        </p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection summary={t("aiLibrary.sectionTitle")}>
      <div className="space-y-6 p-4">
        <p className="text-xs text-muted-foreground">{t("aiLibrary.sectionDescription")}</p>

        <div className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-sm">
          <div className="border-b border-border bg-linear-to-r from-accent/10 to-accent/5 px-3 py-2 dark:from-accent/28 dark:to-accent/14">
            <h3 className="text-xs font-semibold text-foreground">{t("aiLibrary.chatHeading")}</h3>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {t("aiLibrary.chatSubtitle")}
            </p>
          </div>
          <ChatMessageList
            embedded
            messages={chatMessages}
            streamingText={streamingText}
            status={chatStatus}
            compact
            userLabel={getUserChatLabel(user)}
          />
          <ChatInput
            embedded
            value={chatInput}
            onChange={setChatInput}
            onSubmit={handleSendChat}
            status={chatStatus}
            compact
          />
        </div>

        {lastSuggestions.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-foreground">{t("aiLibrary.suggestions")}</h3>
            <SuggestionList
              suggestions={lastSuggestions}
              suggestionTypes={suggestionTypes}
              onSetType={setSuggestionType}
              onAddToLibrary={handleAddSuggestionToLibrary}
              onAddToScene={addUrlToScene}
              isAddingToLibrary={createLibraryMutation.isPending}
              compact
            />
          </div>
        )}

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-medium text-foreground">{t("aiLibrary.savedLibrary")}</h3>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              {t("aiLibrary.filterLabel")}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground"
              >
                <option value="">{t("aiLibrary.filterAll")}</option>
                {AUDIO_LIBRARY_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {formatLibraryType(ty, t)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {forbidden ? (
            <p className="text-sm text-muted-foreground">{t("aiLibrary.forbidden")}</p>
          ) : libraryErrorMessage ? (
            <p className="text-sm text-red-400" role="alert">
              {libraryErrorMessage}
            </p>
          ) : libraryLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : libraryItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("aiLibrary.emptyLibrary")}</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {libraryItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded border border-border p-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatLibraryType(item.type, t)}
                    </div>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-accent hover:underline"
                    >
                      {item.sourceUrl}
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={addAudioMutation.isPending}
                      onClick={() => addUrlToScene(item.name, item.sourceUrl)}
                      className="rounded border border-accent px-2 py-1 text-xs text-accent hover:bg-card"
                    >
                      {t("aiLibrary.addToScene")}
                    </button>
                    <button
                      type="button"
                      disabled={deleteLibraryMutation.isPending}
                      onClick={() => handleDeleteLibraryItem(item)}
                      className="rounded border border-border px-2 py-1 text-xs text-red-400 hover:bg-card"
                    >
                      {t("aiLibrary.removeFromLibrary")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}

