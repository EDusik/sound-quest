"use client";

import { type FormEvent } from "react";
import type { Label } from "@/shared/lib/types";
import { Modal } from "@/shared/ui/Modal";
import { LabelEditor } from "@/components/editor/LabelEditor";
import { TrashIcon } from "@/components/icons";
import { TITLE_MAX, DESCRIPTION_MAX } from "@/shared/lib/sceneSchema";
import { useTranslations } from "@/contexts/I18nContext";

interface SceneFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  mode: "create" | "edit";
  formTitle: string;
  onFormTitleChange: (value: string) => void;
  formDescription: string;
  onFormDescriptionChange: (value: string) => void;
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  newLabelText: string;
  onNewLabelTextChange: (value: string) => void;
  newLabelColor: string;
  onNewLabelColorChange: (color: string) => void;
  fieldErrors: Record<string, string>;
  submitError: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  submitLabel: string;
  loadingLabel?: string;
  onDelete?: () => void;
}

function getLabelsError(fieldErrors: Record<string, string>): string | undefined {
  if (fieldErrors.labels) return fieldErrors.labels;
  const labelEntry = Object.entries(fieldErrors).find(([k]) => k.startsWith("labels."));
  return labelEntry?.[1];
}

export function SceneFormModal({
  open,
  onClose,
  title,
  titleId,
  mode,
  formTitle,
  onFormTitleChange,
  formDescription,
  onFormDescriptionChange,
  labels,
  onLabelsChange,
  newLabelText,
  onNewLabelTextChange,
  newLabelColor,
  onNewLabelColorChange,
  fieldErrors,
  submitError,
  onSubmit,
  saving,
  submitLabel,
  loadingLabel,
  onDelete,
}: SceneFormModalProps) {
  const t = useTranslations();
  const labelsError = getLabelsError(fieldErrors);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      titleId={titleId}
      closeOnBackdropClick={false}
      closeOnEscape={true}
    >
      <form onSubmit={onSubmit}>
        <div className="min-w-0 space-y-6 px-5 py-4 text-foreground">
          <div>
            <label
              htmlFor={`${titleId}-field-title`}
              className="block text-sm font-medium text-foreground"
            >
              {t("sceneForm.title")}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${titleId}-field-title`}
                type="text"
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                required
                className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={t("sceneForm.sceneTitlePlaceholder")}
              />
              <span className="text-xs text-muted tabular-nums shrink-0">
                {formTitle.length}/{TITLE_MAX}
              </span>
            </div>
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {fieldErrors.title}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor={`${titleId}-field-description`}
              className="block text-sm font-medium text-foreground"
            >
              {t("sceneForm.description")}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id={`${titleId}-field-description`}
                type="text"
                value={formDescription}
                onChange={(e) =>
                  onFormDescriptionChange(e.target.value.slice(0, DESCRIPTION_MAX))
                }
                maxLength={DESCRIPTION_MAX}
                className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={t("sceneForm.optionalDescription")}
              />
              <span className="text-xs text-muted tabular-nums shrink-0">
                {formDescription.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {fieldErrors.description}
              </p>
            )}
          </div>
          <LabelEditor
            labels={labels}
            onLabelsChange={onLabelsChange}
            newLabelText={newLabelText}
            onNewLabelTextChange={onNewLabelTextChange}
            newLabelColor={newLabelColor}
            onNewLabelColorChange={onNewLabelColorChange}
            error={labelsError}
            idPrefix={mode}
          />
          {submitError && (
            <div
              className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200"
              role="alert"
            >
              {submitError}
            </div>
          )}
        </div>
        <div
          className={`flex border-t border-border px-5 py-4 ${
            onDelete ? "items-center justify-between" : "justify-end gap-2"
          }`}
        >
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/20"
              aria-label={t("sceneForm.deleteSceneAria")}
              title={t("dashboard.deleteScene")}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-hover disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none"
              aria-busy={saving}
            >
              {saving ? (loadingLabel ?? t("common.loading")) : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

