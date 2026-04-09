import { QueryClient } from "@tanstack/react-query";

const RETRY_COUNT = 3;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: RETRY_COUNT,
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
    },
    mutations: {
      retry: RETRY_COUNT,
    },
  },
});

