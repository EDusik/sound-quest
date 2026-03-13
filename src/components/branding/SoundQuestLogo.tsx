"use client";

import { Fragment, type ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const BRAND_NAME = "SoundQuest";

/** Renders the word "SoundQuest" in the logo font. Pass className for size (e.g. text-lg, text-xl). */
export function SoundQuestBrand({ className }: { className?: string }) {
  return (
    <span className={`font-cinzel font-semibold tracking-wide ${className ?? ""}`}>
      {BRAND_NAME}
    </span>
  );
}

/** Splits text by "SoundQuest" and renders the brand name in logo font. Use for i18n strings. */
export function textWithBrand(text: string, brandClassName?: string): ReactNode {
  const parts = text.split(BRAND_NAME);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? <SoundQuestBrand className={brandClassName} /> : null}
    </Fragment>
  ));
}

type SoundQuestLogoProps = {
  /** Optional class for the wrapper. */
  className?: string;
  /** Logo size in pixels (SVG width/height). Default 32. */
  size?: number;
  /** If true, only the d20 icon is shown (no "SoundQuest" text). */
  iconOnly?: boolean;
};

export function SoundQuestLogo({
  className,
  size = 32,
  iconOnly = false,
}: SoundQuestLogoProps) {
  const { spinKey } = useTheme();

  const d20 = (
    <svg
      key={spinKey}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="inline-block shrink-0 text-foreground animate-dice-rotate"
      aria-hidden
    >
      {/* D20 - icosahedron edges only (wireframe); stroke follows theme via currentColor */}
      <g
        transform="translate(32,32) scale(1.15, 1.4)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 18 L-16 -8 L16 -8 Z" />
        <path d="M-16 -8 L-22 4 L0 18 Z" />
        <path d="M16 -8 L0 18 L22 4 Z" />
        <path d="M0 -18 L-16 8 L16 8 Z" />
        <path d="M-16 8 L0 -18 L-22 -4 Z" />
        <path d="M16 8 L22 -4 L0 -18 Z" />
        <path d="M-16 8 L0 18 L16 8 Z" />
      </g>
    </svg>
  );

  if (iconOnly) {
    return <span className={className}>{d20}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      {d20}
      <SoundQuestBrand className="inline" />
    </span>
  );
}

