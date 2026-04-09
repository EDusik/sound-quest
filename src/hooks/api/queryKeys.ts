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
  library: (typeFilter?: string) =>
    ["library", typeFilter ?? "all"] as const,
  /** GET /api/library/access — allowlist probe without loading items. */
  libraryAccess: () => ["library", "access"] as const,
  libraryDefaultFavorites: ["library", "defaultFavorites"] as const,
  /** Public list of library items promoted to Default sounds (all users). */
  libraryDefaultFavoritesPublic: ["library", "defaultFavorites", "public"] as const,
  defaultAudios: ["defaultAudios"] as const,
} as const;
