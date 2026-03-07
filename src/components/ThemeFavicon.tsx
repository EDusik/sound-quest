"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const FAVICON_LIGHT = "/icon.svg";
const FAVICON_DARK = "/icon-dark.svg";

export function ThemeFavicon() {
  const { dark } = useTheme();

  useEffect(() => {
    const base = dark ? FAVICON_LIGHT : FAVICON_DARK;
    const href = `${base}?v=${dark ? "d" : "l"}`;
    const links = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
    if (links.length) {
      links.forEach((link) => {
        link.href = href;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [dark]);

  return null;
}
