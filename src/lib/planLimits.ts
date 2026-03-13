/**
 * Plan limits for upload size, scenes, storage, etc.
 * Used for validation and UI messages. Plan detection can be added later (e.g. from auth/subscription).
 */

export interface UserPlanLimits {
  maxFileSizeMB: number;
  maxScenes?: number;
  maxAudios?: number;
  maxStorageMB?: number;
}

const DEFAULT_MAX_FILE_SIZE_MB = 25;

/** Default limits for the current user (free/default plan). Replace with real plan lookup when available. */
export function getUserPlanLimits(): UserPlanLimits {
  return {
    maxFileSizeMB: DEFAULT_MAX_FILE_SIZE_MB,
  };
}

/** Max allowed upload file size in bytes. */
export function getMaxUploadSizeBytes(): number {
  return getUserPlanLimits().maxFileSizeMB * 1024 * 1024;
}
