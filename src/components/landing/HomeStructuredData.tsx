import { siteUrl } from "@/lib/seo";

/** FAQ Q&A in English for schema.org FAQPage (rich results). */
const FAQ_ITEMS = [
  {
    question: "Can I upload my own sounds?",
    answer:
      "Yes. You can add sounds via URL (e.g. YouTube or direct audio links) or upload your own files.",
  },
  {
    question: "Do I need an account to try it?",
    answer:
      "No. You can continue as a guest and use the soundboard with data stored locally in your browser. Sign in to save and sync across devices.",
  },
  {
    question: "Is it designed for Game Masters?",
    answer:
      "Yes. SoundQuest is built for tabletop RPG sessions so GMs can play ambience, music, and sound effects instantly without interrupting the game.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SoundQuest – RPG Soundboard for Tabletop Games",
  description:
    "Bring your RPG sessions to life with sound. Free soundboard for tabletop RPG: ambience, music, and sound effects for Game Masters and players.",
  url: siteUrl,
  mainEntity: {
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
};

export function HomeStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
    />
  );
}
