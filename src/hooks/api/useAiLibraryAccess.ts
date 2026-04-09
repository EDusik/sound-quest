"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, isRealUser } from "@/contexts/AuthContext";
import { ApiError, fetchLibraryAccess } from "@/lib/api-client";
import { queryKeys } from "./queryKeys";

/**
 * Uses GET /api/library/access (200 + JSON) so users off the allowlist never hit 403 on /api/library.
 * Full item lists still load via `useLibraryQuery` when the UI needs them.
 */
export function useAiLibraryAccess() {
  const { user } = useAuth();
  const realUser = isRealUser(user);

  const query = useQuery({
    queryKey: queryKeys.libraryAccess(),
    queryFn: () => fetchLibraryAccess(),
    enabled: realUser,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
  });

  const allowed = Boolean(realUser && query.data?.allowed);

  const forbidden = Boolean(
    realUser && query.isSuccess && query.data && !query.data.allowed,
  );

  const accessError = Boolean(realUser && query.isError);

  return {
    allowed,
    forbidden,
    accessError,
    loading: realUser && query.isLoading,
    isFetched: query.isFetched,
  };
}
