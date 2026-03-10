"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { migrateLocalDataToSupabase } from "@/lib/storage";
import { queryKeys } from "@/hooks/api/queryKeys";

/**
 * Hook that, once the user is authenticated with Supabase, asks the
 * storage layer to migrate any existing localStorage-based scenes and
 * audios into Supabase.
 *
 * A versioned per-user flag inside migrateLocalDataToSupabase prevents
 * repeated work, so this hook can safely call it on every auth change.
 */
export function useMigrateLocalScenesOnLogin() {
  const { user, isAuthenticated, isConfigured, loading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading || !isConfigured || !isAuthenticated || !user?.uid) return;

    migrateLocalDataToSupabase(user.uid)
      .then(() => {
        // After a successful migration, refetch scenes for this user so
        // the UI reflects the newly moved data without requiring a reload.
        queryClient.invalidateQueries({
          queryKey: queryKeys.scenes.list(user.uid),
        });
      })
      .catch((err) => {
        console.error("Failed to migrate local scenes to Supabase:", err);
      });
  }, [user, isAuthenticated, isConfigured, loading, queryClient]);
}
