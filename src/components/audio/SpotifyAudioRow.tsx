"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotifyTrack } from "@/lib/types";
import { spotifyUriToOpenUrl } from "@/lib/spotify";
import { loadSpotifyIframeAPI } from "@/lib/spotify-embed";
import { AudioRowHeader } from "./AudioRowHeader";

export type { SpotifyTrack };

interface SpotifyAudioRowProps {
  track: SpotifyTrack;
  sceneId: string;
  isInactive?: boolean;
  onToggleActive?: () => void;
  onRemove?: () => void;
  onRename?: (newName: string) => void;
  className?: string;
}

export function SpotifyAudioRow({
  track,
  sceneId, // eslint-disable-line @typescript-eslint/no-unused-vars -- reserved for future use
  isInactive = false,
  onToggleActive,
  onRemove,
  onRename,
  className,
}: SpotifyAudioRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(track.name);

  const sourceUrl = spotifyUriToOpenUrl(track.spotifyUri);

  const saveRename = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== track.name && onRename) {
      onRename(trimmed);
    }
    setIsEditingName(false);
  };

  const cancelRename = () => {
    setEditNameValue(track.name);
    setIsEditingName(false);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    let cancelled = false;

    loadSpotifyIframeAPI().then((IFrameAPI) => {
      if (cancelled || !element.isConnected) return;
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.getBoundingClientRect();
      const width =
        rect.width ||
        element.offsetWidth ||
        parentRect?.width ||
        (typeof window !== "undefined" ? window.innerWidth - 48 : 300);
      IFrameAPI.createController(
        element,
        { uri: track.spotifyUri, width: Math.max(300, Math.round(width)), height: 152 },
        () => {
          if (cancelled) return;
        },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [track.id, track.spotifyUri]);

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2 ${className ?? ""}`}
    >
      <div className="min-w-0 w-full">
        <AudioRowHeader
        isInactive={isInactive}
        isEditingName={isEditingName}
        editNameValue={editNameValue}
        displayName={track.name}
        linkUrl={sourceUrl}
        onToggleActive={onToggleActive}
        onStartEditName={() => {
          setEditNameValue(track.name);
          setIsEditingName(true);
        }}
        onNameChange={setEditNameValue}
        onSaveRename={saveRename}
        onCancelRename={cancelRename}
        showEditButton={!!onRename}
        showDeleteButton={!!onRemove}
        onDelete={onRemove}
      />
      </div>
      <div ref={containerRef} className="h-[152px] w-full min-w-0 overflow-hidden rounded" />
    </div>
  );
}
