import { z } from "zod";
import { DEFAULT_AUDIO_CATEGORY_SLUGS } from "@/lib/default-audio-category-slugs";

const defaultAudioCategorySlugSchema = z.enum(
  DEFAULT_AUDIO_CATEGORY_SLUGS as unknown as [string, ...string[]],
);

export { defaultAudioCategorySlugSchema };

/** Same slugs as the default sounds catalog (`DEFAULT_AUDIO_CATEGORY_SLUGS`). */
export const AUDIO_LIBRARY_TYPES = DEFAULT_AUDIO_CATEGORY_SLUGS;

export const audioLibraryTypeSchema = defaultAudioCategorySlugSchema;

export const getLibraryQuerySchema = z.object({
  type: audioLibraryTypeSchema.optional(),
});

export const postLibraryBodySchema = z.object({
  name: z.string().min(1).max(500),
  sourceUrl: z.string().url(),
  type: audioLibraryTypeSchema,
});

export const patchLibraryBodySchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    type: audioLibraryTypeSchema.optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one of name, type, or order is required",
  });

export const libraryIdParamSchema = z.object({
  id: z.string().min(1),
});

export const postLibraryDefaultFavoriteBodySchema = z.object({
  libraryItemId: z.string().min(1),
  category: defaultAudioCategorySlugSchema,
  displayName: z.string().min(1).max(500),
});

const chatRoleSchema = z.enum(["user", "assistant", "system"]);

export const postAiChatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: chatRoleSchema,
        content: z.string().min(1).max(100_000),
      }),
    )
    .min(1)
    .max(50),
});

export const aiChatSuggestionSchema = z.object({
  name: z.string(),
  sourceUrl: z.string().url(),
  source: z.string(),
});

export const aiChatResponseSchema = z.object({
  message: z.object({
    role: z.literal("assistant"),
    content: z.string(),
  }),
  suggestions: z.array(aiChatSuggestionSchema),
});
