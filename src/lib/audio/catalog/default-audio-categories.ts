import type { LucideIcon } from "lucide-react";
import {
  AudioWaveform,
  CloudRain,
  Moon,
  Music,
  Rabbit,
  Skull,
  Swords,
  Wand2,
  Trees,
  Zap,
} from "lucide-react";
import {
  DEFAULT_AUDIO_CATEGORY_SLUGS,
  type DefaultAudioCategorySlug,
} from "@/lib/audio/catalog/default-audio-category-slugs";

export { DEFAULT_AUDIO_CATEGORY_SLUGS, type DefaultAudioCategorySlug };

export const DEFAULT_AUDIO_CATEGORIES: readonly {
  slug: DefaultAudioCategorySlug;
  icon: LucideIcon;
}[] = [
  { slug: "ambience", icon: Trees },
  { slug: "combat", icon: Swords },
  { slug: "magic", icon: Wand2 },
  { slug: "creatures", icon: Skull },
  { slug: "foley", icon: AudioWaveform },
  { slug: "music", icon: Music },
  { slug: "tension", icon: Moon },
  { slug: "stingers", icon: Zap },
  { slug: "weather", icon: CloudRain },
  { slug: "animals", icon: Rabbit },
];
