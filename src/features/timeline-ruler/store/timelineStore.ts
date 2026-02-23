import { create } from "zustand";

interface TimelineState {
    // Zoom and Scale
    pixelsPerSecond: number;
    zoomLevel: number; // 0 to max zoom levels

    // Snap and Scroll
    snapToGrid: boolean;
    autoScroll: boolean;
    scrollLeft: number;

    // Actions
    setZoomLevel: (level: number) => void;
    setPixelsPerSecond: (pps: number) => void;
    toggleSnap: () => void;
    toggleAutoScroll: () => void;
    setScrollLeft: (scroll: number) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
    pixelsPerSecond: 100, // Default zoom: 100px = 1 second
    zoomLevel: 5,         // Let's say index 5 is 100% zoom

    snapToGrid: true,
    autoScroll: true,
    scrollLeft: 0,

    setZoomLevel: (level) => set({ zoomLevel: level }),
    setPixelsPerSecond: (pps) => set({ pixelsPerSecond: pps }),
    toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    toggleAutoScroll: () => set((state) => ({ autoScroll: !state.autoScroll })),
    setScrollLeft: (scroll) => set({ scrollLeft: scroll }),
}));

