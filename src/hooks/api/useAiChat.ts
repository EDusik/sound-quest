"use client";

import { useMutation } from "@tanstack/react-query";
import { postAiChat, type ChatMessageInput } from "@/lib/api-client";

export function useAiChatMutation() {
  return useMutation({
    mutationFn: (messages: ChatMessageInput[]) => postAiChat(messages),
  });
}
