import { homeMetadata } from "@/lib/seo";
import { HomeStructuredData } from "@/components/landing/HomeStructuredData";
import { HomeContent } from "@/components/landing/HomeContent";

export const metadata = homeMetadata;

export default function Home() {
  return (
    <>
      <HomeStructuredData />
      <HomeContent />
    </>
  );
}
