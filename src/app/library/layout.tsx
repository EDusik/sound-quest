import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoundQuest",
  robots: { index: false, follow: false },
};

export default function LibraryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
