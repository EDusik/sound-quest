"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";
import { ChatMessageList } from "@/features/ai/components/ChatMessageList";
import { ChatInput } from "@/features/ai/components/ChatInput";
import { SuggestionList } from "@/features/ai/components/SuggestionList";
import { useAuth, isRealUser, getUserChatLabel } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { useAiChat, useAdminFeatures, useCreateLibraryItemMutation } from "@/hooks/api";
import { usePersistedAiLibraryChat } from "@/hooks/usePersistedAiLibraryChat";
import type { AiChatSuggestion, ChatMessageInput } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/utils/errors";
import { libraryStorageUrlFromAiSuggestion } from "@/lib/ai/library-storage-url-from-ai-suggestion";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

export function LibraryAiChatPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const realUser = isRealUser(user);
  const { forbidden, accessError, loading: accessLoading } = useAdminFeatures();

  const chatUserId = realUser && user ? user.uid : undefined;
  const {
    chatMessages,
    setChatMessages,
    lastSuggestions,
    setLastSuggestions,
    suggestionTypes,
    setSuggestionTypes,
    addedKeys,
    setAddedKeys,
    clearChat: clearPersistedChat,
  } = usePersistedAiLibraryChat({
    userId: chatUserId,
    variant: "page",
    persistAddedKeys: true,
  });

  const [chatInput, setChatInput] = useState("");

  const {
    sendMessage,
    streamingText,
    suggestions,
    status,
    error,
    abort,
    reset,
  } = useAiChat();

  const createLibraryMutation = useCreateLibraryItemMutation();

  const suggestionsRef = useRef(suggestions);
  useLayoutEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  useEffect(() => {
    if (status === "done" && streamingText) {
      const latestSuggestions = suggestionsRef.current;
      setChatMessages((prev) => [...prev, { role: "assistant", content: streamingText }]);
      setLastSuggestions(latestSuggestions);
      setSuggestionTypes({});
      setAddedKeys(new Set());
      reset();
    }
  }, [
    status,
    streamingText,
    reset,
    setAddedKeys,
    setChatMessages,
    setLastSuggestions,
    setSuggestionTypes,
  ]);

  useEffect(() => {
    if (status === "error" && error) {
      if (error === "forbidden") {
        toast.error(t("aiLibrary.forbidden"));
      } else {
        toast.error(getErrorMessage(error, t("aiLibrary.chatFailed")));
      }
      if (streamingText) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: streamingText }]);
      }
      reset();
    }
  }, [status, error, streamingText, reset, t, setChatMessages]);

  const setSuggestionType = useCallback(
    (index: number, value: (typeof AUDIO_LIBRARY_TYPES)[number]) => {
      setSuggestionTypes((prev) => ({ ...prev, [index]: value }));
    },
    [setSuggestionTypes],
  );

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || status === "thinking" || status === "streaming") return;

    const nextMessages: ChatMessageInput[] = [...chatMessages, { role: "user", content: text }];

    setChatInput("");
    setChatMessages(nextMessages);
    sendMessage(nextMessages);
  }, [chatInput, chatMessages, status, sendMessage, setChatMessages]);

  const canClearChat =
    chatMessages.length > 0 ||
    lastSuggestions.length > 0 ||
    Boolean(streamingText) ||
    chatInput.trim().length > 0 ||
    status === "thinking" ||
    status === "streaming" ||
    status === "error";

  const handleClearChat = useCallback(() => {
    abort();
    reset();
    setChatInput("");
    clearPersistedChat();
  }, [abort, reset, clearPersistedChat]);

  const handleAddSuggestionToLibrary = async (s: AiChatSuggestion, index: number) => {
    const type = suggestionTypes[index] ?? "ambience";
    const key = `${s.sourceUrl}::${index}`;
    try {
      await createLibraryMutation.mutateAsync({
        name: s.name,
        sourceUrl: libraryStorageUrlFromAiSuggestion(s),
        type,
      });
      setAddedKeys((prev) => new Set(prev).add(key));
      toast.success(t("aiLibrary.savedToLibrary"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t("aiLibrary.forbidden"));
      } else {
        toast.error(getErrorMessage(err, t("aiLibrary.saveFailed")));
      }
    }
  };

  if (!realUser) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel="SoundQuest"
        />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-muted-foreground">{t("libraryPage.signInToView")}</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-accent underline hover:opacity-90"
          >
            {t("nav.signIn")}
          </Link>
        </section>
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel="SoundQuest"
        />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </section>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel="SoundQuest"
        />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-muted-foreground">{t("libraryPage.accessError")}</p>
        </section>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel="SoundQuest"
        />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-lg font-semibold text-foreground">
            {t("libraryPage.unavailableTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("aiLibrary.forbidden")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Navbar
        logo={<SoundQuestLogo />}
        logoHref="/dashboard"
        logoAriaLabel="SoundQuest"
      />
      <section className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-xl font-semibold text-accent">{t("libraryPage.aiPageTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("libraryPage.aiPageDescription")}</p>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_28px_rgba(15,23,42,0.07)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-3 border-b border-border bg-linear-to-r from-accent/12 via-card to-accent/8 px-4 py-3.5 dark:from-accent/30 dark:via-accent/12 dark:to-accent/18 sm:items-center sm:gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-accent shadow-sm"
                aria-hidden
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {t("aiLibrary.chatHeading")}
                </h2>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
                  {t("aiLibrary.chatSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearChat}
                disabled={!canClearChat}
                className="shrink-0 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
                aria-label={t("aiLibrary.clearChat")}
              >
                {t("aiLibrary.clearChat")}
              </button>
            </div>
            <div className="flex min-h-0 flex-col">
              <ChatMessageList
                embedded
                messages={chatMessages}
                streamingText={streamingText}
                status={status}
                userLabel={getUserChatLabel(user)}
              />
              <ChatInput
                embedded
                value={chatInput}
                onChange={setChatInput}
                onSubmit={handleSendChat}
                status={status}
              />
            </div>
          </div>

          {lastSuggestions.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-foreground">{t("aiLibrary.suggestions")}</h2>
              <SuggestionList
                suggestions={lastSuggestions}
                suggestionTypes={suggestionTypes}
                addedKeys={addedKeys}
                onSetType={setSuggestionType}
                onAddToLibrary={handleAddSuggestionToLibrary}
                isAddingToLibrary={createLibraryMutation.isPending}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

