"use client";

import { useTranslations } from "@/contexts/I18nContext";
import { EditIcon, TrashIcon } from "@/components/icons";
import { EditableName } from "./EditableName";

interface AudioRowHeaderProps {
  isInactive?: boolean;
  isEditingName: boolean;
  editNameValue: string;
  displayName: string;
  linkUrl: string;
  onToggleActive?: () => void;
  onStartEditName: () => void;
  onNameChange: (value: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  /** When true, shows the edit button. Use with onStartEditName for the click handler. */
  showEditButton?: boolean;
  /** When true, shows the delete button. Use with onDelete for the click handler. */
  showDeleteButton?: boolean;
  onDelete?: () => void;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  /** When provided, renders instead of the default edit/delete buttons. Use for rows that need playback controls + edit/delete. */
  rightSlot?: React.ReactNode;
}

export function AudioRowHeader({
  isInactive = false,
  isEditingName,
  editNameValue,
  displayName,
  linkUrl,
  onToggleActive,
  onStartEditName,
  onNameChange,
  onSaveRename,
  onCancelRename,
  showEditButton,
  showDeleteButton,
  onDelete,
  nameInputRef,
  rightSlot,
}: AudioRowHeaderProps) {
  const t = useTranslations();

  const actions = rightSlot ?? (
    <>
      {showEditButton && (
        <button
          type="button"
          onClick={onStartEditName}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-foreground"
          title={t("common.editSoundName")}
          aria-label={t("common.editSoundName")}
        >
          <EditIcon className="h-4 w-4" />
        </button>
      )}
      {showDeleteButton && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300"
          title={t("common.deleteSound")}
          aria-label={t("common.deleteSound")}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onToggleActive && (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={!isInactive}
              onChange={onToggleActive}
              className="h-4 w-4 cursor-pointer accent-accent"
              aria-label={
                isInactive
                  ? t("common.reEnableAudio")
                  : t("common.disableAudio")
              }
            />
          </label>
        )}
        <div
          className={`min-w-0 flex-1 ${isInactive ? "opacity-40" : ""}`}
          aria-hidden={isInactive}
        >
          <EditableName
            isEditing={isEditingName}
            value={editNameValue}
            displayText={displayName}
            linkUrl={linkUrl}
            onChange={onNameChange}
            onSave={onSaveRename}
            onCancel={onCancelRename}
            inputRef={nameInputRef}
            ariaLabel={t("common.editSoundName")}
          />
        </div>
      </div>
      <div
        className={`ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 ${
          isInactive ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        {actions}
      </div>
    </div>
  );
}
