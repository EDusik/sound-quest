import type { Metadata } from "next";

/** Public catalog: allow indexing; parent `/library` layout uses noindex. */
export const metadata: Metadata = {
  title: "Default sounds",
  robots: { index: true, follow: true },
};

export default function LibraryDefaultsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
