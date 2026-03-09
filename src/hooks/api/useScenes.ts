"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getScenes,
  createScene,
  updateScene,
  deleteScene,
  reorderScenes,
} from "@/lib/storage";
import type { Scene } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useScenesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.scenes.list(userId ?? ""),
    queryFn: () => getScenes(userId!),
    enabled: !!userId,
  });
}

export function useCreateSceneMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      labels: Scene["labels"];
    }) => createScene(userId!, data),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.scenes.list(userId) });
      }
    },
  });
}

export function useUpdateSceneMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scene: Scene) => updateScene(scene),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.scenes.list(userId) });
      }
    },
  });
}

export function useDeleteSceneMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sceneId: string) => deleteScene(sceneId),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.scenes.list(userId) });
      }
    },
  });
}

export function useReorderScenesMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderScenes(userId!, orderedIds),
    onMutate: async (orderedIds) => {
      if (!userId) return { previous: undefined as Scene[] | undefined };
      await queryClient.cancelQueries({ queryKey: queryKeys.scenes.list(userId) });
      const previous = queryClient.getQueryData<Scene[]>(
        queryKeys.scenes.list(userId),
      );
      if (!previous) return { previous: undefined };
      const byId = new Map(previous.map((s) => [s.id, s]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((s): s is Scene => s != null);
      const newScenes = reordered.map((s, i) => ({ ...s, order: i }));
      queryClient.setQueryData(queryKeys.scenes.list(userId), newScenes);
      return { previous };
    },
    onError: (_err, _orderedIds, context) => {
      if (userId && context?.previous != null) {
        queryClient.setQueryData(
          queryKeys.scenes.list(userId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.scenes.list(userId) });
      }
    },
  });
}
