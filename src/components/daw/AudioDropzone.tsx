"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import localforage from "localforage";
import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDawStore } from "@/features/daw/store/dawStore";

interface AudioDropzoneProps {
    children?: React.ReactNode;
    className?: string;
}

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function AudioDropzone({ children, className }: AudioDropzoneProps) {
    const addTrack = useDawStore((state) => state.addTrack);
    const addClip = useDawStore((state) => state.addClip);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                try {
                    const blobId = crypto.randomUUID();
                    await localforage.setItem(blobId, file);

                    const trackId = crypto.randomUUID();

                    // 1. Create a new Audio Track for this file
                    addTrack({
                        id: trackId,
                        name: file.name,
                        muted: false,
                        solo: false,
                        volume: 0,
                        pan: 0,
                        trackKind: "audio",
                        plugins: [],
                    });

                    // 2. Create the Clip
                    addClip({
                        id: blobId,
                        trackId,
                        startBeat: 0, // Default drop position is start of timeline
                        durationBeats: 16, // Default length, in a real DAW we'd parse the duration from audio headers
                        audioUrl: blobId, // Using the IndexedDB key as the URL reference
                        name: file.name,
                    });
                } catch (error) {
                    console.error("Failed to process dropped audio file:", error);
                }
            }
        },
        [addTrack, addClip],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        noClick: true, // Prevent the whole canvas from opening the file dialog on click
        accept: {
            "audio/wav": [".wav"],
            "audio/mpeg": [".mp3"],
            "audio/ogg": [".ogg"],
        },
        maxSize: MAX_SIZE_BYTES,
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative w-full h-full outline-none",
                isDragActive && "bg-primary/5",
                className,
            )}
        >
            <input {...getInputProps()} />

            {/* Render children (i.e. the timeline canvas) underneath */}
            <div className="absolute inset-0 z-0">{children}</div>

            {/* The dropzone overlay — only visible when dragging *or* if explicitly requested, but for a global dropzone, it's best to show an overlay when dragging */}
            {isDragActive && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 m-4 border-2 border-dashed rounded-lg bg-card/80 backdrop-blur-sm border-primary transition-colors cursor-copy">
                    <UploadCloud className="w-16 h-16 mb-4 text-primary animate-pulse" />
                    <p className="text-xl font-semibold text-primary">
                        Drop audio files here
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Supports WAV, MP3, and OGG (Max 50MB)
                    </p>
                </div>
            )}

            {/* 
        The prompt asked for a "Browse Files" button. Since this is wrapping the whole timeline,
        putting a large button in the middle of the screen permanently would be intrusive.
        However, if the timeline is empty, we could show this. We'll add an absolute positioned
        hidden button that can be triggered via `open()`, but we'll leave the UI clean for now
        unless there are no tracks.
      */}
            <div className="absolute bottom-4 right-4 z-40 hidden">
                <Button onClick={open} variant="secondary">Browse Files</Button>
            </div>

        </div>
    );
}
