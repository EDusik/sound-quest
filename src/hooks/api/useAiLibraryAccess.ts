"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, isRealUser } from "@/contexts/AuthContext";
import { ApiError, fetchLibraryItems } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

/**
 * Uses GET /api/library as a capability probe: 200 → allowed (NEXT_USER_ADMIN), 403 → denied.
 * Shares React Query cache with `useLibraryQuery` (same key for full list).
 */
export function useAiLibraryAccess() {
  const { user } = useAuth();
  const realUser = isRealUser(user);

  const query = useQuery({
    queryKey: queryKeys.library(undefined),
    queryFn: () => fetchLibraryItems(),
    enabled: realUser,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) return false;
      return failureCount < 2;
    },
  });

  const forbidden =
    realUser &&
    query.isError &&
    query.error instanceof ApiError &&
    query.error.status === 403;

  /** Keep treating the user as allowed if we still have cached library data after a failed refetch (e.g. POST then GET hiccup). */
  const hasData = query.data !== undefined;
  const allowed = realUser && !forbidden && (query.isSuccess || hasData);

  const accessError =
    realUser &&
    query.isError &&
    !forbidden &&
    !hasData &&
    (!query.error ||
      !(query.error instanceof ApiError) ||
      query.error.status !== 403);

  return {
    allowed,
    forbidden,
    accessError,
    loading: realUser && query.isLoading,
    isFetched: query.isFetched,
  };
}
