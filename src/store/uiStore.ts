/**
 * @file uiStore.ts
 * @description Zustand store for global UI state.
 *
 * Layer 3 — State Layer. No audio or Tone.js imports.
 *
 * Manages:
 * - Timeline camera (zoom, pan)
 * - Panel visibility (mixer, browser, inspector)
 * - Track header width
 * - Theme preference
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default pixels-per-bar at zoom level 1.0 */
export const DEFAULT_PPB = 120;

/** Minimum horizontal zoom factor */
export const ZOOM_X_MIN = 0.1;

/** Maximum horizontal zoom factor */
export const ZOOM_X_MAX = 8;

/** Minimum vertical zoom factor (track height scale) */
export const ZOOM_Y_MIN = 0.5;

/** Maximum vertical zoom factor */
export const ZOOM_Y_MAX = 3;

/** Zoom step per scroll wheel tick */
export const ZOOM_STEP = 0.1;

/** Width of the frozen track-header panel in pixels */
export const TRACK_HEADER_WIDTH = 256;

/** Default track lane height in pixels */
export const DEFAULT_TRACK_HEIGHT = 80;

// ---------------------------------------------------------------------------
// Camera type
// ---------------------------------------------------------------------------

/**
 * Camera / viewport state for the main timeline canvas.
 * `scrollX` and `scrollY` are in pixels; zoom is a multiplier.
 */
export interface TimelineCamera {
    /** Horizontal scroll offset in pixels */
    scrollX: number;
    /** Vertical scroll offset in pixels */
    scrollY: number;
    /** Horizontal zoom multiplier (1.0 = default) */
    zoomX: number;
    /** Vertical zoom multiplier (1.0 = default) */
    zoomY: number;
    /** Base pixels-per-bar at zoomX=1 */
    readonly pixelsPerBar: number;
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface UIState {
    /** Timeline camera position and zoom */
    camera: TimelineCamera;

    /** Whether the bottom mixer panel is visible */
    mixerVisible: boolean;
    /** Whether the left browser/asset panel is visible */
    browserVisible: boolean;
    /** Whether the right inspector panel is visible */
    inspectorVisible: boolean;

    /** Currently selected track ID (null = nothing selected) */
    selectedTrackId: string | null;

    /** Currently selected clip ID (null = nothing selected) */
    selectedClipId: string | null;

    // ---- Camera actions ----
    /** Sets absolute horizontal scroll position */
    setScrollX: (x: number) => void;
    /** Sets absolute vertical scroll position */
    setScrollY: (y: number) => void;
    /** Adjusts horizontal zoom, clamped to valid range, toward a focal pixel X */
    zoomXAt: (delta: number, focalPixelX: number) => void;
    /** Adjusts vertical zoom, clamped to valid range */
    zoomY: (delta: number) => void;
    /** Resets camera to default position and zoom */
    resetCamera: () => void;

    // ---- Panel actions ----
    /** Toggles the bottom mixer panel */
    toggleMixer: () => void;
    /** Toggles the left browser panel */
    toggleBrowser: () => void;
    /** Toggles the right inspector panel */
    toggleInspector: () => void;

    // ---- Selection actions ----
    /** Selects a track by ID */
    selectTrack: (trackId: string | null) => void;
    /** Selects a clip by ID */
    selectClip: (clipId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Default camera
// ---------------------------------------------------------------------------

const DEFAULT_CAMERA: TimelineCamera = {
    scrollX: 0,
    scrollY: 0,
    zoomX: 1,
    zoomY: 1,
    pixelsPerBar: DEFAULT_PPB,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUIStore = create<UIState>()(
    immer((set) => ({
        camera: { ...DEFAULT_CAMERA },

        mixerVisible: true,
        browserVisible: true,
        inspectorVisible: false,

        selectedTrackId: null,
        selectedClipId: null,

        // ---- Camera ----

        setScrollX(x) {
            set((state) => {
                state.camera.scrollX = Math.max(0, x);
            });
        },

        setScrollY(y) {
            set((state) => {
                state.camera.scrollY = Math.max(0, y);
            });
        },

        zoomXAt(delta, focalPixelX) {
            set((state) => {
                const prevZoom = state.camera.zoomX;
                const nextZoom = Math.min(
                    ZOOM_X_MAX,
                    Math.max(ZOOM_X_MIN, prevZoom + delta),
                );
                if (nextZoom === prevZoom) return;

                // Adjust scrollX so the content under the focal point stays fixed
                const focalBar = (state.camera.scrollX + focalPixelX) / (state.camera.pixelsPerBar * prevZoom);
                state.camera.zoomX = nextZoom;
                state.camera.scrollX = Math.max(0, focalBar * state.camera.pixelsPerBar * nextZoom - focalPixelX);
            });
        },

        zoomY(delta) {
            set((state) => {
                state.camera.zoomY = Math.min(
                    ZOOM_Y_MAX,
                    Math.max(ZOOM_Y_MIN, state.camera.zoomY + delta),
                );
            });
        },

        resetCamera() {
            set((state) => {
                state.camera = { ...DEFAULT_CAMERA };
            });
        },

        // ---- Panels ----

        toggleMixer() {
            set((state) => {
                state.mixerVisible = !state.mixerVisible;
            });
        },

        toggleBrowser() {
            set((state) => {
                state.browserVisible = !state.browserVisible;
            });
        },

        toggleInspector() {
            set((state) => {
                state.inspectorVisible = !state.inspectorVisible;
            });
        },

        // ---- Selection ----

        selectTrack(trackId) {
            set((state) => {
                state.selectedTrackId = trackId;
                if (trackId === null) state.selectedClipId = null;
            });
        },

        selectClip(clipId) {
            set((state) => {
                state.selectedClipId = clipId;
            });
        },
    })),
);

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

/** Effective pixels-per-bar at current zoom */
export const selectEffectivePPB = (s: UIState): number =>
    s.camera.pixelsPerBar * s.camera.zoomX;

/** Effective track height at current vertical zoom */
export const selectTrackHeight = (s: UIState): number =>
    Math.round(DEFAULT_TRACK_HEIGHT * s.camera.zoomY);
