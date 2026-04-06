"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
  useAddAudioMutation,
  useAiChatMutation,
  useCreateLibraryItemMutation,
  useDeleteLibraryItemMutation,
  useLibraryQuery,
} from "@/hooks/api";
import type { ChatMessageInput } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import type { AudioLibraryItem } from "@/lib/audio-library-map";
import { useTranslations } from "@/contexts/I18nContext";
import { useAuth, isRealUser } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { extractYouTubeId } from "@/lib/youtube";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

function formatLibraryType(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface AiLibraryPanelProps {
  sceneId: string;
  open: boolean;
  onSceneAudioAdded: () => Promise<void>;
}

export function AiLibraryPanel({
  sceneId,
  open,
  onSceneAudioAdded,
}: AiLibraryPanelProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const realUser = isRealUser(user);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageInput[]>([]);
  const [lastSuggestions, setLastSuggestions] = useState<
    { name: string; sourceUrl: string; source: string }[]
  >([]);
  const [suggestionTypes, setSuggestionTypes] = useState<
    Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]>
  >({});

  const libraryTypeFilter = typeFilter || undefined;
  const {
    data: libraryItems = [],
    isLoading: libraryLoading,
    error: libraryError,
  } = useLibraryQuery({
    enabled: open && realUser,
    type: libraryTypeFilter,
  });

  const chatMutation = useAiChatMutation();
  const createLibraryMutation = useCreateLibraryItemMutation();
  const deleteLibraryMutation = useDeleteLibraryItemMutation();
  const addAudioMutation = useAddAudioMutation(sceneId);

  const forbidden = useMemo(() => {
    if (!libraryError) return false;
    return (
      libraryError instanceof ApiError && libraryError.status === 403
    );
  }, [libraryError]);

  const libraryErrorMessage = useMemo(() => {
    if (!libraryError || forbidden) return null;
    return getErrorMessage(libraryError, t("aiLibrary.loadFailed"));
  }, [libraryError, forbidden, t]);

  const setSuggestionType = useCallback(
    (index: number, value: (typeof AUDIO_LIBRARY_TYPES)[number]) => {
      setSuggestionTypes((prev) => ({ ...prev, [index]: value }));
    },
    [],
  );

  const addUrlToScene = useCallback(
    async (name: string, sourceUrl: string) => {
      const ytId = extractYouTubeId(sourceUrl.trim());
      await addAudioMutation.mutateAsync({
        name,
        sourceUrl: ytId ?? sourceUrl.trim(),
        kind: ytId ? "youtube" : "file",
      });
      await onSceneAudioAdded();
      toast.success(t("aiLibrary.addedToScene"));
    },
    [addAudioMutation, onSceneAudioAdded, t],
  );

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatMutation.isPending) return;
    const nextMessages: ChatMessageInput[] = [
      ...chatMessages,
      { role: "user", content: text },
    ];
    setChatInput("");
    try {
      const data = await chatMutation.mutateAsync(nextMessages);
      setChatMessages([
        ...nextMessages,
        { role: "assistant", content: data.message.content },
      ]);
      setLastSuggestions(data.suggestions ?? []);
      setSuggestionTypes({});
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("aiLibrary.forbidden"));
      } else {
        toast.error(getErrorMessage(err, t("aiLibrary.chatFailed")));
      }
    }
  };

  const handleAddSuggestionToLibrary = async (
    s: { name: string; sourceUrl: string; source: string },
    index: number,
  ) => {
    const type = suggestionTypes[index] ?? "others";
    try {
      await createLibraryMutation.mutateAsync({
        name: s.name,
        sourceUrl: s.sourceUrl,
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
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          {t("aiLibrary.signInHint")}
        </p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection summary={t("aiLibrary.sectionTitle")}>
      <div className="space-y-6 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          {t("aiLibrary.sectionDescription")}
        </p>

        <div>
          <h3 className="mb-2 text-xs font-medium text-foreground">
            {t("aiLibrary.chatHeading")}
          </h3>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded border border-border bg-background/50 p-2 text-sm">
            {chatMessages.length === 0 ? (
              <p className="text-muted-foreground">{t("aiLibrary.chatEmpty")}</p>
            ) : (
              chatMessages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={
                    m.role === "user"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  <span className="font-medium">
                    {m.role === "user" ? "You" : "Assistant"}:
                  </span>{" "}
                  {m.content}
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendChat} className="mt-2 flex gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={2}
              className="min-h-10 flex-1 resize-y rounded border border-border bg-card px-3 py-2 text-sm text-foreground"
              placeholder={t("aiLibrary.chatPlaceholder")}
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              disabled={chatMutation.isPending || !chatInput.trim()}
              className="self-end rounded-lg bg-accent px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {chatMutation.isPending
                ? t("aiLibrary.sending")
                : t("aiLibrary.send")}
            </button>
          </form>
        </div>

        {lastSuggestions.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-foreground">
              {t("aiLibrary.suggestions")}
            </h3>
            <ul className="space-y-3">
              {lastSuggestions.map((s, index) => (
                <li
                  key={`${s.sourceUrl}-${index}`}
                  className="rounded border border-border p-2 text-sm"
                >
                  <div className="font-medium text-foreground">{s.name}</div>
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-accent hover:underline"
                  >
                    {s.sourceUrl}
                  </a>
                  {s.source ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.source}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      {t("aiLibrary.typeLabel")}
                      <select
                        value={suggestionTypes[index] ?? "others"}
                        onChange={(e) =>
                          setSuggestionType(
                            index,
                            e.target.value as (typeof AUDIO_LIBRARY_TYPES)[number],
                          )
                        }
                        className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground"
                      >
                        {AUDIO_LIBRARY_TYPES.map((ty) => (
                          <option key={ty} value={ty}>
                            {formatLibraryType(ty)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={createLibraryMutation.isPending}
                      onClick={() => handleAddSuggestionToLibrary(s, index)}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-card"
                    >
                      {t("aiLibrary.addToLibrary")}
                    </button>
                    <button
                      type="button"
                      disabled={addAudioMutation.isPending}
                      onClick={() => addUrlToScene(s.name, s.sourceUrl)}
                      className="rounded border border-accent px-2 py-1 text-xs text-accent hover:bg-card"
                    >
                      {t("aiLibrary.addToScene")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-medium text-foreground">
              {t("aiLibrary.savedLibrary")}
            </h3>
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
                    {formatLibraryType(ty)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {forbidden ? (
            <p className="text-sm text-muted-foreground">
              {t("aiLibrary.forbidden")}
            </p>
          ) : libraryErrorMessage ? (
            <p className="text-sm text-red-400" role="alert">
              {libraryErrorMessage}
            </p>
          ) : libraryLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : libraryItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("aiLibrary.emptyLibrary")}
            </p>
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
                      {formatLibraryType(item.type)}
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
