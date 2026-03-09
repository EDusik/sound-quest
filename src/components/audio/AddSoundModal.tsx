"use client";

import { useEffect, useState } from "react";
import {
  AUDIO_UPLOAD_MAX_BYTES,
  isAllowedAudioUrl,
  getAllowedAudioExtension,
  ALLOWED_AUDIO_EXTENSIONS,
} from "@/lib/storage";
import { FreesoundSearch } from "@/components/audio/FreesoundSearch";
import { Modal } from "@/components/ui/Modal";
import { extractYouTubeId } from "@/lib/youtube";
import { getErrorMessage } from "@/lib/errors";
import {
  useUploadAudioFileMutation,
  useAddAudioMutation,
  useYouTubeTitleQuery,
} from "@/hooks/api";

interface AddSoundModalProps {
  open: boolean;
  onClose: () => void;
  sceneId: string;
  /** Called after audio was added; parent should refetch and typically close modal. */
  onAdded: () => Promise<void>;
}

export function AddSoundModal({
  open,
  onClose,
  sceneId,
  onAdded,
}: AddSoundModalProps) {
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const youtubeId = extractYouTubeId(addUrl.trim());
  const { data: youtubeTitle } = useYouTubeTitleQuery(youtubeId);
  const uploadMutation = useUploadAudioFileMutation();
  const addAudioMutation = useAddAudioMutation(sceneId);
  const adding = uploadMutation.isPending || addAudioMutation.isPending;

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setAddName("");
        setAddUrl("");
        setAddFile(null);
        setAddError(null);
      }, 0);
    }
  }, [open]);

  const hasYoutubeInUrl =
    addUrl.trim() !== "" && !!extractYouTubeId(addUrl.trim());
  const hasFileInput = addFile !== null;

  const handleAddAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addName.trim();
    const urlTrimmed = addUrl.trim();
    if (!name && !addFile) {
      setAddError("Name is required (or choose a file to use its name)");
      return;
    }
    if (!urlTrimmed && !addFile) {
      setAddError(
        `Enter a URL (YouTube or audio ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}) or choose a file`,
      );
      return;
    }
    if (
      urlTrimmed &&
      !extractYouTubeId(urlTrimmed) &&
      !isAllowedAudioUrl(urlTrimmed)
    ) {
      setAddError(
        `URL must be a YouTube link or an audio file (${ALLOWED_AUDIO_EXTENSIONS.join(", ")}).`,
      );
      return;
    }
    if (addFile && !getAllowedAudioExtension(addFile)) {
      setAddError(
        `Invalid file type. Allowed formats: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
      );
      return;
    }
    if (addFile && addFile.size > AUDIO_UPLOAD_MAX_BYTES) {
      setAddError(
        `File is too large. Maximum size is ${AUDIO_UPLOAD_MAX_BYTES / 1024 / 1024} MB.`,
      );
      return;
    }
    setAddError(null);
    try {
      if (addFile) {
        const sourceUrl = await uploadMutation.mutateAsync({
          sceneId,
          file: addFile,
        });
        const displayName = name || addFile.name;
        await addAudioMutation.mutateAsync({
          name: displayName,
          sourceUrl,
          kind: "file",
        });
      } else {
        const ytId = extractYouTubeId(urlTrimmed);
        if (ytId) {
          const youtubeName = name || youtubeTitle || "YouTube audio";
          await addAudioMutation.mutateAsync({
            name: youtubeName,
            sourceUrl: ytId,
            kind: "youtube",
          });
        } else {
          await addAudioMutation.mutateAsync({
            name,
            sourceUrl: urlTrimmed,
            kind: "file",
          });
        }
      }
      await onAdded();
    } catch (err) {
      setAddError(getErrorMessage(err, "Failed to add audio"));
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setAddFile(null);
        onClose();
      }}
      title="🔊 Add sound"
      titleId="add-sound-modal-title"
      maxWidth="max-w-2xl"
      panelClassName="max-h-[90vh] overflow-y-auto"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-4 p-6">
        <div>
          <FreesoundSearch sceneId={sceneId} onAdded={onAdded} />
        </div>
        <details className="rounded-lg border border-border bg-card/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            🎵 Add audio
          </summary>
          <form
            onSubmit={handleAddAudio}
            className="space-y-3 border-t border-border p-4"
          >
            <div>
              <label className="block text-xs text-foreground">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                placeholder="e.g. Rain ambience"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground">
                URL (YouTube or MP3/WAV/OGG audio) or upload — max. 25 MB
              </label>
              <input
                type="url"
                value={addUrl}
                onChange={(e) => {
                  setAddUrl(e.target.value);
                  if (addFile) setAddFile(null);
                }}
                disabled={hasFileInput}
                className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="https://youtube.com/… or https://…/audio.mp3"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Or choose a file on your computer:
              </p>
              <input
                type="file"
                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                disabled={hasYoutubeInUrl}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && !getAllowedAudioExtension(f)) {
                    setAddError(
                      `Format not allowed. Use: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
                    );
                    e.target.value = "";
                    return;
                  }
                  setAddError(null);
                  setAddFile(f ?? null);
                  if (f) setAddUrl("");
                  e.target.value = "";
                }}
                className="mt-1 w-full text-sm text-foreground file:mr-2 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-background disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {addFile && (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {addFile.name} ({(addFile.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                    {addFile.size > AUDIO_UPLOAD_MAX_BYTES && (
                      <span className="text-red-400"> — over 25 MB limit</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddFile(null)}
                    className="text-accent hover:underline"
                  >
                    Remove file
                  </button>
                </p>
              )}
            </div>
            {addError && <p className="text-sm text-red-400">{addError}</p>}
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {adding ? "Adding…" : "🎵 Add audio"}
            </button>
          </form>
        </details>
      </div>
      <div className="border-t border-border px-6 py-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setAddFile(null);
            onClose();
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
