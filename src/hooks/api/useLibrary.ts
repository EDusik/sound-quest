"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  createLibraryItem,
  deleteLibraryItem,
  fetchLibraryItems,
  updateLibraryItem,
} from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

export function useLibraryQuery(options: {
  enabled?: boolean;
  type?: string;
}) {
  const { enabled = true, type } = options;
  return useQuery({
    queryKey: queryKeys.library(type),
    queryFn: () => fetchLibraryItems(type),
    enabled,
    select: (data) => data.items,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useCreateLibraryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLibraryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useUpdateLibraryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      type?: string;
      order?: number;
    }) => updateLibraryItem(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useDeleteLibraryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLibraryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}
