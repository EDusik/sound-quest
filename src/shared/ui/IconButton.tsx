"use client";

interface IconButtonProps {
  onClick: () => void;
  "aria-label": string;
  title?: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}

export function IconButton({
  onClick,
  "aria-label": ariaLabel,
  title,
  children,
  variant = "ghost",
  className = "",
}: IconButtonProps) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const styles =
    variant === "primary"
      ? "bg-accent text-background hover:bg-accent-hover"
      : "text-muted hover:text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
    >
      {children}
    </button>
  );
}

