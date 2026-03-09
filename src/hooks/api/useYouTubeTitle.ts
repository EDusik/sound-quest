"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchYouTubeTitle } from "@/lib/api/youtube";
import { queryKeys } from "./queryKeys";

export function useYouTubeTitleQuery(youtubeId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.youtube.title(youtubeId ?? ""),
    queryFn: () => fetchYouTubeTitle(youtubeId!),
    enabled: !!youtubeId,
  });
}
