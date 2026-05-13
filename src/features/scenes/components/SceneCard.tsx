"use client";

import Link from "next/link";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "@/contexts/I18nContext";
import type { Scene } from "@/shared/lib/types";
import { Label } from "@/shared/ui/Label";

const TITLE_MAX_CHARS = 32;
const DESCRIPTION_MAX_CHARS = 50;

function truncate(str: string, max: number) {
  if (str.length > max) return str;
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

  const href = `/scene/${scene.slug ?? scene.id}`;

  return (
    <div className="relative h-[150px] overflow-hidden rounded-tr-xl rounded-br-xl bg-card/50 ring-1 ring-inset ring-border/50 transition hover:bg-card hover:ring-accent/50">
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-tr-xl rounded-br-xl"
        aria-label={t("dashboard.openSceneAria", { title: scene.title })}
      >
        <span className="sr-only">{scene.title}</span>
      </Link>
      <div className="pointer-events-none relative z-10 flex h-full flex-col p-5 pr-12">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(scene)}
            className="pointer-events-auto absolute right-2 top-2 z-20 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-foreground"
            aria-label={t("dashboard.editSceneAria")}
            title={t("dashboard.editScene")}
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
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
      </div>
    </div>
  );
}
