import type { Scene, AudioItem, Label } from "./types";

export function sceneFromRow(row: {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  labels: unknown;
  created_at: string;
  order: number | null;
  slug?: string | null;
}): Scene {
  const labels = Array.isArray(row.labels) ? (row.labels as Label[]) : [];
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? "",
    labels,
    createdAt: new Date(row.created_at).getTime(),
    order: row.order ?? undefined,
    slug: row.slug ?? undefined,
  };
}

export function audioFromRow(row: {
  id: string;
  scene_id: string;
  name: string;
  source_url: string;
  kind: string | null;
  created_at: string;
  order: number | null;
}): AudioItem {
  return {
    id: row.id,
    sceneId: row.scene_id,
    name: row.name,
    sourceUrl: row.source_url,
    kind: (row.kind as AudioItem["kind"]) ?? "file",
    createdAt: new Date(row.created_at).getTime(),
    order: row.order ?? undefined,
  };
}
