"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { extractSpotifyId, toSpotifyUri } from "@/lib/spotify";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";

interface EmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  restart: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (
    event: string,
    cb: (e: {
      data?: {
        playingURI?: string;
        isPaused?: boolean;
        position?: number;
        duration?: number;
      };
    }) => void,
  ) => void;
}

interface IFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: number; height?: number },
    callback: (controller: EmbedController) => void,
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

let spotifyApiPromise: Promise<IFrameAPI> | null = null;

function loadSpotifyIframeAPI(): Promise<IFrameAPI> {
  if (spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null as unknown as IFrameAPI);
      return;
    }
    const w = window;
    w.onSpotifyIframeApiReady = (api: IFrameAPI) => {
      resolve(api);
    };
    const tag = document.createElement("script");
    tag.src = "https://open.spotify.com/embed/iframe-api/v1";
    tag.async = true;
    document.body.appendChild(tag);
  });
  return spotifyApiPromise;
}

interface SpotifyTrack {
  id: string;
  name: string;
  spotifyUri: string;
}

function SpotifyEmbed({
  track,
  onRemove,
}: {
  track: SpotifyTrack;
  onRemove: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    let cancelled = false;

    loadSpotifyIframeAPI().then((IFrameAPI) => {
      if (cancelled || !element.isConnected) return;
      IFrameAPI.createController(
        element,
        { uri: track.spotifyUri, width: 300, height: 380 },
        () => {
          if (cancelled) return;
        },
      );
    });

    return () => {
      cancelled = true;
      // Controller replaces the element, so we can't call destroy on unmount
      // when the parent removes the item - the element is already gone
    };
  }, [track.spotifyUri]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate" title={track.name}>
          {track.name}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Remover
        </button>
      </div>
      <div ref={containerRef} className="min-h-[380px] w-[300px]" />
    </div>
  );
}

function generateId(): string {
  return `spotify-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SpotifyTestPage() {
  const [inputUrl, setInputUrl] = useState("");
  const [addName, setAddName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  const handleAdd = () => {
    setError(null);
    const parsed = extractSpotifyId(inputUrl);
    if (!parsed) {
      setError(
        "URL ou URI do Spotify inválida. Ex: https://open.spotify.com/track/...",
      );
      return;
    }
    const spotifyUri = toSpotifyUri(parsed.id, parsed.type);
    const name =
      addName.trim() ||
      `${parsed.type} ${parsed.id}`;
    const track: SpotifyTrack = {
      id: generateId(),
      name,
      spotifyUri,
    };
    setTracks((prev) => [...prev, track]);
    setInputUrl("");
    setAddName("");
  };

  const handleRemove = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
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
            ← Voltar ao Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Teste: Adicionar música pelo link do Spotify</h1>
        <p className="text-muted-foreground max-w-xl">
          Cole um link do Spotify (track, album, playlist ou episode) e clique em
          &quot;Adicionar&quot; para testar a funcionalidade.{" "}
          <strong>Funciona com conta gratuita do Spotify.</strong> Você precisa
          estar logado no Spotify no navegador.
        </p>

        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <h2 className="font-semibold">Adicionar por link</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="spotify-url"
                className="mb-1 block text-sm font-medium"
              >
                Link do Spotify
              </label>
              <input
                id="spotify-url"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="add-name"
                className="mb-1 block text-sm font-medium"
              >
                Nome (opcional)
              </label>
              <input
                id="add-name"
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Ex: Minha trilha favorita"
                className="w-full rounded border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <button
              onClick={handleAdd}
              className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Adicionar
            </button>
          </div>

          {error && <p className="text-destructive">{error}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold">
            Músicas adicionadas ({tracks.length})
          </h2>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma música adicionada ainda. Cole um link do Spotify acima e
              clique em Adicionar.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {tracks.map((track) => (
                <SpotifyEmbed
                  key={track.id}
                  track={track}
                  onRemove={() => handleRemove(track.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
