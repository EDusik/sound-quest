import { z } from "zod";

const labelSchema = z.object({
  id: z.string(),
  text: z.string(),
  color: z.string(),
});

export const postSceneBodySchema = z.object({
  /** When set (e.g. migration), upserts this row. */
  id: z.string().min(1).optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(10_000).optional().default(""),
  labels: z.array(labelSchema).optional().default([]),
  slug: z.string().min(1).max(200).optional(),
  order: z.number().int().optional(),
  /** Unix ms; default now */
  createdAt: z.number().optional(),
});

export const patchSceneBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(10_000).optional(),
    labels: z.array(labelSchema).optional(),
    slug: z.string().min(1).max(200).optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one of title, description, labels, slug, or order is required",
  });

export const postAudioBodySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(500),
  sourceUrl: z.string().min(1).max(8000),
  kind: z.enum(["file", "freesound", "youtube", "spotify"]).optional(),
  createdAt: z.number().optional(),
  order: z.number().int().optional(),
});

export const patchAudioBodySchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    sourceUrl: z.string().min(1).max(8000).optional(),
    kind: z.enum(["file", "freesound", "youtube", "spotify"]).optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const reorderIdsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
