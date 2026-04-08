"use client";

import { Spinner } from "@/components/ui/Spinner";
import { useTranslations } from "@/contexts/I18nContext";
import type { AiChatStatus } from "@/hooks/api";

interface ChatStatusIndicatorProps {
  status: AiChatStatus;
  compact?: boolean;
}

export function ChatStatusIndicator({
  status,
  compact,
}: ChatStatusIndicatorProps) {
  const t = useTranslations();

  if (status === "idle" || status === "done" || status === "error") {
    return null;
  }

  const label =
    status === "thinking"
      ? t("aiLibrary.statusThinking")
      : t("aiLibrary.statusStreaming");

  return (
    <div
      className={`inline-flex max-w-full flex-nowrap items-center gap-1.5 ${compact ? "py-0" : "py-0.5"}`}
    >
      {status === "thinking" ? (
        <Spinner size={compact ? "xs" : "sm"} />
      ) : (
        <span className="flex shrink-0 gap-0.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
        </span>
      )}
      <span
        className={`min-w-0 truncate text-muted-foreground leading-tight ${compact ? "text-[11px]" : "text-xs"}`}
      >
        {label}
      </span>
    </div>
  );
}
