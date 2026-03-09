export const queryKeys = {
  scenes: {
    all: ["scenes"] as const,
    list: (userId: string) => ["scenes", userId] as const,
  },
  scene: (sceneId: string) => ["scene", sceneId] as const,
  audios: (sceneId: string) => ["audios", sceneId] as const,
  freesound: {
    search: (query: string, filter?: string, page?: number) =>
      ["freesound", "search", query, filter ?? "", page ?? 1] as const,
  },
  youtube: {
    title: (youtubeId: string) => ["youtube", "title", youtubeId] as const,
  },
} as const;
