import type { Metadata } from "next";

export const siteUrl = "https://sound-table.vercel.app";

const defaultDescription =
  "Create immersive RPG sessions with ambient sounds, music and sound effects. Build scenes for your tabletop campaigns. Free soundboard for dungeon masters. Crie sessões de RPG imersivas com sons ambiente, música e efeitos sonoros. Monte cenas para suas campanhas de mesa. Soundboard gratuito para mestres.";

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  referrer: "origin-when-cross-origin",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  title: {
    default: "Sound Quest",
    template: "%s | Sound Quest",
  },
  description: defaultDescription,
  keywords: [
    // English keywords
    "rpg soundboard",
    "tabletop rpg audio",
    "dnd ambient sounds",
    "rpg sound effects",
    "tabletop soundboard",
    "dungeon master soundboard",
    "rpg sound controller",
    "dnd soundboard",
    "ttrpg ambient music",
    "tabletop sound controller",
    // Portuguese keywords
    "som ambiente rpg",
    "som para rpg de mesa",
    "trilha sonora rpg",
    "efeitos sonoros rpg",
    "mesa de som rpg",
    "soundboard rpg em português",
  ],
  authors: [{ name: "Eduardo Dusik", url: siteUrl }],
  creator: "Eduardo Dusik",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Sound Quest",
    title:
      "Sound Quest – Set the mood for every RPG session | Defina o clima de cada sessão de RPG",
    description:
      "Create immersive tabletop RPG scenes with ambient soundscapes and music. Free soundboard for dungeon masters. Crie cenas imersivas de RPG de mesa com paisagens sonoras e música. Soundboard gratuito para mestres.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Sound Quest – RPG ambient soundboard",
      },
    ],
    locale: "en_US",
    alternateLocale: ["pt_BR"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sound Quest – RPG Ambient Soundboard",
    description: "Build immersive soundscapes for your tabletop RPG sessions.",
    images: ["/icon.svg"],
  },
  icons: { icon: "/icon.svg" },
  alternates: {
    canonical: siteUrl,
  },
  category: "entertainment",
  other: {
    "mobile-web-app-capable": "yes",
  },
};
