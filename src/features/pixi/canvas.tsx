"use client";

/**
 * @file canvas.tsx
 * @description GPU-accelerated Pixi.js canvas for the DAW timeline.
 *
 * Layer 1 (UI) — renders only. No Tone.js imports. No audio logic.
 * Communicates with UIStore and ProjectStore for camera + track data.
 *
 * Architecture:
 * - Pixi ticker drives 60 FPS playhead updates (no React re-renders)
 * - Static layers (grid, tracks, clips) redraw only when store data changes
 * - Camera updates from UIStore scroll/zoom → full static redraw
 * - Object pooling in layers.ts keeps GC pressure low
 */

import React, { useCallback, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { useProjectStore } from "@/features/project/project-store";
import { useUIStore, selectTrackHeight } from "@/store/uiStore";
import { engineGetPositionBars } from "@/features/audio/engine";
import {
    drawGrid,
    drawPlayhead,
    drawTrackBackgrounds,
    updateClips,
} from "./layers";
import type { TimeSignature } from "@/types/project";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pixi layer z-indices (declared for safety against future reorders) */
const LAYER_TRACK_BG = 0;
const LAYER_GRID = 1;
const LAYER_CLIPS = 2;
const LAYER_PLAYHEAD = 3;

// ---------------------------------------------------------------------------
// Default time signature (typed to satisfy TimeSignatureNumerator)
// ---------------------------------------------------------------------------

const DEFAULT_TIME_SIG: TimeSignature = { numerator: 4, denominator: 4 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PixiCanvasProps {
    className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PixiCanvas
 *
 * The main GPU-accelerated canvas for timeline rendering. Bypasses React
 * state for high-frequency updates (playhead, scroll sync from UIStore).
 *
 * Pixi ticker loop — runs at 60 FPS:
 *   - Reads playhead bar from Tone engine directly (no Zustand subscription)
 *   - Redraws playhead graphics only
 *
 * React effects:
 *   - Redraw tracks, grid, clips when project data or camera changes
 */
export function PixiCanvas({ className }: PixiCanvasProps): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);

    // ---- Stable project selectors ----
    const tracks = useProjectStore((s) => s.activeProject?.tracks) ?? [];
    const timeSignature: TimeSignature = useProjectStore(
        (s) => s.activeProject?.settings.timeSignature ?? DEFAULT_TIME_SIG,
    );
    const totalBars = useProjectStore(
        (s) => s.activeProject?.settings.lengthBars ?? 64,
    );

    // ---- UI camera + selection ----
    const camera = useUIStore((s) => s.camera);
    const selectedTrackId = useUIStore((s) => s.selectedTrackId);
    const trackHeight = useUIStore(selectTrackHeight);

    // ---- Keep refs for use inside ticker (avoids stale closures) ----
    const cameraRef = useRef(camera);
    const trackHeightRef = useRef(trackHeight);
    useEffect(() => {
        cameraRef.current = camera;
        trackHeightRef.current = trackHeight;
    });

    // ---- Tick-safe redraw helper ----
    const redrawStatic = useCallback(() => {
        const app = appRef.current;
        if (!app) return;

        const w = app.canvas.width / app.renderer.resolution;
        const h = app.canvas.height / app.renderer.resolution;
        const cam = cameraRef.current;
        const tHeight = trackHeightRef.current;

        const trackBgG = app.stage.getChildAt(LAYER_TRACK_BG) as PIXI.Graphics;
        const gridG = app.stage.getChildAt(LAYER_GRID) as PIXI.Graphics;
        const clipsC = app.stage.getChildAt(LAYER_CLIPS) as PIXI.Container;

        drawTrackBackgrounds(trackBgG, tracks, tHeight, w, h, cam, selectedTrackId);
        drawGrid(gridG, timeSignature, totalBars, cam, w, h);
        updateClips(clipsC, tracks, tHeight, cam, w, h, selectedTrackId);
    }, [tracks, timeSignature, totalBars, selectedTrackId]);

    // ---- One-time Pixi init ----
    useEffect(() => {
        if (!containerRef.current) return;

        let isDisposed = false;
        let resizeObserver: ResizeObserver | null = null;

        const init = async () => {
            const app = new PIXI.Application();
            await app.init({
                resizeTo: containerRef.current ?? window,
                backgroundAlpha: 0,
                antialias: false, // Off for crisper grid lines at 1:1 pixel
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            if (isDisposed) {
                app.destroy(true);
                return;
            }

            appRef.current = app;
            containerRef.current?.appendChild(app.canvas);

            // Build layers
            const trackBgG = new PIXI.Graphics();
            const gridG = new PIXI.Graphics();
            const clipsC = new PIXI.Container();
            const playheadG = new PIXI.Graphics();

            app.stage.addChild(trackBgG); // 0 — LAYER_TRACK_BG
            app.stage.addChild(gridG);    // 1 — LAYER_GRID
            app.stage.addChild(clipsC);   // 2 — LAYER_CLIPS
            app.stage.addChild(playheadG); // 3 — LAYER_PLAYHEAD

            // 60 FPS ticker — only does playhead (no allocation)
            app.ticker.add(() => {
                const h = app.canvas.height / app.renderer.resolution;
                const cam = cameraRef.current;
                const positionBars = engineGetPositionBars();
                drawPlayhead(playheadG, positionBars, cam, h);
            });

            // Handle canvas resize
            app.renderer.on("resize", () => {
                redrawStatic();
            });

            // PIXI v8 resizeTo only listens to 'window' resize by default.
            // When Flex layout expands the container without a window resize,
            // we must manually trigger app.resize() via ResizeObserver.
            resizeObserver = new ResizeObserver(() => {
                if (!isDisposed) app.resize();
            });
            if (containerRef.current) resizeObserver.observe(containerRef.current);

            // Initial static draw
            redrawStatic();
        };

        init();

        return () => {
            isDisposed = true;
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            appRef.current?.destroy(true);
            appRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Mount only — redrawStatic ref handles updates

    // ---- Reactive static redraw ----
    // Runs when tracks, time sig, total bars, camera, or selection changes
    useEffect(() => {
        redrawStatic();
    }, [redrawStatic, camera, trackHeight]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full overflow-hidden ${className ?? ""}`}
            aria-label="DAW timeline canvas"
            role="presentation"
        />
    );
}
