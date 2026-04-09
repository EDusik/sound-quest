"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { AudioRow } from "@/components/audio/AudioRow";
import { Section } from "@/components/landing/Section";
import { Spinner } from "@/components/ui/Spinner";
import { useI18n } from "@/contexts/I18nContext";
import { DEFAULT_AUDIO_CATEGORIES } from "@/lib/default-audio-categories";
import type { DefaultCatalogItem } from "@/lib/default-audio-catalog";
import { loadDefaultAudios } from "@/lib/default-audio-catalog";
import {
  audioItemFromDefaultCatalogItem,
  HOME_DEFAULT_SOUNDS_SCENE_ID,
} from "@/lib/default-item-to-audio-item";
import { queryKeys } from "@/hooks/api/queryKeys";

const PREVIEW_LIMIT = 12;

const ICON_SLOT_REM = 2.75; /* h-11 */

const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function DefaultSoundsRotatingTitleIcon({
  categoriesAlphabetical,
}: {
  categoriesAlphabetical: typeof DEFAULT_AUDIO_CATEGORIES;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const n = categoriesAlphabetical.length;

  /** One extra slot: duplicate of first icon — seamless loop after last. */
  const loopStrip = useMemo(
    () =>
      n === 0
        ? []
        : [...categoriesAlphabetical, categoriesAlphabetical[0]],
    [categoriesAlphabetical, n],
  );

  const [slotIndex, setSlotIndex] = useState(0);
  const [instantJump, setInstantJump] = useState(false);
  const slotIndexRef = useRef(0);

  useEffect(() => {
    slotIndexRef.current = slotIndex;
  }, [slotIndex]);

  useEffect(() => {
    if (reducedMotion || n <= 1) return;
    const id = window.setInterval(() => {
      setSlotIndex((prev) => {
        if (prev < n) return prev + 1;
        return prev;
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, [n, reducedMotion]);

  const onStripTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (slotIndexRef.current !== n) return;
      setInstantJump(true);
      setSlotIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setInstantJump(false));
      });
    },
    [n],
  );

  if (n === 0) return null;

  if (reducedMotion) {
    const { icon: StaticIcon } = categoriesAlphabetical[0];
    return (
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent/25 via-accent/8 to-transparent text-accent shadow-inner"
        aria-hidden
      >
        <StaticIcon className="h-5 w-5" strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <span
      className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-accent/25 via-accent/8 to-transparent text-accent shadow-inner"
      aria-hidden
    >
      <div
        className={
          instantJump
            ? "flex flex-col will-change-transform"
            : "flex flex-col will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)]"
        }
        style={{
          transform: `translateY(-${slotIndex * ICON_SLOT_REM}rem)`,
          transition: instantJump ? "none" : undefined,
        }}
        onTransitionEnd={onStripTransitionEnd}
      >
        {loopStrip.map(({ slug, icon: SlotIcon }, i) => (
          <span
            key={`${slug}-${i}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <SlotIcon className="h-5 w-5" strokeWidth={1.75} />
          </span>
        ))}
      </div>
    </span>
  );
}

function sortForPreview(
  items: DefaultCatalogItem[],
  locale: string,
): DefaultCatalogItem[] {
  const order = new Map(
    DEFAULT_AUDIO_CATEGORIES.map(({ slug }, i) => [slug, i]),
  );
  return [...items].sort((a, b) => {
    const ai = order.get(a.type) ?? 999;
    const bi = order.get(b.type) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, locale, { sensitivity: "base" });
  });
}

export function HomeDefaultSounds() {
  const { t, locale } = useI18n();

  const { data: items, isPending, isError, isSuccess } = useQuery({
    queryKey: queryKeys.defaultAudios,
    queryFn: loadDefaultAudios,
    staleTime: Infinity,
  });

  const previewItems = useMemo(() => {
    if (!items?.length) return [];
    return sortForPreview(items, locale).slice(0, PREVIEW_LIMIT);
  }, [items, locale]);

  const categoriesAlphabetical = useMemo(
    () =>
      [...DEFAULT_AUDIO_CATEGORIES].sort((a, b) =>
        t(`defaultAudioCategory.${a.slug}.title`).localeCompare(
          t(`defaultAudioCategory.${b.slug}.title`),
          locale,
          { sensitivity: "base" },
        ),
      ),
    [t, locale],
  );

  if (isError) return null;

  const showEmptyTeaser = isSuccess && (!items || items.length === 0);

  return (
    <Section
      id="default-sounds"
      headingId="default-sounds-heading"
      title={
        <span className="inline-flex max-w-full flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
          <DefaultSoundsRotatingTitleIcon
            key={`${locale}|${categoriesAlphabetical.map((c) => c.slug).join("|")}`}
            categoriesAlphabetical={categoriesAlphabetical}
          />
          <span>{t("landing.defaultSoundsHeading")}</span>
        </span>
      }
      subtitle={t("landing.defaultSoundsSubheading")}
      centered
      className="border-t border-border bg-card/30"
    >
      <div className="mx-auto mt-8 max-w-4xl text-center md:mt-10">
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-foreground/90 md:text-lg">
          {t("landing.defaultSoundsExplainLead")}
        </p>
      </div>

      {isPending ? (
        <div
          className="mt-12 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-4 py-12 text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-label={t("common.loading")}
        >
          <Spinner />
          <span className="mt-3 text-sm">{t("common.loading")}</span>
        </div>
      ) : showEmptyTeaser ? null : (
        <>
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previewItems.map((item) => (
              <li
                key={item.id}
                className="flex min-h-13 flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/80 px-3 py-2.5 shadow-sm transition-colors hover:border-foreground/15"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`defaultAudioCategory.${item.type}.title`)}
                  </p>
                </div>
                <AudioRow
                  playbackOnly
                  simplifiedPlaybackControls
                  playbackOmitStop
                  playbackOmitVolume
                  compactPlayback
                  audio={audioItemFromDefaultCatalogItem(
                    item,
                    HOME_DEFAULT_SOUNDS_SCENE_ID,
                  )}
                  sceneId={HOME_DEFAULT_SOUNDS_SCENE_ID}
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
