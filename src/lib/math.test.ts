/**
 * @file math.test.ts
 * @description Unit tests for timeline math utilities.
 */

import {
    barsToAbsolutePixels,
    absolutePixelsToBars,
    barsToViewportX,
    viewportXToBars,
    trackIndexToAbsoluteY,
    absoluteYToTrackIndex,
    getVisibleBarRange,
    getVisibleTrackRange,
    snapToGrid,
    clamp,
} from "@/lib/math";
import type { TimelineCamera } from "@/store/uiStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCamera(overrides: Partial<TimelineCamera> = {}): TimelineCamera {
    return {
        scrollX: 0,
        scrollY: 0,
        zoomX: 1,
        zoomY: 1,
        pixelsPerBar: 120,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// barsToAbsolutePixels
// ---------------------------------------------------------------------------

describe("barsToAbsolutePixels", () => {
    it("converts bar position to pixels at default zoom", () => {
        const camera = makeCamera();
        expect(barsToAbsolutePixels(1, camera)).toBe(120);
        expect(barsToAbsolutePixels(4, camera)).toBe(480);
        expect(barsToAbsolutePixels(0, camera)).toBe(0);
    });

    it("scales with zoomX", () => {
        const camera = makeCamera({ zoomX: 2 });
        expect(barsToAbsolutePixels(1, camera)).toBe(240);
        expect(barsToAbsolutePixels(0.5, camera)).toBe(120);
    });

    it("scales with pixelsPerBar", () => {
        const camera = makeCamera({ pixelsPerBar: 200 });
        expect(barsToAbsolutePixels(1, camera)).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// absolutePixelsToBars
// ---------------------------------------------------------------------------

describe("absolutePixelsToBars", () => {
    it("converts pixels to bars at default zoom", () => {
        const camera = makeCamera();
        expect(absolutePixelsToBars(120, camera)).toBe(1);
        expect(absolutePixelsToBars(480, camera)).toBe(4);
        expect(absolutePixelsToBars(0, camera)).toBe(0);
    });

    it("returns 0 when ppb is 0 (no divide-by-zero)", () => {
        const camera = makeCamera({ pixelsPerBar: 0 });
        expect(absolutePixelsToBars(100, camera)).toBe(0);
    });

    it("is the inverse of barsToAbsolutePixels", () => {
        const camera = makeCamera({ zoomX: 1.5 });
        const bars = 3.7;
        const pixels = barsToAbsolutePixels(bars, camera);
        expect(absolutePixelsToBars(pixels, camera)).toBeCloseTo(bars, 10);
    });
});

// ---------------------------------------------------------------------------
// barsToViewportX
// ---------------------------------------------------------------------------

describe("barsToViewportX", () => {
    it("accounts for scrollX", () => {
        const camera = makeCamera({ scrollX: 240 });
        expect(barsToViewportX(2, camera)).toBe(0); // bar 2 = 240px abs, 240 - 240 = 0
        expect(barsToViewportX(3, camera)).toBe(120);
        expect(barsToViewportX(1, camera)).toBe(-120);
    });
});

// ---------------------------------------------------------------------------
// viewportXToBars
// ---------------------------------------------------------------------------

describe("viewportXToBars", () => {
    it("is inverse of barsToViewportX", () => {
        const camera = makeCamera({ scrollX: 300 });
        const bars = 5.25;
        const vx = barsToViewportX(bars, camera);
        expect(viewportXToBars(vx, camera)).toBeCloseTo(bars, 10);
    });
});

// ---------------------------------------------------------------------------
// trackIndexToAbsoluteY / absoluteYToTrackIndex
// ---------------------------------------------------------------------------

describe("trackIndexToAbsoluteY", () => {
    it("computes correct Y from index and track height", () => {
        expect(trackIndexToAbsoluteY(0, 80)).toBe(0);
        expect(trackIndexToAbsoluteY(1, 80)).toBe(80);
        expect(trackIndexToAbsoluteY(5, 80)).toBe(400);
    });
});

describe("absoluteYToTrackIndex", () => {
    it("returns the correct track index", () => {
        expect(absoluteYToTrackIndex(0, 80)).toBe(0);
        expect(absoluteYToTrackIndex(79, 80)).toBe(0);
        expect(absoluteYToTrackIndex(80, 80)).toBe(1);
        expect(absoluteYToTrackIndex(400, 80)).toBe(5);
    });
});

// ---------------------------------------------------------------------------
// getVisibleBarRange
// ---------------------------------------------------------------------------

describe("getVisibleBarRange", () => {
    it("returns correct range at scroll 0", () => {
        const camera = makeCamera({ scrollX: 0 });
        const result = getVisibleBarRange(camera, 480); // 480px viewport
        expect(result.firstBar).toBe(0);
        expect(result.lastBar).toBe(4); // ceil(480/120) = 4
    });

    it("accounts for scrollX offset", () => {
        const camera = makeCamera({ scrollX: 360 }); // 3 bars in
        const result = getVisibleBarRange(camera, 240); // 2-bar-wide viewport
        expect(result.firstBar).toBe(3);
        expect(result.lastBar).toBe(5);
    });

    it("handles zero ppb safely", () => {
        const camera = makeCamera({ pixelsPerBar: 0 });
        const result = getVisibleBarRange(camera, 800);
        expect(result.firstBar).toBe(0);
        expect(result.lastBar).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// getVisibleTrackRange
// ---------------------------------------------------------------------------

describe("getVisibleTrackRange", () => {
    it("returns visible track range at scroll 0", () => {
        const camera = makeCamera({ scrollY: 0 });
        const result = getVisibleTrackRange(camera, 320, 80, 10);
        expect(result.firstTrack).toBe(0);
        expect(result.lastTrack).toBe(4); // ceil(320/80) = 4
    });

    it("clamps to total tracks", () => {
        const camera = makeCamera({ scrollY: 0 });
        const result = getVisibleTrackRange(camera, 10000, 80, 3);
        expect(result.lastTrack).toBe(2);
    });

    it("accounts for scrollY", () => {
        const camera = makeCamera({ scrollY: 160 }); // skip 2 tracks
        const result = getVisibleTrackRange(camera, 80, 80, 10);
        expect(result.firstTrack).toBe(2);
    });

    it("handles zero trackHeight safely", () => {
        const camera = makeCamera();
        const result = getVisibleTrackRange(camera, 400, 0, 10);
        expect(result.firstTrack).toBe(0);
        expect(result.lastTrack).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// snapToGrid
// ---------------------------------------------------------------------------

describe("snapToGrid", () => {
    it("snaps bar to nearest step", () => {
        expect(snapToGrid(1.3, 0.5)).toBe(1.5);
        expect(snapToGrid(1.2, 0.5)).toBe(1);
        expect(snapToGrid(2.1, 1)).toBe(2);
        expect(snapToGrid(2.6, 1)).toBe(3);
    });

    it("returns input when step is 0", () => {
        expect(snapToGrid(1.7, 0)).toBe(1.7);
    });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe("clamp", () => {
    it("clamps to min", () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("clamps to max", () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("passes through in-range values", () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });
});
