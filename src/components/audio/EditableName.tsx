"use client";

const DEFAULT_INPUT_CLASS =
  "w-full min-w-0 rounded border border-border bg-background px-2 py-1 font-medium text-foreground outline-none focus:border-accent";

const DEFAULT_DISPLAY_CLASS =
  "truncate block font-medium text-accent hover:underline";

interface EditableNameProps {
  isEditing: boolean;
  value: string;
  displayText: string;
  linkUrl: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  ariaLabel?: string;
  /** Overrides default classes on the display link (non-editing). */
  displayClassName?: string;
  /** Overrides default classes on the editing input. */
  inputClassName?: string;
}

export function EditableName({
  isEditing,
  value,
  displayText,
  linkUrl,
  onChange,
  onSave,
  onCancel,
  disabled = false,
  inputRef,
  ariaLabel,
  displayClassName,
  inputClassName,
}: EditableNameProps) {
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        className={inputClassName ?? DEFAULT_INPUT_CLASS}
        aria-label={ariaLabel}
        autoFocus
        disabled={disabled}
      />
    );
  }

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={displayClassName ?? DEFAULT_DISPLAY_CLASS}
    >
      {displayText}
    </a>
  );
}
