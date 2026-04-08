import type { Metadata } from "next";
import { LibraryAiChatPage } from "@/components/library/LibraryAiChatPage";

export const metadata: Metadata = {
  title: "AI audio search",
  robots: { index: false, follow: false },
};

export default function LibraryAiRoutePage() {
  return <LibraryAiChatPage />;
}
