/**
 * @file utils.ts
 * @description Pixi.js coordinate and camera utilities.
 *
 * Bridges the UIStore camera shape with Pixi rendering math.
 * All coordinate conversions are pure functions with no side effects.
 */

import type { TimelineCamera } from "@/store/uiStore";
import type { SnapGrid, TimeSignature } from "@/types/transport";

// Re-export Camera type under legacy alias so existing canvas.tsx imports still work
export type Camera = TimelineCamera;

/** Default camera matching UIStore defaults */
export const defaultCamera: Camera = {
    scrollX: 0,
    scrollY: 0,
    zoomX: 1,
    zoomY: 1,
    pixelsPerBar: 120,
};

// ---------------------------------------------------------------------------
// Core conversion helpers (used by Pixi layer drawing)
// ---------------------------------------------------------------------------

/**
 * Converts a bar position to an absolute pixel X (before scroll).
 * @param bars - Bar position (0-indexed)
 * @param camera - Current camera state
 */
export function barsToPixels(bars: number, camera: Camera): number {
    return bars * camera.pixelsPerBar * camera.zoomX;
}

/**
 * Converts an absolute pixel X back to a bar position.
 * @param pixels - Absolute pixel value
 * @param camera - Current camera state
 */
export function pixelsToBars(pixels: number, camera: Camera): number {
    const ppb = camera.pixelsPerBar * camera.zoomX;
    return ppb > 0 ? pixels / ppb : 0;
}

/**
 * Returns the pixel X relative to the viewport (accounts for scroll).
 * @param bars - Bar position
 * @param camera - Current camera state
 */
export function barsToViewportX(bars: number, camera: Camera): number {
    return barsToPixels(bars, camera) - camera.scrollX;
}

// ---------------------------------------------------------------------------
// Snap helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the snap step in bars for a given grid subdivision.
 * @param snap - SnapGrid subdivision
 * @param timeSig - Current time signature
 */
export function getSnapStepBars(snap: SnapGrid, timeSig: TimeSignature): number {
    if (snap === "bar") return 1;
    const snapValue = parseInt(snap.split("/")[1] || "4", 10);
    const snapBeats = timeSig.denominator / snapValue;
    return snapBeats / timeSig.numerator;
}

/**
 * Snaps a bar position to the nearest grid step.
 * @param bars - Raw bar position
 * @param snapSubdivision - Grid subdivision
 * @param timeSig - Current time signature
 */
export function snapBarsToGrid(
    bars: number,
    snapSubdivision: SnapGrid,
    timeSig: TimeSignature,
): number {
    const stepBars = getSnapStepBars(snapSubdivision, timeSig);
    return Math.round(bars / stepBars) * stepBars;
}

// ---------------------------------------------------------------------------
// Viewport culling
// ---------------------------------------------------------------------------

/**
 * Returns the first and last bar visible in the current viewport.
 * Used to skip off-screen Pixi draw calls.
 *
 * @param camera - Current camera state
 * @param viewportWidth - Visible canvas width in pixels
 */
export function getVisibleBarRange(
    camera: Camera,
    viewportWidth: number,
): { firstBar: number; lastBar: number } {
    const ppb = camera.pixelsPerBar * camera.zoomX;
    if (ppb <= 0) return { firstBar: 0, lastBar: 0 };
    return {
        firstBar: Math.max(0, Math.floor(camera.scrollX / ppb)),
        lastBar: Math.ceil((camera.scrollX + viewportWidth) / ppb),
    };
}

/**
 * Returns the first and last track index visible in the current viewport.
 *
 * @param camera - Current camera state
 * @param viewportHeight - Visible canvas height in pixels
 * @param trackHeight - Effective track lane height in pixels
 * @param totalTracks - Total number of tracks
 */
export function getVisibleTrackRange(
    camera: Camera,
    viewportHeight: number,
    trackHeight: number,
    totalTracks: number,
): { firstTrack: number; lastTrack: number } {
    if (trackHeight <= 0) return { firstTrack: 0, lastTrack: 0 };
    return {
        firstTrack: Math.max(0, Math.floor(camera.scrollY / trackHeight)),
        lastTrack: Math.min(totalTracks - 1, Math.ceil((camera.scrollY + viewportHeight) / trackHeight)),
    };
}
