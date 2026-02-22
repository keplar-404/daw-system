"use client";

import { useCallback, useState } from "react";
import { useDawStore } from "@/features/daw/store/dawStore";
import type { Clip } from "@/features/daw/types/daw.types";
import { storeAudioFile } from "../services/audioStorage";
import { isAudioValidationError } from "../types/audio.types";

export type UploadStatus =
  | "idle"
  | "validating"
  | "storing"
  | "success"
  | "error";

export interface UseAudioUploadReturn {
  upload: (file: File) => Promise<void>;
  status: UploadStatus;
  error: string | null;
  lastClipId: string | null;
  reset: () => void;
}

/**
 * Hook that orchestrates the full audio file ingestion flow:
 * validate → store → push clip into Zustand.
 *
 * Components use this hook; they never call the service directly.
 */
export function useAudioUpload(): UseAudioUploadReturn {
  const addClip = useDawStore((s) => s.addClip);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastClipId, setLastClipId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setLastClipId(null);
  }, []);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setStatus("validating");

      try {
        setStatus("storing");
        const uuid = await storeAudioFile(file);

        const newClip: Clip = {
          id: uuid,
          trackId: "",
          startBeat: 0,
          durationBeats: 0,
          audioUrl: undefined,
        };

        addClip(newClip);
        setLastClipId(uuid);
        setStatus("success");
      } catch (err) {
        if (isAudioValidationError(err)) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
        setStatus("error");
      }
    },
    [addClip],
  );

  return { upload, status, error, lastClipId, reset };
}
