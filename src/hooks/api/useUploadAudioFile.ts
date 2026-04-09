"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadAudioFile } from "@/lib/storage/storage";

export function useUploadAudioFileMutation() {
  return useMutation({
    mutationFn: ({
      sceneId,
      file,
    }: {
      sceneId: string;
      file: File;
    }) => uploadAudioFile(sceneId, file),
  });
}
