"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { migrateLocalDataToSupabase } from "@/lib/storage/storage";
import { queryKeys } from "@/hooks/api/queryKeys";

export function useMigrateLocalScenesOnLogin() {
  const { user, isAuthenticated, isConfigured, loading } = useAuth();
  const queryClient = useQueryClient();

  const uid = user?.uid;

  useEffect(() => {
    if (loading || !isConfigured || !isAuthenticated || !uid) return;

    migrateLocalDataToSupabase(uid)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.scenes.list(uid),
        });
      })
      .catch((err) => {
        console.error("Failed to migrate local scenes to Supabase:", err);
      });
  }, [uid, isAuthenticated, isConfigured, loading, queryClient]);
}
