"use client";

import { useTranslations } from "@/contexts/I18nContext";
import type { AiChatStatus } from "@/hooks/api";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: AiChatStatus;
  compact?: boolean;
  /** Rodapé integrado ao card de chat */
  embedded?: boolean;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  status,
  compact,
  embedded,
  className,
}: ChatInputProps) {
  const t = useTranslations();
  const busy = status === "thinking" || status === "streaming";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !busy) {
        onSubmit();
      }
    }
  };

  const footer = embedded
    ? compact
      ? "border-t border-border bg-card/50 px-3 py-3"
      : "border-t border-border bg-card/40 px-4 py-4"
    : "";

  const composer =
    "flex items-end gap-2 rounded-2xl border border-border bg-background/60 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[box-shadow,border-color] focus-within:border-primary/40 focus-within:shadow-[inset_0_0_0_1px_rgba(20,184,166,0.12)] dark:bg-card/50 dark:shadow-none dark:focus-within:shadow-[inset_0_0_0_1px_rgba(20,184,166,0.15)]";

  const taMin = compact ? "min-h-[2.75rem] max-h-28" : "min-h-[3.25rem] max-h-36 sm:min-h-16 sm:max-h-40";
  const taRows = compact ? 2 : 3;

  const inner = (
    <div className={composer}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={taRows}
        className={`flex-1 resize-y ${taMin} w-0 min-w-0 border-0 bg-transparent px-1.5 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60`}
        placeholder={t("aiLibrary.chatPlaceholder")}
        disabled={busy}
      />
      <button
        type="button"
        disabled={busy || !value.trim()}
        onClick={onSubmit}
        className={`mb-0.5 shrink-0 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-background shadow-sm transition hover:opacity-95 disabled:opacity-50 ${
          busy ? "animate-pulse" : ""
        }`}
      >
        {busy ? t("aiLibrary.sending") : t("aiLibrary.send")}
      </button>
    </div>
  );

  if (embedded) {
    return (
      <div className={`${footer} ${className ?? ""}`.trim()}>{inner}</div>
    );
  }

  return (
    <div
      className={`flex gap-2 ${compact ? "" : "flex-col sm:flex-row sm:items-end"} ${className ?? ""}`.trim()}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={compact ? 2 : 3}
        className={`flex-1 resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-inner placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15 ${
          compact ? "min-h-10" : "min-h-21"
        }`}
        placeholder={t("aiLibrary.chatPlaceholder")}
        disabled={busy}
      />
      <button
        type="button"
        disabled={busy || !value.trim()}
        onClick={onSubmit}
        className={`shrink-0 self-end rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:opacity-95 disabled:opacity-50 ${
          busy ? "animate-pulse" : ""
        }`}
      >
        {busy ? t("aiLibrary.sending") : t("aiLibrary.send")}
      </button>
    </div>
  );
}
