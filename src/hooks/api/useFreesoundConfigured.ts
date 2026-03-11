"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { queryKeys } from "./queryKeys";

async function fetchFreesoundConfigured(): Promise<boolean> {
  try {
    const { data } = await axios.get<{ configured?: boolean }>(
      "/api/freesound-configured",
    );
    return Boolean(data?.configured);
  } catch {
    return false;
  }
}

export function useFreesoundConfiguredQuery() {
  return useQuery({
    queryKey: queryKeys.freesound.configured,
    queryFn: fetchFreesoundConfigured,
    staleTime: 5 * 60 * 1000,
  });
}
