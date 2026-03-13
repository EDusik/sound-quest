"use client";

import { useQuery } from "@tanstack/react-query";
import { getScene } from "@/lib/storage";
import { queryKeys } from "./queryKeys";

export function useSceneQuery(
  sceneIdOrSlug: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.scene(sceneIdOrSlug ?? "", userId ?? ""),
    queryFn: () => getScene(sceneIdOrSlug!, userId),
    enabled: !!sceneIdOrSlug,
  });
}
