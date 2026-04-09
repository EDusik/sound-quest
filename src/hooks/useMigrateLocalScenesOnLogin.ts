"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { migrateLocalDataToSupabase } from "@/lib/storage/storage";
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

  const uid = user?.uid;

  useEffect(() => {
    if (loading || !isConfigured || !isAuthenticated || !uid) return;

    migrateLocalDataToSupabase(uid)
      .then(() => {
        // After a successful migration, refetch scenes for this user so
        // the UI reflects the newly moved data without requiring a reload.
        queryClient.invalidateQueries({
          queryKey: queryKeys.scenes.list(uid),
        });
      })
      .catch((err) => {
        console.error("Failed to migrate local scenes to Supabase:", err);
      });
  }, [uid, isAuthenticated, isConfigured, loading, queryClient]);
}
