"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { FreesoundSearchResponse } from "@/lib/audio/providers/freesound";
import { queryKeys } from "./queryKeys";

export interface FreesoundSearchParams {
  query: string;
  filter?: string;
  page?: number;
  pageSize?: number;
}

async function fetchFreesoundSearch(
  query: string,
  page: number,
  pageSize: number,
  filter?: string,
): Promise<FreesoundSearchResponse> {
  const params: Record<string, string> = {
    query: query.trim(),
    page: String(page),
    pageSize: String(Math.min(pageSize, 30)),
  };
  if (filter?.trim()) {
    params.filter = filter.trim();
  }
  try {
    const { data } = await axios.get<FreesoundSearchResponse>(
      "/api/freesound-search",
      { params },
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as { errorCode?: string; error?: string };
      throw new Error(
        body.errorCode ?? body.error ?? `Freesound API error: ${err.response.status}`,
      );
    }
    throw err;
  }
}

export function useFreesoundSearchQuery(params: FreesoundSearchParams | null) {
  const query = params?.query?.trim() ?? "";
  const filter = params?.filter ?? "";
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;

  return useQuery({
    queryKey: queryKeys.freesound.search(query, filter, page),
    queryFn: () =>
      fetchFreesoundSearch(query, page, pageSize, filter || undefined),
    enabled: !!query,
    staleTime: 2 * 60 * 1000,
  });
}
