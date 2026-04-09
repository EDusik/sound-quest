"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  addLibraryDefaultFavorite,
  createLibraryItem,
  deleteLibraryItem,
  fetchLibraryDefaultFavorites,
  fetchPublicLibraryDefaultFavorites,
  fetchLibraryItems,
  removeLibraryDefaultFavorite,
  updateLibraryItem,
} from "@/lib/api/api-client";
import { queryKeys } from "@/hooks/api/queryKeys";

export function useLibraryQuery(options: { enabled?: boolean; type?: string }) {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryDefaultFavorites });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryDefaultFavoritesPublic });
    },
  });
}

export function useLibraryDefaultFavoritesQuery(options: { enabled?: boolean }) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.libraryDefaultFavorites,
    queryFn: fetchLibraryDefaultFavorites,
    select: (data) => data.items,
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 403 || error.status === 401))
        return false;
      return failureCount < 2;
    },
  });
}

/** Library items promoted to Default sounds — visible to everyone (incl. guests). */
export function usePublicLibraryDefaultFavoritesQuery(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  return useQuery({
    queryKey: queryKeys.libraryDefaultFavoritesPublic,
    queryFn: fetchPublicLibraryDefaultFavorites,
    select: (data) => data.items,
    staleTime: 60_000,
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 403 || error.status === 401))
        return false;
      return failureCount < 2;
    },
  });
}

export function useAddLibraryDefaultFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addLibraryDefaultFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryDefaultFavorites });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryDefaultFavoritesPublic });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useRemoveLibraryDefaultFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeLibraryDefaultFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryDefaultFavorites });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryDefaultFavoritesPublic });
    },
  });
}

