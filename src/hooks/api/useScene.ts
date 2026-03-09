"use client";

import { useQuery } from "@tanstack/react-query";
import { getScene } from "@/lib/storage";
import { queryKeys } from "./queryKeys";

export function useSceneQuery(sceneId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.scene(sceneId ?? ""),
    queryFn: () => getScene(sceneId!),
    enabled: !!sceneId,
  });
}
