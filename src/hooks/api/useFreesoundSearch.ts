"use client";

import { useMutation } from "@tanstack/react-query";
import { searchFreesound } from "@/lib/freesound";
import type { FreesoundSearchResponse } from "@/lib/freesound";

export interface FreesoundSearchParams {
  query: string;
  filter?: string;
  page?: number;
  pageSize?: number;
}

export function useFreesoundSearchMutation() {
  return useMutation({
    mutationFn: ({
      query,
      filter,
      page = 1,
      pageSize = 20,
    }: FreesoundSearchParams): Promise<FreesoundSearchResponse> =>
      searchFreesound(query, page, pageSize, filter),
  });
}
