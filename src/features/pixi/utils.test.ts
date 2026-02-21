/**
 * @file utils.test.ts
 * @description Unit tests for Pixi coordinate utils (pixi/utils.ts).
 */

import {
    barsToPixels,
    pixelsToBars,
    barsToViewportX,
    getSnapStepBars,
    snapBarsToGrid,
    getVisibleBarRange,
    getVisibleTrackRange,
    defaultCamera,
    type Camera,
} from "@/features/pixi/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCamera(overrides: Partial<Camera> = {}): Camera {
    return { ...defaultCamera, ...overrides };
}

// ---------------------------------------------------------------------------
// barsToPixels
// ---------------------------------------------------------------------------

describe("barsToPixels", () => {
    it("converts bars to pixels at default zoom 1.0", () => {
        const cam = makeCamera();
        expect(barsToPixels(0, cam)).toBe(0);
        expect(barsToPixels(1, cam)).toBe(120);
        expect(barsToPixels(4, cam)).toBe(480);
    });

    it("scales with zoomX", () => {
        const cam = makeCamera({ zoomX: 2 });
        expect(barsToPixels(1, cam)).toBe(240);
    });
});

// ---------------------------------------------------------------------------
// pixelsToBars
// ---------------------------------------------------------------------------

describe("pixelsToBars", () => {
    it("is inverse of barsToPixels", () => {
        const cam = makeCamera({ zoomX: 1.5 });
        const px = barsToPixels(3.3, cam);
        expect(pixelsToBars(px, cam)).toBeCloseTo(3.3, 10);
    });

    it("returns 0 when ppb is zero", () => {
        const cam = makeCamera({ pixelsPerBar: 0 });
        expect(pixelsToBars(200, cam)).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// barsToViewportX
// ---------------------------------------------------------------------------

describe("barsToViewportX", () => {
    it("subtracts scrollX from absolute position", () => {
        const cam = makeCamera({ scrollX: 120 });
        expect(barsToViewportX(1, cam)).toBe(0);
        expect(barsToViewportX(2, cam)).toBe(120);
    });
});

// ---------------------------------------------------------------------------
// getSnapStepBars
// ---------------------------------------------------------------------------

describe("getSnapStepBars", () => {
    const timeSig44 = { numerator: 4 as const, denominator: 4 as const };

    it("returns 1 for 'bar'", () => {
        expect(getSnapStepBars("bar", timeSig44)).toBe(1);
    });

    it("returns 0.5 for '1/2' in 4/4", () => {
        expect(getSnapStepBars("1/2", timeSig44)).toBe(0.5);
    });

    it("returns 0.25 for '1/4' in 4/4", () => {
        expect(getSnapStepBars("1/4", timeSig44)).toBeCloseTo(0.25, 10);
    });

    it("returns 0.125 for '1/8' in 4/4", () => {
        expect(getSnapStepBars("1/8", timeSig44)).toBeCloseTo(0.125, 10);
    });
});

// ---------------------------------------------------------------------------
// snapBarsToGrid
// ---------------------------------------------------------------------------

describe("snapBarsToGrid", () => {
    const timeSig44 = { numerator: 4 as const, denominator: 4 as const };

    it("snaps to nearest bar", () => {
        expect(snapBarsToGrid(1.6, "bar", timeSig44)).toBe(2);
        expect(snapBarsToGrid(1.4, "bar", timeSig44)).toBe(1);
    });

    it("snaps to nearest quarter note", () => {
        expect(snapBarsToGrid(1.1, "1/4", timeSig44)).toBeCloseTo(1, 10);
        expect(snapBarsToGrid(1.15, "1/4", timeSig44)).toBeCloseTo(1.25, 10);
    });
});

// ---------------------------------------------------------------------------
// getVisibleBarRange
// ---------------------------------------------------------------------------

describe("getVisibleBarRange", () => {
    it("correct range with no scroll", () => {
        const cam = makeCamera({ scrollX: 0 });
        const { firstBar, lastBar } = getVisibleBarRange(cam, 480);
        expect(firstBar).toBe(0);
        expect(lastBar).toBe(4);
    });

    it("clips firstBar to 0", () => {
        const cam = makeCamera({ scrollX: -100 }); // shouldn't happen in practice
        const { firstBar } = getVisibleBarRange(cam, 480);
        expect(firstBar).toBeGreaterThanOrEqual(0);
    });
});

// ---------------------------------------------------------------------------
// getVisibleTrackRange
// ---------------------------------------------------------------------------

describe("getVisibleTrackRange", () => {
    it("returns 0-based indices for visible tracks", () => {
        const cam = makeCamera({ scrollY: 0 });
        const result = getVisibleTrackRange(cam, 320, 80, 10);
        expect(result.firstTrack).toBe(0);
        expect(result.lastTrack).toBe(4);
    });

    it("caps at totalTracks - 1", () => {
        const cam = makeCamera({ scrollY: 0 });
        const result = getVisibleTrackRange(cam, 9999, 80, 3);
        expect(result.lastTrack).toBe(2);
    });
});
