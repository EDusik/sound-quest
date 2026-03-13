export const queryKeys = {
  scenes: {
    all: ["scenes"] as const,
    list: (userId: string) => ["scenes", userId] as const,
  },
  scene: (sceneIdOrSlug: string, userId?: string) =>
    ["scene", sceneIdOrSlug, userId ?? ""] as const,
  audios: (sceneId: string) => ["audios", sceneId] as const,
  freesound: {
    configured: ["freesound", "configured"] as const,
    search: (query: string, filter?: string, page?: number) =>
      ["freesound", "search", query, filter ?? "", page ?? 1] as const,
  },
  youtube: {
    title: (youtubeId: string) => ["youtube", "title", youtubeId] as const,
  },
} as const;
