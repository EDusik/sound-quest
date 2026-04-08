import { z } from "zod";
import rawCatalog from "@/data/default-audios.json";
import { DEFAULT_AUDIO_CATEGORY_SLUGS } from "@/lib/default-audio-category-slugs";

const categorySlugSchema = z.enum(DEFAULT_AUDIO_CATEGORY_SLUGS);

const defaultCatalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(500),
  sourceUrl: z.string().url(),
  type: categorySlugSchema,
});

const defaultCatalogFileSchema = z.object({
  items: z.array(defaultCatalogItemSchema),
});

export type DefaultCatalogItem = z.infer<typeof defaultCatalogItemSchema>;

function parseCatalog(data: unknown): DefaultCatalogItem[] {
  const parsed = defaultCatalogFileSchema.parse(data);
  return parsed.items;
}

/**
 * Loads the default audio catalog. Currently reads bundled JSON; later can
 * switch to `fetch("/api/defaults")` without changing call sites.
 */
export async function loadDefaultAudios(): Promise<DefaultCatalogItem[]> {
  await Promise.resolve();
  return parseCatalog(rawCatalog);
}
