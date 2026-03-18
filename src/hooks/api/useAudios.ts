"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAudios,
  addAudio,
  updateAudio,
  removeAudio,
  reorderAudios,
} from "@/lib/storage";
import type { AudioItem, AudioKind } from "@/lib/types";
import { queryKeys } from "./queryKeys";

export function useAudiosQuery(sceneId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.audios(sceneId ?? ""),
    queryFn: () => getAudios(sceneId!),
    enabled: !!sceneId,
  });
}

export function useAddAudioMutation(sceneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      sourceUrl: string;
      kind?: AudioKind;
    }) => addAudio(sceneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audios(sceneId) });
    },
  });
}

/** Add the same audio (name, sourceUrl, kind) to multiple scenes. */
export function useAddAudioToScenesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sceneIds,
      data,
    }: {
      sceneIds: string[];
      data: { name: string; sourceUrl: string; kind?: AudioKind };
    }) => {
      const results = await Promise.all(
        sceneIds.map((sceneId) => addAudio(sceneId, data)),
      );
      return results;
    },
    onSuccess: (_data, variables) => {
      variables.sceneIds.forEach((sceneId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.audios(sceneId) });
      });
    },
  });
}

export function useUpdateAudioMutation(sceneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (audio: AudioItem) => updateAudio(audio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audios(sceneId) });
    },
  });
}

export function useRemoveAudioMutation(sceneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (audioId: string) => removeAudio(audioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audios(sceneId) });
    },
  });
}

export function useReorderAudiosMutation(sceneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderAudios(sceneId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.audios(sceneId) });
      const previous = queryClient.getQueryData<AudioItem[]>(
        queryKeys.audios(sceneId),
      );
      if (!previous) return { previous: undefined };
      const byId = new Map(previous.map((a) => [a.id, a]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((a): a is AudioItem => a != null);
      const newAudios = reordered.map((a, i) => ({ ...a, order: i }));
      const restIds = new Set(orderedIds);
      const rest = previous
        .filter((a) => !restIds.has(a.id))
        .map((a, i) => ({ ...a, order: reordered.length + i }));
      const result = [...newAudios, ...rest];
      queryClient.setQueryData(queryKeys.audios(sceneId), result);
      return { previous };
    },
    onError: (_err, _orderedIds, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(queryKeys.audios(sceneId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audios(sceneId) });
    },
  });
}
