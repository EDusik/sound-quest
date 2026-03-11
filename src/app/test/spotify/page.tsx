"use client";

import { useState } from "react";
import Link from "next/link";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";
import { SpotifyAddForm } from "@/components/audio/SpotifyAddForm";
import {
  SpotifyAudioRow,
  type SpotifyTrack,
} from "@/components/audio/SpotifyAudioRow";
import { useTranslations } from "@/contexts/I18nContext";

const SPOTIFY_TEST_SCENE_ID = "test-spotify";

export default function SpotifyTestPage() {
  const t = useTranslations();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  const handleAdd = (track: SpotifyTrack) => {
    if (!track.spotifyUri) return;
    setTracks((prev) => [...prev, track]);
  };

  const handleRemove = (id: string) => {
    setTracks((prev) => prev.filter((track) => track.id !== id));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        logo={<SoundQuestLogo />}
        logoHref="/dashboard"
        logoAriaLabel="SoundQuest"
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <Link href="/dashboard" className="text-link hover:underline">
            {t("spotifyTest.backToDashboard")}
          </Link>
        </div>
        <h1 className="text-2xl font-bold">{t("spotifyTest.title")}</h1>
        <p className="text-muted-foreground max-w-xl">
          {t("spotifyTest.description")}
        </p>

        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <h2 className="font-semibold">{t("spotifyTest.addByLink")}</h2>
          <SpotifyAddForm onAdd={handleAdd} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold">
            {t("spotifyTest.addedCount", { count: tracks.length })}
          </h2>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("spotifyTest.emptyMessage")}
            </p>
          ) : (
            <ul className="space-y-3">
              {tracks.map((track) => (
                <li key={track.id}>
                  <SpotifyAudioRow
                    track={track}
                    sceneId={SPOTIFY_TEST_SCENE_ID}
                    onRemove={() => handleRemove(track.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
