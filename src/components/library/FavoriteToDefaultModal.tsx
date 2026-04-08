"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/contexts/I18nContext";
import { DEFAULT_AUDIO_CATEGORIES } from "@/lib/default-audio-categories";
import type { DefaultAudioCategorySlug } from "@/lib/default-audio-category-slugs";
import type { AudioLibraryItem } from "@/lib/audio-library-map";
import { suggestedDefaultCategoryFromLibraryType } from "@/lib/suggested-default-category";

type Props = {
  open: boolean;
  item: AudioLibraryItem | null;
  onClose: () => void;
  onConfirm: (payload: {
    displayName: string;
    category: DefaultAudioCategorySlug;
  }) => void | Promise<void>;
  loading?: boolean;
};

export function FavoriteToDefaultModal({
  open,
  item,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const { t, locale } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<DefaultAudioCategorySlug>("ambience");

  // Reset form when the modal opens with a new item (adjusting state during render,
  // React's recommended alternative to useEffect + setState for derived state).
  const [prevItemId, setPrevItemId] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);
  if (item && open && (item.id !== prevItemId || open !== prevOpen)) {
    setPrevItemId(item.id);
    setPrevOpen(open);
    setDisplayName(item.name);
    setCategory(suggestedDefaultCategoryFromLibraryType(item.type));
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    void onConfirm({ displayName: trimmed, category });
  };

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={t("libraryPage.addToDefaultSoundsTitle")}
      titleId="favorite-default-modal-title"
      maxWidth="max-w-xl"
      panelClassName="max-h-[90vh] overflow-y-auto"
      showCloseButton={!loading}
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2">
        <p className="mb-4 text-sm text-muted-foreground">
          {t("libraryPage.addToDefaultSoundsDescription")}
        </p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            {t("libraryPage.defaultSoundsDisplayName")}
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            disabled={loading}
            maxLength={500}
            autoComplete="off"
          />
        </label>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">
            {t("libraryPage.defaultSoundsCategory")}
          </legend>
          <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
            {categoriesAlphabetical.map(({ slug }) => {
              const fieldId = `default-cat-${slug}`;
              const selected = category === slug;
              return (
                <label
                  key={slug}
                  htmlFor={fieldId}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition ${
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-card/60"
                  }`}
                >
                  <input
                    id={fieldId}
                    type="radio"
                    name="default-category"
                    checked={selected}
                    onChange={() => setCategory(slug)}
                    disabled={loading}
                    className="mt-1 accent-accent"
                  />
                  <span>
                    <span className="block font-medium text-foreground">
                      {t(`defaultAudioCategory.${slug}.title`)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t(`defaultAudioCategory.${slug}.subtitle`)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:bg-border disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("libraryPage.addToDefaultSoundsConfirm")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
