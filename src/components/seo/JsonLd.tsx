import { siteUrl } from "@/lib/seo";

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sound Table",
  alternateName: "Sound Table – RPG Ambient Soundboard",
  url: siteUrl,
  description:
    "Create immersive RPG sessions with ambient sounds, music and sound effects. Build scenes for your tabletop campaigns. Free soundboard for dungeon masters.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Eduardo Dusik",
  },
  inLanguage: "en",
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
    />
  );
}
