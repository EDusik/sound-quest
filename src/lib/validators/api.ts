import { z } from "zod";

/** Aligns with docs/plano-api-endpoints-e-banco.md §2.1 */
export const AUDIO_LIBRARY_TYPES = [
  "weather-effects",
  "battle",
  "animals",
  "cities",
  "ambience",
  "music",
  "others",
] as const;

export const audioLibraryTypeSchema = z.enum(AUDIO_LIBRARY_TYPES);

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
