"use client";

import type { Label as LabelType } from "@/lib/utils/types";

export function Label({ text, color }: LabelType) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium shadow-sm sm:text-sm text-white"
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );
}

