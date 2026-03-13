/**
 * Turns a scene title into a URL-safe slug: lowercase, spaces to hyphens,
 * remove accents and non-alphanumeric, collapse multiple hyphens.
 */
export function slugify(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "scene";
}

/**
 * Returns a slug unique among existing scenes (same userId).
 * If base slug is taken, appends -2, -3, etc.
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
  excludeSlug?: string,
): string {
  const set = new Set(existingSlugs.filter((x) => x !== excludeSlug));
  if (!set.has(baseSlug)) return baseSlug;
  let n = 2;
  while (set.has(`${baseSlug}-${n}`)) n++;
  return `${baseSlug}-${n}`;
}
