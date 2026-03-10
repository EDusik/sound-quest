"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export function useFreesoundConfiguredQuery() {
  return useQuery({
    queryKey: queryKeys.freesound.configured,
    queryFn: async (): Promise<boolean> => {
      const res = await fetch("/api/freesound-configured");
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean((data as { configured?: boolean }).configured);
    },
    staleTime: 5 * 60 * 1000,
  });
}
