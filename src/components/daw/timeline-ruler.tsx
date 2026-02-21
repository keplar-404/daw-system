"use client";

/**
 * @file TimelineRuler.tsx
 * @description DOM-rendered timeline ruler showing bar numbers.
 *
 * Renders bar markers above the Pixi canvas. Uses a canvas element for
 * performance — avoids DOM node churn for 1000+ bar markers.
 * Camera scroll/zoom from UIStore drives which bars are shown.
 *
 * Accessibility:
 * - role="presentation" (decorative)
 * - aria-hidden="true" — screen reader doesn't announce every bar tick
 */

import React, { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/store/uiStore";
import { useProjectStore } from "@/features/project/project-store";

// ---------------------------------------------------------------------------
// Design tokens (same as Pixi theme, but CSS/Canvas API colors)
// ---------------------------------------------------------------------------

const RULER_BG = "hsl(0 0% 8%)";
const RULER_BORDER = "rgba(255,255,255,0.08)";
const BAR_LABEL_COLOR = "rgba(255,255,255,0.45)";
const BAR_TICK_COLOR = "rgba(255,255,255,0.18)";
const BAR_MAJOR_COLOR = "rgba(255,255,255,0.35)";
const RULER_HEIGHT = 28; // px — keep in sync with CSS height

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface TimelineRulerProps {
    /** Left offset in pixels consumed by the frozen track-header panel */
    headerWidth: number;
    className?: string;
}

/**
 * TimelineRuler
 *
 * Draws bar / beat tick marks and bar numbers onto a <canvas> element.
 * Redraws whenever camera scroll or zoom changes.
 */
export const TimelineRuler = React.memo(function TimelineRuler({
    headerWidth,
    className,
}: TimelineRulerProps): React.ReactElement {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const camera = useUIStore((s) => s.camera);
    const totalBars = useProjectStore((s) => s.activeProject?.settings.lengthBars ?? 64);
    const timeSignature = useProjectStore(
        (s) =>
            s.activeProject?.settings.timeSignature ?? { numerator: 4, denominator: 4 },
    );

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const cssWidth = canvas.offsetWidth;
        const cssHeight = RULER_HEIGHT;

        // Sync canvas backing store to physical pixels
        if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
        }

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cssWidth, cssHeight);

        // Background
        ctx.fillStyle = RULER_BG;
        ctx.fillRect(0, 0, cssWidth, cssHeight);

        // Bottom border
        ctx.strokeStyle = RULER_BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, cssHeight - 0.5);
        ctx.lineTo(cssWidth, cssHeight - 0.5);
        ctx.stroke();

        const ppb = camera.pixelsPerBar * camera.zoomX;
        if (ppb <= 0) return;

        const numBeats = timeSignature.numerator;
        const beatWidth = ppb / numBeats;

        const firstBar = Math.floor(camera.scrollX / ppb);
        const lastBar = Math.min(Math.ceil((camera.scrollX + cssWidth) / ppb), totalBars);

        ctx.font = "10px 'Geist Mono', 'JetBrains Mono', monospace";
        ctx.textBaseline = "top";

        for (let bar = firstBar; bar <= lastBar; bar++) {
            const xAbs = bar * ppb - camera.scrollX; // viewport x

            // Major bar tick
            ctx.strokeStyle = BAR_MAJOR_COLOR;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xAbs + 0.5, cssHeight - 12);
            ctx.lineTo(xAbs + 0.5, cssHeight - 1);
            ctx.stroke();

            // Bar label (show every bar, or skip if too crowded)
            const minLabelSpacing = 40;
            if (bar % Math.ceil(minLabelSpacing / ppb) === 0 || ppb >= minLabelSpacing) {
                ctx.fillStyle = BAR_LABEL_COLOR;
                ctx.fillText(String(bar + 1), xAbs + 3, 6);
            }

            // Beat subdivision ticks (only if beats are wide enough to show)
            if (beatWidth > 6 && bar < lastBar) {
                ctx.strokeStyle = BAR_TICK_COLOR;
                ctx.lineWidth = 1;
                for (let beat = 1; beat < numBeats; beat++) {
                    const beatX = xAbs + beat * beatWidth;
                    ctx.beginPath();
                    ctx.moveTo(beatX + 0.5, cssHeight - 7);
                    ctx.lineTo(beatX + 0.5, cssHeight - 1);
                    ctx.stroke();
                }
            }
        }

        // Reset transform to avoid DPR transform accumulation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }, [camera, totalBars, timeSignature]);

    // Redraw on camera or project changes
    useEffect(() => {
        draw();
    }, [draw]);

    // Redraw on resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ro = new ResizeObserver(() => draw());
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [draw]);

    return (
        <div
            className={`flex shrink-0 border-b ${className ?? ""}`}
            style={{ height: RULER_HEIGHT }}
            aria-hidden="true"
        >
            {/* Spacer matching the frozen track-header panel */}
            <div
                className="shrink-0 border-r bg-muted/20"
                style={{ width: headerWidth }}
                aria-hidden="true"
            />
            {/* Ruler canvas */}
            <canvas
                ref={canvasRef}
                className="flex-1 block"
                role="presentation"
                aria-hidden="true"
                style={{ imageRendering: "pixelated" }}
            />
        </div>
    );
});
