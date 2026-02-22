"use client";

import { AlertCircle, FileAudio, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useAudioUpload } from "../hooks/useAudioUpload";

const ACCEPTED_MIME = ["audio/wav", "audio/mpeg", "audio/ogg", "audio/mp3"];
const MAX_MB = 50;

/**
 * Drag-and-drop audio file intake.
 *
 * Visual states:
 *   idle      → dashed border, UploadCloud icon
 *   drag-over → accent background, pulsing border
 *   success   → FileAudio icon, clip UUID shown
 *   error     → AlertCircle icon, human-readable message
 */
export function AudioDropzone() {
  const { upload, status, error, lastClipId, reset } = useAudioUpload();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      upload(file);
    },
    [upload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // Reset input so same file can be re-uploaded after an error
    e.target.value = "";
  };

  const isLoading = status === "validating" || status === "storing";

  return (
    <button
      type="button"
      aria-label="Audio file dropzone — drag and drop or click to select"
      onClick={() => !isLoading && inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        "relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "border-border bg-background hover:bg-accent/40 hover:border-primary/50",
        isDragging && "border-primary bg-accent/60 scale-[1.01]",
        status === "success" && "border-green-500/60 bg-green-500/5",
        status === "error" && "border-destructive/60 bg-destructive/5",
        isLoading && "pointer-events-none opacity-70",
      )}
    >
      {/* Hidden file input — tabIndex=-1 keeps it out of tab order */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME.join(",")}
        className="sr-only"
        onChange={onInputChange}
        tabIndex={-1}
      />

      {/* Icon */}
      <div className="flex items-center justify-center rounded-full bg-muted p-3">
        {status === "success" ? (
          <FileAudio className="h-7 w-7 text-green-500" />
        ) : status === "error" ? (
          <AlertCircle className="h-7 w-7 text-destructive" />
        ) : (
          <UploadCloud
            className={cn(
              "h-7 w-7 text-muted-foreground",
              isLoading && "animate-pulse",
            )}
          />
        )}
      </div>

      {/* Text content */}
      {status === "idle" || isDragging ? (
        <>
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Release to upload" : "Drop audio file here"}
          </p>
          <p className="text-xs text-muted-foreground">
            WAV, MP3, OGG · max {MAX_MB} MB · validated by file signature
          </p>
        </>
      ) : status === "validating" ? (
        <p className="text-sm text-muted-foreground animate-pulse">
          Validating file…
        </p>
      ) : status === "storing" ? (
        <p className="text-sm text-muted-foreground animate-pulse">
          Storing in IndexedDB…
        </p>
      ) : status === "success" ? (
        <>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            File stored successfully
          </p>
          <p className="font-mono text-xs text-muted-foreground break-all">
            {lastClipId}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Upload another
          </button>
        </> /* error */
      ) : (
        <>
          <p className="text-sm font-medium text-destructive">Upload failed</p>
          <p className="max-w-xs text-xs text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </>
      )}
    </button>
  );
}
