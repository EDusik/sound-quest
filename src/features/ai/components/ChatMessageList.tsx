"use client";

import { useEffect, useRef } from "react";
import type { ChatMessageInput } from "@/lib/api/api-client";
import type { AiChatStatus } from "@/hooks/api";
import { useTranslations } from "@/contexts/I18nContext";
import { ChatStatusIndicator } from "./ChatStatusIndicator";

interface ChatMessageListProps {
  messages: ChatMessageInput[];
  streamingText: string;
  status: AiChatStatus;
  compact?: boolean;
  /** Dentro do card: sem borda duplicada, área com mais respiro */
  embedded?: boolean;
  className?: string;
  /** Label above user messages; falls back to translated "You" when omitted. */
  userLabel?: string | null;
}

export function ChatMessageList({
  messages,
  streamingText,
  status,
  compact,
  embedded,
  className,
  userLabel,
}: ChatMessageListProps) {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingText, status]);

  const isEmpty = messages.length === 0 && !streamingText && status === "idle";

  const scrollHeights = embedded
    ? compact
      ? "max-h-20 min-h-[3.5rem]"
      : "min-h-[min(21vh,160px)] max-h-[min(25vh,240px)]"
    : compact
      ? "max-h-40"
      : "max-h-80 min-h-[200px]";

  const shellClass = embedded
    ? `space-y-4 overflow-y-auto bg-gradient-to-b from-background/20 to-transparent px-4 py-5 ${scrollHeights}`
    : `space-y-3 overflow-y-auto rounded-lg border border-border bg-card/40 p-3 ${scrollHeights}`;

  const userBubble =
    "max-w-[min(92%,28rem)] rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm font-normal text-background shadow-sm whitespace-pre-wrap";
  const assistantBubble =
    "max-w-[min(92%,28rem)] rounded-2xl rounded-bl-md border border-border border-l-[3px] border-l-accent bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm whitespace-pre-wrap";

  return (
    <div ref={scrollRef} className={`${shellClass} ${className ?? ""}`.trim()}>
      {isEmpty ? (
        <div className="flex min-h-[inherit] flex-col items-center justify-center gap-2 px-2 py-4 text-center sm:py-6">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-card/80 text-accent shadow-sm"
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
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("aiLibrary.chatEmpty")}
          </p>
        </div>
      ) : (
        <>
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <span
                className={`px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                {m.role === "user"
                  ? userLabel?.trim() || t("aiLibrary.roleUser")
                  : t("aiLibrary.roleAssistant")}
              </span>
              <div className={m.role === "user" ? userBubble : assistantBubble}>
                {m.content}
              </div>
            </div>
          ))}

          {(status === "streaming" || status === "thinking") && streamingText && (
            <div className="flex flex-col items-start gap-1">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("aiLibrary.roleAssistant")}
              </span>
              <div className={`${assistantBubble} relative`}>
                {streamingText}
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-accent align-[-2px]" />
              </div>
            </div>
          )}

          {(status === "thinking" || status === "streaming") && !streamingText && (
            <div className="flex flex-col items-start gap-0.5">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("aiLibrary.roleAssistant")}
              </span>
              <div className="rounded-2xl rounded-bl-md border border-border border-l-[3px] border-l-accent bg-card px-2.5 py-1 shadow-sm">
                <ChatStatusIndicator status={status} compact={compact} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

