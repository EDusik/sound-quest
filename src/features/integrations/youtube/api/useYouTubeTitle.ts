"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

async function fetchYouTubeTitle(youtubeId: string): Promise<string | null> {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    const { data } = await axios.get<{ title?: string }>(oembedUrl);
    return data.title ?? null;
  } catch {
    return null;
  }
}

export function useYouTubeTitleQuery(youtubeId: string | null | undefined) {
  return useQuery({
    queryKey: ["youtube", "title", youtubeId ?? ""] as const,
    queryFn: () => fetchYouTubeTitle(youtubeId!),
    enabled: !!youtubeId,
  });
}

