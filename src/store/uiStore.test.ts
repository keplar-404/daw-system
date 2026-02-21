/**
 * @file uiStore.test.ts
 * @description Unit tests for the UIStore (camera, panels, selection).
 */

import { useUIStore, DEFAULT_PPB, ZOOM_X_MIN, ZOOM_X_MAX, ZOOM_Y_MIN, ZOOM_Y_MAX } from "@/store/uiStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore(): void {
    useUIStore.getState().resetCamera();
    useUIStore.setState({
        mixerVisible: true,
        browserVisible: true,
        inspectorVisible: false,
        selectedTrackId: null,
        selectedClipId: null,
    });
}

// ---------------------------------------------------------------------------
// Camera — scrollX / scrollY
// ---------------------------------------------------------------------------

describe("UIStore — camera scroll", () => {
    beforeEach(resetStore);

    it("sets scrollX to non-negative values", () => {
        useUIStore.getState().setScrollX(300);
        expect(useUIStore.getState().camera.scrollX).toBe(300);
    });

    it("clamps scrollX to 0 (no negative scroll)", () => {
        useUIStore.getState().setScrollX(-50);
        expect(useUIStore.getState().camera.scrollX).toBe(0);
    });

    it("sets scrollY to non-negative values", () => {
        useUIStore.getState().setScrollY(120);
        expect(useUIStore.getState().camera.scrollY).toBe(120);
    });

    it("clamps scrollY to 0", () => {
        useUIStore.getState().setScrollY(-10);
        expect(useUIStore.getState().camera.scrollY).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Camera — zoom X
// ---------------------------------------------------------------------------

describe("UIStore — zoomXAt", () => {
    beforeEach(resetStore);

    it("increases zoomX with positive delta", () => {
        useUIStore.getState().zoomXAt(0.2, 0);
        expect(useUIStore.getState().camera.zoomX).toBeCloseTo(1.2, 5);
    });

    it("decreases zoomX with negative delta", () => {
        useUIStore.getState().zoomXAt(-0.2, 0);
        expect(useUIStore.getState().camera.zoomX).toBeCloseTo(0.8, 5);
    });

    it("clamps to ZOOM_X_MIN", () => {
        useUIStore.getState().zoomXAt(-999, 0);
        expect(useUIStore.getState().camera.zoomX).toBeGreaterThanOrEqual(ZOOM_X_MIN);
    });

    it("clamps to ZOOM_X_MAX", () => {
        useUIStore.getState().zoomXAt(999, 0);
        expect(useUIStore.getState().camera.zoomX).toBeLessThanOrEqual(ZOOM_X_MAX);
    });

    it("adjusts scrollX to maintain focal point", () => {
        // At default zoom=1, ppb=120, focalPixelX=240 means bar 2
        // After zooming to 2x, bar 2 should still be at viewport x 240
        useUIStore.getState().setScrollX(0);
        useUIStore.getState().zoomXAt(1, 240);
        const { camera } = useUIStore.getState();
        // At zoom=2 (default 1+1), bar 2 in abs = 2 * 120 * 2 = 480
        // scrollX should be 480 - 240 = 240
        expect(camera.scrollX).toBeCloseTo(240, 1);
    });
});

// ---------------------------------------------------------------------------
// Camera — zoom Y
// ---------------------------------------------------------------------------

describe("UIStore — zoomY", () => {
    beforeEach(resetStore);

    it("increases zoomY", () => {
        useUIStore.getState().zoomY(0.2);
        expect(useUIStore.getState().camera.zoomY).toBeCloseTo(1.2, 5);
    });

    it("clamps to ZOOM_Y_MIN", () => {
        useUIStore.getState().zoomY(-999);
        expect(useUIStore.getState().camera.zoomY).toBeGreaterThanOrEqual(ZOOM_Y_MIN);
    });

    it("clamps to ZOOM_Y_MAX", () => {
        useUIStore.getState().zoomY(999);
        expect(useUIStore.getState().camera.zoomY).toBeLessThanOrEqual(ZOOM_Y_MAX);
    });
});

// ---------------------------------------------------------------------------
// Camera — reset
// ---------------------------------------------------------------------------

describe("UIStore — resetCamera", () => {
    beforeEach(resetStore);

    it("resets all camera values to defaults", () => {
        useUIStore.getState().setScrollX(500);
        useUIStore.getState().setScrollY(250);
        useUIStore.getState().zoomXAt(2, 0);
        useUIStore.getState().resetCamera();

        const { camera } = useUIStore.getState();
        expect(camera.scrollX).toBe(0);
        expect(camera.scrollY).toBe(0);
        expect(camera.zoomX).toBe(1);
        expect(camera.zoomY).toBe(1);
        expect(camera.pixelsPerBar).toBe(DEFAULT_PPB);
    });
});

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

describe("UIStore — panels", () => {
    beforeEach(resetStore);

    it("toggles mixer", () => {
        expect(useUIStore.getState().mixerVisible).toBe(true);
        useUIStore.getState().toggleMixer();
        expect(useUIStore.getState().mixerVisible).toBe(false);
        useUIStore.getState().toggleMixer();
        expect(useUIStore.getState().mixerVisible).toBe(true);
    });

    it("toggles browser", () => {
        expect(useUIStore.getState().browserVisible).toBe(true);
        useUIStore.getState().toggleBrowser();
        expect(useUIStore.getState().browserVisible).toBe(false);
    });

    it("toggles inspector", () => {
        expect(useUIStore.getState().inspectorVisible).toBe(false);
        useUIStore.getState().toggleInspector();
        expect(useUIStore.getState().inspectorVisible).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe("UIStore — selection", () => {
    beforeEach(resetStore);

    it("selects a track by ID", () => {
        useUIStore.getState().selectTrack("track-1");
        expect(useUIStore.getState().selectedTrackId).toBe("track-1");
    });

    it("clears clip selection when track is deselected", () => {
        useUIStore.getState().selectClip("clip-1");
        useUIStore.getState().selectTrack(null);
        expect(useUIStore.getState().selectedTrackId).toBeNull();
        expect(useUIStore.getState().selectedClipId).toBeNull();
    });

    it("selects a clip by ID", () => {
        useUIStore.getState().selectClip("clip-2");
        expect(useUIStore.getState().selectedClipId).toBe("clip-2");
    });
});
