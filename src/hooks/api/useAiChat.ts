"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  streamAiChat,
  type AiChatSuggestion,
  type ChatMessageInput,
} from "@/lib/api/api-client";

export type AiChatStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "done"
  | "error";

export function useAiChat() {
  const [streamingText, setStreamingText] = useState("");
  const [suggestions, setSuggestions] = useState<AiChatSuggestion[]>([]);
  const [status, setStatus] = useState<AiChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const textBufferRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushText = useCallback(() => {
    const text = textBufferRef.current;
    if (text) {
      setStreamingText((prev) => prev + text);
      textBufferRef.current = "";
    }
    flushTimerRef.current = null;
  }, []);

  const sendMessage = useCallback(
    (messages: ChatMessageInput[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreamingText("");
      setSuggestions([]);
      setError(null);
      setStatus("thinking");
      textBufferRef.current = "";

      streamAiChat(messages, {
        signal: controller.signal,
        onStatus: (s) => {
          if (s === "thinking") setStatus("thinking");
        },
        onText: (chunk) => {
          setStatus("streaming");
          textBufferRef.current += chunk;
          if (!flushTimerRef.current) {
            flushTimerRef.current = setTimeout(flushText, 50);
          }
        },
        onSuggestions: (s) => {
          setSuggestions(s);
        },
        onDone: (fullText) => {
          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          flushText();
          setStreamingText((prev) => fullText || prev);
          setStatus("done");
        },
        onError: (err) => {
          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          flushText();
          setError(err);
          setStatus("error");
        },
      });
    },
    [flushText],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    flushText();
    setStatus("idle");
  }, [flushText]);

  const reset = useCallback(() => {
    setStreamingText("");
    setSuggestions([]);
    setError(null);
    setStatus("idle");
    textBufferRef.current = "";
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  return {
    sendMessage,
    streamingText,
    suggestions,
    status,
    error,
    abort,
    reset,
  };
}
