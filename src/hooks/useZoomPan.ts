/**
 * @file useZoomPan.ts
 * @description React hook for timeline zoom and pan interactions.
 *
 * Handles:
 * - Mouse wheel horizontal scroll
 * - Ctrl + wheel horizontal zoom (focal-point aware)
 * - Ctrl + Shift + wheel vertical zoom
 * - Middle-mouse-button panning
 * - Touch pinch-to-zoom (two-finger gesture)
 *
 * Architecture: UI layer only. Mutations flow through useUIStore.
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUIStore, ZOOM_STEP } from "@/store/uiStore";

/**
 * Configuration for the zoom/pan hook.
 */
export interface UseZoomPanOptions {
    /** Whether zoom/pan interactions are enabled */
    enabled?: boolean;
    /** Pixels scrolled per notch of the wheel when not zooming */
    scrollSpeed?: number;
}

/**
 * Attaches wheel and pointer event listeners to a ref'd element for
 * timeline zoom and panning. Updates the camera in useUIStore.
 *
 * @param containerRef - Ref to the scrollable/zoomable container element
 * @param options - Configuration options
 */
export function useZoomPan(
    containerRef: React.RefObject<HTMLElement | null>,
    options: UseZoomPanOptions = {},
): void {
    const { enabled = true, scrollSpeed = 1 } = options;

    const setScrollX = useUIStore((s) => s.setScrollX);
    const setScrollY = useUIStore((s) => s.setScrollY);
    const zoomXAt = useUIStore((s) => s.zoomXAt);
    const zoomY = useUIStore((s) => s.zoomY);

    // Keep camera ref for reading in listeners without re-binding
    const cameraRef = useRef(useUIStore.getState().camera);
    useEffect(() => {
        return useUIStore.subscribe((state) => {
            cameraRef.current = state.camera;
        });
    }, []);

    // ---- Middle-mouse pan state ----
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (!enabled) return;
            e.preventDefault();

            const rect = containerRef.current?.getBoundingClientRect();
            const focalX = rect ? e.clientX - rect.left : 0;

            if (e.ctrlKey || e.metaKey) {
                // Pinch-to-zoom or Ctrl+wheel → horizontal zoom
                const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
                if (e.shiftKey) {
                    // Ctrl+Shift+wheel → vertical zoom
                    zoomY(delta);
                } else {
                    zoomXAt(delta, focalX);
                }
            } else if (e.shiftKey) {
                // Shift+wheel → horizontal scroll
                const camera = cameraRef.current;
                setScrollX(camera.scrollX + e.deltaY * scrollSpeed);
            } else {
                // Plain wheel → vertical scroll (+ small horizontal from deltaX)
                const camera = cameraRef.current;
                setScrollY(camera.scrollY + e.deltaY * scrollSpeed);
                if (Math.abs(e.deltaX) > 0) {
                    setScrollX(camera.scrollX + e.deltaX * scrollSpeed);
                }
            }
        },
        [enabled, scrollSpeed, setScrollX, setScrollY, zoomXAt, zoomY, containerRef],
    );

    const handlePointerDown = useCallback(
        (e: PointerEvent) => {
            // Middle mouse button (button === 1) → pan mode
            if (e.button !== 1 || !enabled) return;
            e.preventDefault();
            isPanningRef.current = true;
            const camera = cameraRef.current;
            panStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                scrollX: camera.scrollX,
                scrollY: camera.scrollY,
            };
            containerRef.current?.setPointerCapture(e.pointerId);
        },
        [enabled, containerRef],
    );

    const handlePointerMove = useCallback(
        (e: PointerEvent) => {
            if (!isPanningRef.current || !enabled) return;
            const dx = e.clientX - panStartRef.current.x;
            const dy = e.clientY - panStartRef.current.y;
            setScrollX(panStartRef.current.scrollX - dx);
            setScrollY(panStartRef.current.scrollY - dy);
        },
        [enabled, setScrollX, setScrollY],
    );

    const handlePointerUp = useCallback(() => {
        isPanningRef.current = false;
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !enabled) return;

        el.addEventListener("wheel", handleWheel, { passive: false });
        el.addEventListener("pointerdown", handlePointerDown);
        el.addEventListener("pointermove", handlePointerMove);
        el.addEventListener("pointerup", handlePointerUp);

        return () => {
            el.removeEventListener("wheel", handleWheel);
            el.removeEventListener("pointerdown", handlePointerDown);
            el.removeEventListener("pointermove", handlePointerMove);
            el.removeEventListener("pointerup", handlePointerUp);
        };
    }, [enabled, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, containerRef]);
}
