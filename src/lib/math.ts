/**
 * @file math.ts
 * @description Timeline math utilities.
 *
 * Provides pure, unit-tested helper functions for coordinate conversion
 * between musical time (bars) and screen pixels, respecting the current
 * camera zoom and scroll position.
 */

import type { TimelineCamera } from "@/store/uiStore";

// ---------------------------------------------------------------------------
// Coordinate conversion
// ---------------------------------------------------------------------------

/**
 * Converts a bar position to an absolute pixel X coordinate (no scroll applied).
 * @param bars - Musical bar position (0-indexed)
 * @param camera - Current timeline camera
 * @returns Screen x in pixels (absolute, before scroll subtracted)
 */
export function barsToAbsolutePixels(bars: number, camera: TimelineCamera): number {
    return bars * camera.pixelsPerBar * camera.zoomX;
}

/**
 * Converts an absolute pixel X coordinate to a bar position.
 * @param pixels - Absolute pixel x
 * @param camera - Current timeline camera
 * @returns Bar position (floating point)
 */
export function absolutePixelsToBars(pixels: number, camera: TimelineCamera): number {
    const ppb = camera.pixelsPerBar * camera.zoomX;
    if (ppb === 0) return 0;
    return pixels / ppb;
}

/**
 * Converts a bar position to a *viewport* pixel X, accounting for scroll.
 * @param bars - Musical bar position
 * @param camera - Current timeline camera
 * @returns Viewport x in pixels (relative to visible canvas edge)
 */
export function barsToViewportX(bars: number, camera: TimelineCamera): number {
    return barsToAbsolutePixels(bars, camera) - camera.scrollX;
}

/**
 * Converts a viewport pixel X to a bar position.
 * @param viewportX - Pixel x relative to visible canvas edge
 * @param camera - Current timeline camera
 * @returns Bar position (floating point)
 */
export function viewportXToBars(viewportX: number, camera: TimelineCamera): number {
    return absolutePixelsToBars(viewportX + camera.scrollX, camera);
}

/**
 * Converts a track index to an absolute pixel Y coordinate (no scroll applied).
 * @param trackIndex - Zero-indexed track position
 * @param trackHeight - Effective track height in pixels
 * @returns Absolute pixel Y
 */
export function trackIndexToAbsoluteY(trackIndex: number, trackHeight: number): number {
    return trackIndex * trackHeight;
}

/**
 * Converts a pixel Y to a track index.
 * @param absoluteY - Absolute pixel Y
 * @param trackHeight - Effective track height in pixels
 * @returns Track index (integer)
 */
export function absoluteYToTrackIndex(absoluteY: number, trackHeight: number): number {
    return Math.floor(absoluteY / trackHeight);
}

// ---------------------------------------------------------------------------
// Viewport culling
// ---------------------------------------------------------------------------

/**
 * Returns the range of bars currently visible in the viewport.
 * Used for viewport culling — only render what's on screen.
 *
 * @param camera - Current timeline camera
 * @param viewportWidth - Width of the visible canvas in pixels
 * @returns Object with `firstBar` and `lastBar` (inclusive bounds)
 */
export function getVisibleBarRange(
    camera: TimelineCamera,
    viewportWidth: number,
): { firstBar: number; lastBar: number } {
    const ppb = camera.pixelsPerBar * camera.zoomX;
    if (ppb <= 0) return { firstBar: 0, lastBar: 0 };
    const firstBar = Math.floor(camera.scrollX / ppb);
    const lastBar = Math.ceil((camera.scrollX + viewportWidth) / ppb);
    return { firstBar, lastBar };
}

/**
 * Returns the range of track indices currently visible in the viewport.
 * Used for viewport culling in the vertical direction.
 *
 * @param camera - Current timeline camera
 * @param viewportHeight - Height of the visible canvas in pixels
 * @param trackHeight - Effective track height in pixels
 * @param totalTracks - Total number of tracks in the project
 * @returns Object with `firstTrack` and `lastTrack` (inclusive, clamped)
 */
export function getVisibleTrackRange(
    camera: TimelineCamera,
    viewportHeight: number,
    trackHeight: number,
    totalTracks: number,
): { firstTrack: number; lastTrack: number } {
    if (trackHeight <= 0) return { firstTrack: 0, lastTrack: 0 };
    const firstTrack = Math.floor(camera.scrollY / trackHeight);
    const lastTrack = Math.min(
        totalTracks - 1,
        Math.ceil((camera.scrollY + viewportHeight) / trackHeight),
    );
    return { firstTrack: Math.max(0, firstTrack), lastTrack: Math.max(0, lastTrack) };
}

// ---------------------------------------------------------------------------
// Snap
// ---------------------------------------------------------------------------

/**
 * Snaps a bar value to the nearest grid step in bars.
 * @param bars - Raw bar position
 * @param stepBars - Grid step size in bars
 * @returns Snapped bar position
 */
export function snapToGrid(bars: number, stepBars: number): number {
    if (stepBars <= 0) return bars;
    return Math.round(bars / stepBars) * stepBars;
}

/**
 * Clamps a value between a minimum and maximum.
 * @param value - Input value
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
