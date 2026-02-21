/**
 * @file layers.ts
 * @description Pixi.js draw functions for timeline canvas layers.
 *
 * Layer 2 — Audio / Rendering Engine. No React imports.
 *
 * Each function is a pure draw call — no internal state retained.
 * Viewport culling ensures only visible bars and tracks are drawn,
 * enabling smooth 60 FPS with 10,000+ clips.
 *
 * Layers (in z-order, bottom → top):
 *   0. Track backgrounds (alternating bands)
 *   1. Grid lines (bars + beats)
 *   2. Clips container
 *   3. Playhead
 */

import * as PIXI from "pixi.js";
import type { Camera } from "./utils";
import { barsToPixels, barsToViewportX, getVisibleBarRange, getVisibleTrackRange } from "./utils";
import type { TimeSignature } from "@/types/transport";
import type { Track } from "@/types/project";

// ---------------------------------------------------------------------------
// Design tokens (matching globals.css dark mode palette)
// ---------------------------------------------------------------------------

export const THEME = {
    /** Major bar line */
    gridMajor: 0xffffff,
    gridMajorAlpha: 0.1,
    /** Beat subdivision line */
    gridMinor: 0xffffff,
    gridMinorAlpha: 0.04,
    /** Playhead line */
    playhead: 0xe11d48,
    /** Playhead triangle marker */
    playheadHead: 0xe11d48,
    /** Default MIDI clip fill */
    clipMidi: 0x6366f1,
    /** Default audio clip fill */
    clipAudio: 0xf43f5e,
    /** Clip text color */
    clipText: 0xffffff,
    /** Even track row */
    trackBgEven: 0x0d0d0d,
    /** Odd track row (slightly lighter) */
    trackBgOdd: 0xffffff,
    trackBgOddAlpha: 0.025,
    /** Selected track highlight */
    trackSelected: 0x6366f1,
    trackSelectedAlpha: 0.08,
} as const;

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/**
 * Draws vertical grid lines for bars and beats.
 * Only draws lines in the visible viewport range for performance.
 *
 * @param g - Graphics object to draw into (will be cleared first)
 * @param timeSig - Current time signature
 * @param totalBars - Total project length in bars
 * @param camera - Current camera/viewport state
 * @param viewportWidth - Canvas width in pixels
 * @param viewportHeight - Canvas height in pixels
 */
export function drawGrid(
    g: PIXI.Graphics,
    timeSig: TimeSignature,
    totalBars: number,
    camera: Camera,
    viewportWidth: number,
    viewportHeight: number,
): void {
    g.clear();

    const ppb = camera.pixelsPerBar * camera.zoomX;
    const numBeats = timeSig.numerator;
    const beatWidth = ppb / numBeats;

    const { firstBar, lastBar } = getVisibleBarRange(camera, viewportWidth);
    const clampedLast = Math.min(lastBar, totalBars);

    for (let bar = firstBar; bar <= clampedLast; bar++) {
        const absX = bar * ppb;
        const x = absX - camera.scrollX; // viewport space

        // Major bar line
        g.moveTo(x, 0).lineTo(x, viewportHeight);
        g.stroke({ width: 1, color: THEME.gridMajor, alpha: THEME.gridMajorAlpha });

        // Beat subdivision lines
        if (bar < clampedLast && beatWidth > 4) {
            // Skip beats if they'd be too close together
            for (let beat = 1; beat < numBeats; beat++) {
                const beatX = x + beat * beatWidth;
                g.moveTo(beatX, 0).lineTo(beatX, viewportHeight);
                g.stroke({ width: 1, color: THEME.gridMinor, alpha: THEME.gridMinorAlpha });
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Track backgrounds
// ---------------------------------------------------------------------------

/**
 * Draws alternating track lane backgrounds.
 * Only draws visible tracks (viewport culled).
 *
 * @param g - Graphics object to draw into
 * @param tracks - Array of project tracks
 * @param trackHeight - Effective track lane height in pixels
 * @param viewportWidth - Canvas width in pixels
 * @param viewportHeight - Canvas height in pixels
 * @param camera - Current camera/viewport state
 * @param selectedTrackId - ID of the currently selected track (or null)
 */
export function drawTrackBackgrounds(
    g: PIXI.Graphics,
    tracks: Track[],
    trackHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    camera: Camera,
    selectedTrackId: string | null = null,
): void {
    g.clear();
    if (tracks.length === 0) return;

    const { firstTrack, lastTrack } = getVisibleTrackRange(
        camera,
        viewportHeight,
        trackHeight,
        tracks.length,
    );

    for (let i = firstTrack; i <= lastTrack; i++) {
        const track = tracks[i];
        if (!track) continue;
        const y = i * trackHeight - camera.scrollY;

        // Alternating even / odd band
        if (i % 2 === 1) {
            g.rect(0, y, viewportWidth, trackHeight);
            g.fill({ color: THEME.trackBgOdd, alpha: THEME.trackBgOddAlpha });
        }

        // Selection highlight
        if (track.id === selectedTrackId) {
            g.rect(0, y, viewportWidth, trackHeight);
            g.fill({ color: THEME.trackSelected, alpha: THEME.trackSelectedAlpha });
        }
    }
}

// ---------------------------------------------------------------------------
// Playhead
// ---------------------------------------------------------------------------

/**
 * Draws the playhead line and triangle head.
 * Called every animation frame via the Pixi ticker.
 *
 * @param g - Graphics object (cleared each frame)
 * @param barPosition - Current playhead position in bars
 * @param camera - Current camera/viewport state
 * @param viewportHeight - Canvas height in pixels
 */
export function drawPlayhead(
    g: PIXI.Graphics,
    barPosition: number,
    camera: Camera,
    viewportHeight: number,
): void {
    g.clear();

    const x = barsToViewportX(barPosition, camera);

    // Skip drawing if playhead is off-screen
    if (x < -2 || x > camera.scrollX + 99999) return;

    // Vertical line
    g.moveTo(x, 0).lineTo(x, viewportHeight);
    g.stroke({ width: 2, color: THEME.playhead, alpha: 1 });

    // Triangle head (pointing down from the top)
    g.moveTo(x - 6, 0)
        .lineTo(x + 6, 0)
        .lineTo(x, 10)
        .closePath();
    g.fill({ color: THEME.playheadHead, alpha: 1 });
}

// ---------------------------------------------------------------------------
// Clips
// ---------------------------------------------------------------------------

/**
 * Object pool entry for re-usable clip Graphics + Text objects.
 */
interface ClipPoolEntry {
    graphics: PIXI.Graphics;
    label: PIXI.Text;
    mask: PIXI.Graphics;
    inUse: boolean;
}

/** Module-level object pool for clip rendering */
const clipPool: ClipPoolEntry[] = [];

/**
 * Acquires a pool entry, creating one if the pool is exhausted.
 */
function acquireClipEntry(): ClipPoolEntry {
    const entry = clipPool.find((e) => !e.inUse);
    if (entry) {
        entry.inUse = true;
        return entry;
    }
    const newEntry: ClipPoolEntry = {
        graphics: new PIXI.Graphics(),
        label: new PIXI.Text({
            text: "",
            style: {
                fontFamily: "monospace",
                fontSize: 10,
                fill: THEME.clipText,
                align: "left",
            },
        }),
        mask: new PIXI.Graphics(),
        inUse: true,
    };
    clipPool.push(newEntry);
    return newEntry;
}

/**
 * Releases all pool entries back for reuse.
 */
function releaseAllClipEntries(): void {
    for (const entry of clipPool) {
        entry.inUse = false;
    }
}

/**
 * Updates the clips container with the visible clips for the current viewport.
 * Uses object pooling to avoid allocation churn during re-renders.
 *
 * Only visible clips (within viewport bounds) are drawn.
 *
 * @param container - Pixi Container for clip objects
 * @param tracks - Array of project tracks
 * @param trackHeight - Effective track lane height in pixels
 * @param camera - Current camera/viewport state
 * @param viewportWidth - Canvas width in pixels
 * @param viewportHeight - Canvas height in pixels
 * @param selectedTrackId - Currently selected track ID (or null)
 */
export function updateClips(
    container: PIXI.Container,
    tracks: Track[],
    trackHeight: number,
    camera: Camera,
    viewportWidth: number,
    viewportHeight: number,
    selectedTrackId: string | null = null,
): void {
    // Return all pool entries before rebuilding
    releaseAllClipEntries();
    container.removeChildren();

    if (tracks.length === 0) return;

    const { firstTrack, lastTrack } = getVisibleTrackRange(
        camera,
        viewportHeight,
        trackHeight,
        tracks.length,
    );

    const { firstBar, lastBar } = getVisibleBarRange(camera, viewportWidth);

    for (let i = firstTrack; i <= lastTrack; i++) {
        const track = tracks[i];
        if (!track) continue;

        const trackY = i * trackHeight - camera.scrollY;
        const clipPad = 2;
        const isSelected = track.id === selectedTrackId;

        for (const clip of track.clips) {
            // Viewport culling: skip clips fully outside the visible bar range
            if (clip.startBar + clip.durationBars < firstBar) continue;
            if (clip.startBar > lastBar) continue;

            const startX = barsToViewportX(clip.startBar, camera);
            const width = barsToPixels(clip.durationBars, camera);
            const clipH = trackHeight - clipPad * 2;
            const clipY = trackY + clipPad;

            // Skip clips that render too thin to see
            if (width < 1) continue;

            const baseColor = clip.color
                ? parseInt(clip.color.replace("#", ""), 16)
                : track.type === "midi"
                    ? THEME.clipMidi
                    : THEME.clipAudio;

            const entry = acquireClipEntry();
            const { graphics: clipG, label, mask } = entry;

            // Draw clip body
            clipG.clear();
            clipG.roundRect(startX, clipY, width, clipH, 4);
            clipG.fill({ color: baseColor, alpha: isSelected ? 0.95 : 0.75 });
            clipG.stroke({ color: baseColor, alpha: 1, width: 1 });

            // Clip label
            label.text = clip.muted ? `[M] ${clip.name}` : clip.name;
            label.x = startX + 4;
            label.y = clipY + 4;

            // Mask label to clip bounds
            mask.clear();
            mask.roundRect(startX, clipY, Math.max(width - 4, 0), clipH, 4).fill(0xffffff);
            label.mask = mask;

            container.addChild(clipG);
            container.addChild(label);
            container.addChild(mask);
        }
    }
}
