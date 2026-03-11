"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  AUDIO_UPLOAD_MAX_BYTES,
  isAllowedAudioUrl,
  getAllowedAudioExtension,
  ALLOWED_AUDIO_EXTENSIONS,
} from "@/lib/storage";
import { FreesoundSearch } from "@/components/audio/FreesoundSearch";
import { SpotifyAddForm } from "@/components/audio/SpotifyAddForm";
import { Modal } from "@/components/ui/Modal";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { extractYouTubeId } from "@/lib/youtube";
import { extractSpotifyId, toSpotifyUri } from "@/lib/spotify";
import { getErrorMessage } from "@/lib/errors";
import {
  useUploadAudioFileMutation,
  useAddAudioMutation,
  useYouTubeTitleQuery,
} from "@/hooks/api";
import { useTranslations } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";

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
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);

  const youtubeId = extractYouTubeId(addUrl.trim());
  const canUploadFile = isAuthenticated;
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
        setSpotifyUrl("");
        setAddError(null);
        setSpotifyError(null);
      }, 0);
    }
  }, [open]);

  const hasFileInput = addFile !== null;
  const hasUrlOrFile = addUrl.trim() !== "" || hasFileInput;
  const hasSpotifyUrl = spotifyUrl.trim() !== "";

  const handleAddSpotify = async (track: { name: string; spotifyUri: string }) => {
    setSpotifyError(null);
    try {
      await addAudioMutation.mutateAsync({
        name: track.name,
        sourceUrl: track.spotifyUri,
        kind: "spotify",
      });
      await onAdded();
      setAddName("");
      setAddUrl("");
      setAddFile(null);
    } catch (err) {
      const msg = getErrorMessage(err, t("addSound.failedToAdd"));
      setSpotifyError(msg);
      toast.warning(msg);
    }
  };

  const handleAddAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addName.trim();
    const urlTrimmed = addUrl.trim();
    const extensions = ALLOWED_AUDIO_EXTENSIONS.join(", ");
    if (!name && !addFile) {
      setAddError(t("addSound.nameRequired"));
      return;
    }
    if (!urlTrimmed && !addFile) {
      setAddError(t("addSound.enterUrlOrFile", { extensions }));
      return;
    }
    if (
      urlTrimmed &&
      !extractYouTubeId(urlTrimmed) &&
      !isAllowedAudioUrl(urlTrimmed)
    ) {
      setAddError(t("addSound.urlMustBeValid", { extensions }));
      return;
    }
    if (addFile && !getAllowedAudioExtension(addFile)) {
      setAddError(t("addSound.invalidFileType", { extensions }));
      return;
    }
    if (addFile && addFile.size > AUDIO_UPLOAD_MAX_BYTES) {
      setAddError(
        t("addSound.fileTooLarge", {
          maxMb: String(AUDIO_UPLOAD_MAX_BYTES / 1024 / 1024),
        }),
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
          const youtubeName = name || youtubeTitle || t("addSound.youtubeAudio");
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
      setAddName("");
      setAddUrl("");
      setAddFile(null);
      setSpotifyUrl("");
    } catch (err) {
      const msg = getErrorMessage(err, t("addSound.failedToAdd"));
      setAddError(msg);
      toast.warning(msg);
    }
  };

  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = extractSpotifyId(spotifyUrl.trim());
    if (hasSpotifyUrl && parsed) {
      setAddError(null);
      setSpotifyError(null);
      const spotifyUri = toSpotifyUri(parsed.id, parsed.type);
      const name = addName.trim() || `${parsed.type} ${parsed.id}`;
      await handleAddSpotify({ name, spotifyUri });
      setSpotifyUrl("");
      return;
    }
    if (hasSpotifyUrl && !parsed) {
      setAddError(null);
      setSpotifyError(t("addSound.spotifyUrlInvalid"));
      return;
    }
    setSpotifyError(null);
    await handleAddAudio({ preventDefault: () => {} } as React.FormEvent);
  };

  const canAddSpotify = hasSpotifyUrl && !!extractSpotifyId(spotifyUrl.trim());
  const canAddUrlOrFile = hasUrlOrFile;
  const canAdd = canAddSpotify || canAddUrlOrFile;

  return (
    <Modal
      open={open}
      onClose={() => {
        setAddFile(null);
        onClose();
      }}
      title={t("addSound.title")}
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
        <CollapsibleSection summary={t("addSound.addAudio")}>
          <form onSubmit={handleUnifiedSubmit} className="space-y-6 border-t border-border p-4">
            <div>
              <label htmlFor="add-sound-name" className="block text-xs text-foreground">{t("addSound.name")}</label>
              <input
                id="add-sound-name"
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                placeholder={t("addSound.namePlaceholder")}
                autoComplete="off"
              />
            </div>
            <hr className="border-border" />
            <div className="space-y-6">
            <div className="space-y-6 border-l pl-4 border-[var(--accent)]">
            <div>
              <label htmlFor="add-sound-url" className="block text-xs text-foreground">
                {t("addSound.urlLabel")}
              </label>
              <input
                id="add-sound-url"
                type="url"
                value={addUrl}
                onChange={(e) => {
                  setAddUrl(e.target.value);
                  if (addFile) setAddFile(null);
                }}
                disabled={hasFileInput || hasSpotifyUrl}
                className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder={t("addSound.urlPlaceholder")}
                autoComplete="url"
              />
            </div>
            {(addError || spotifyError) && (
              <p className="text-sm text-red-400" role="alert">
                {addError || spotifyError}
              </p>
            )}
            <SpotifyAddForm
              sharedName={addName}
              spotifyUrl={spotifyUrl}
              onSpotifyUrlChange={setSpotifyUrl}
              disabled={hasUrlOrFile}
              hideSubmitButton
              onAdd={handleAddSpotify}
              error={spotifyError}
              isAdding={addAudioMutation.isPending}
            />
            <div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("addSound.orChooseFile")}
              </p>
              {!canUploadFile && (
                <p className="mt-1 text-xs text-accent">
                  {t("addSound.signInToUpload")}{" "}
                  <Link href="/login" className="underline hover:no-underline">
                    {t("nav.signIn")}
                  </Link>
                </p>
              )}
              <input
                type="file"
                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                disabled={addUrl.trim() !== "" || hasSpotifyUrl || !canUploadFile}
                aria-label={t("addSound.orChooseFile")}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && !getAllowedAudioExtension(f)) {
                    setAddError(
                      t("addSound.formatNotAllowed", {
                        extensions: ALLOWED_AUDIO_EXTENSIONS.join(", "),
                      }),
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
                      <span className="text-red-400">
                        {" "}
                        — {t("addSound.fileOverLimit")}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddFile(null)}
                    className="text-accent hover:underline"
                  >
                    {t("addSound.removeFile")}
                  </button>
                </p>
              )}
            </div>
            </div>
            <button
              type="submit"
              disabled={adding || !canAdd}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {adding ? t("addSound.adding") : t("addSound.addAudioButton")}
            </button>
            </div>
          </form>
        </CollapsibleSection>
      </div>
      <div className="border-t border-border px-6 py-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setAddFile(null);
            onClose();
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={t("common.cancel")}
        >
          {t("common.cancel")}
        </button>
      </div>
    </Modal>
  );
}
