import type { Metadata } from "next";
import { LibraryAiChatPage } from "@/features/library/components/LibraryAiChatPage";

export const metadata: Metadata = {
  title: "AI audio search",
  robots: { index: false, follow: false },
};

export default function LibraryAiRoutePage() {
  return <LibraryAiChatPage />;
}
