"use client";

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
        className="w-full min-w-0 rounded border border-border bg-background px-2 py-1 font-medium text-foreground outline-none focus:border-accent"
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
      className="truncate block font-medium text-accent hover:underline"
    >
      {displayText}
    </a>
  );
}
