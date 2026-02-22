"use client";

import { useEffect, useState, useMemo } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import { getAudioBlob } from "@/features/audio/services/audioStorage";

interface WaveformOverlayProps {
    blobId: string;
}

/**
 * Renders an underlying audio Blob from IndexedDB using Wavesurfer.
 * Disabled interaction to let the parent react-rnd wrapper handle dragging natively.
 *
 * Rule 1 compliant — isolated visualizer context.
 */
export function WaveformOverlay({ blobId }: WaveformOverlayProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    // 1. Fetch blob asynchronously from localforage and convert to ObjectURL
    useEffect(() => {
        let active = true;
        let url: string | null = null;

        getAudioBlob(blobId).then((blob) => {
            if (!active || !blob) return;
            url = URL.createObjectURL(blob);
            setBlobUrl(url);
        });

        return () => {
            active = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [blobId]);

    // 2. Prevent re-mounting the player un-necessarily
    const wavesurferOpts = useMemo(
        () => ({
            height: "auto" as any,
            waveColor: "#f97316", // Primary orange
            progressColor: "#f97316",
            cursorColor: "transparent",
            interact: false,
            autoScroll: false,
            fillParent: true,
            normalize: true,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
        }),
        []
    );

    if (!blobUrl) return null; // Wait for memory extraction

    return (
        <div className="absolute inset-0 pointer-events-none opacity-80 z-0">
            <WavesurferPlayer url={blobUrl} {...wavesurferOpts} />
        </div>
    );
}
