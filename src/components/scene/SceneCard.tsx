"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";
import type { Scene } from "@/lib/types";
import { Label } from "@/components/ui/Label";
import { useTranslations } from "@/contexts/I18nContext";

const TITLE_MAX_CHARS = 32;
const DESCRIPTION_MAX_CHARS = 50;

function truncate(str: string, max: number) {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

export function SceneCard({
  scene,
  onEdit,
}: {
  scene: Scene;
  onEdit?: (scene: Scene) => void;
}) {
  const t = useTranslations();
  const isNarrow = useMediaQuery("(max-width: 2024px)");
  const title = isNarrow ? truncate(scene.title, TITLE_MAX_CHARS) : scene.title;
  const description =
    scene.description && isNarrow
      ? truncate(scene.description, DESCRIPTION_MAX_CHARS)
      : (scene.description ?? null);

  return (
    <Link
      href={`/scene/${scene.slug ?? scene.id}`}
      className="relative h-[150px] block rounded-tr-xl rounded-br-xl ring-1 ring-inset ring-border/50 bg-card/50 p-5 pr-12 transition hover:ring-accent/50 hover:bg-card overflow-hidden"
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(scene);
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-border hover:text-foreground"
          aria-label={t("dashboard.editSceneAria")}
          title={t("dashboard.editScene")}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      )}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {scene.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scene.labels.map((label) => (
            <Label key={label.id} {...label} />
          ))}
        </div>
      )}
    </Link>
  );
}
