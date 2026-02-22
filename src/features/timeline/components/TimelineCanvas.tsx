"use client";

import { useRef, useState } from "react";
import { Layer, Line, Stage, Text } from "react-konva";

import { useTimelineGrid } from "../hooks/useTimelineGrid";
import type { TimelineConfig } from "../types/timeline.types";
import { AutomationLayer } from "@/features/automation";
import { useDawStore } from "@/features/daw/store/dawStore";
import { AudioClipBox } from "./AudioClipBox";
import { TimelineRuler } from "./TimelineRuler";
import { LoopRegionOverlay } from "./LoopRegionOverlay";

interface TimelineCanvasProps {
  config?: Partial<TimelineConfig>;
}

const DEFAULT_CONFIG: TimelineConfig = {
  pxPerBeat: 50,
  totalBeats: 128, // 32 bars × 4/4
  beatsPerMeasure: 4,
  height: 600,
};

/**
 * TimelineCanvas — the core arrangement visual.
 *
 * Architecture (hybrid DOM + Canvas):
 *   ┌─ scrollContainer (overflow-x: auto) ──────────────────────────┐
 *   │  ┌─ scrollContent (full width: totalBeats × pxPerBeat) ──┐   │
 *   │  │  ┌─ Stage (sticky, viewport width) ─────────────────┐  │   │
 *   │  │  │  <Layer>                                          │  │   │
 *   │  │  │    <Line /> × visible measures only               │  │   │
 *   │  │  │    <Text /> × beat labels                         │  │   │
 *   │  │  └──────────────────────────────────────────────────┘  │   │
 *   │  └───────────────────────────────────────────────────────┘   │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * The scrollContainer's scrollLeft drives useVirtualizer which tells us
 * which measures to draw. Only visible lines are painted → O(viewport)
 * draw calls, never O(totalBeats).
 *
 * dnd-kit clip rectangles will be overlaid as absolute-positioned DOM
 * elements inside scrollContent in a future feature sprint.
 *
 * Rule 1 compliant — no audio engine imports.
 */
export function TimelineCanvas({
  config: configOverride,
}: TimelineCanvasProps) {
  const config: TimelineConfig = { ...DEFAULT_CONFIG, ...configOverride };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const tracks = useDawStore((s) => s.tracks);
  const clips = useDawStore((s) => s.clips);
  const updateClipBounds = useDawStore((s) => s.updateClipBounds);

  const { virtualMeasures, totalWidth } = useTimelineGrid(config, scrollRef);

  // Measure container width for the Konva Stage
  const onContainerMount = (el: HTMLDivElement | null) => {
    if (el) {
      setContainerWidth(el.clientWidth);
      // ResizeObserver keeps Stage width in sync with container
      const ro = new ResizeObserver(([entry]) => {
        setContainerWidth(entry.contentRect.width);
      });
      ro.observe(el);
    }
  };

  return (
    // Outer scroll container — drives the virtualizer
    <section
      ref={scrollRef}
      className="relative h-full w-full overflow-x-auto overflow-y-hidden"
      aria-label="Timeline arrangement"
    >
      {/* Inner div establishes the full scroll width */}
      <div
        ref={onContainerMount}
        style={{
          width: totalWidth,
          height: config.height,
          position: "relative",
        }}
      >
        {/* Konva Stage is sticky so it fills the viewport while grid scrolls */}
        <div
          style={{
            position: "sticky",
            left: 0,
            width: containerWidth,
            height: config.height,
            pointerEvents: "none",
          }}
        >
          <Stage width={containerWidth} height={config.height}>
            <Layer>
              {virtualMeasures.map(({ index, start }) => {
                const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
                const x = start - scrollLeft;
                const isEvenMeasure = index % 2 === 0;

                return (
                  <Line
                    key={index}
                    x={x}
                    y={0}
                    points={[0, 0, 0, config.height]}
                    stroke={
                      isEvenMeasure
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.06)"
                    }
                    strokeWidth={1}
                    listening={false}
                  />
                );
              })}

              {/* Beat sub-lines within each visible measure */}
              {virtualMeasures.flatMap(({ index, start }) => {
                const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
                return Array.from(
                  { length: config.beatsPerMeasure - 1 },
                  (_, b) => {
                    // Globally unique beat id — not a raw index
                    const globalBeatId =
                      index * config.beatsPerMeasure + (b + 1);
                    const beatX =
                      start + (b + 1) * config.pxPerBeat - scrollLeft;
                    return (
                      <Line
                        key={`beat-${globalBeatId}`}
                        x={beatX}
                        y={20}
                        points={[0, 0, 0, config.height - 20]}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth={0.5}
                        listening={false}
                      />
                    );
                  },
                );
              })}

              {/* Measure number labels removed in favor of explicit strictly-styled DOM Ruler Headers */}
            </Layer>

            {/* Overlay for tracking volume/pan curves */}
            {config.automationActive && (
              <AutomationLayer
                width={containerWidth}
                height={config.height}
                pxPerBeat={config.pxPerBeat}
                scrollLeft={scrollRef.current?.scrollLeft ?? 0}
              />
            )}
          </Stage>
        </div>

        {/* ── Visual Timeline DOM Overlays ─── */}
        <TimelineRuler
          virtualMeasures={virtualMeasures}
          scrollLeft={scrollRef.current?.scrollLeft ?? 0}
          pxPerBeat={config.pxPerBeat}
          beatsPerMeasure={config.beatsPerMeasure}
        />

        <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] pointer-events-none">
          <LoopRegionOverlay
            pxPerBeat={config.pxPerBeat}
            height={config.height - 32} // Total minus the 32px (h-8) header
          />

          {clips.map((clip) => {
            const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
            if (trackIndex === -1) return null; // Orphan clip guard

            return (
              <div key={clip.id} className="pointer-events-auto">
                <AudioClipBox
                  clip={clip}
                  pxPerBeat={config.pxPerBeat}
                  trackIndex={trackIndex}
                  trackHeight={96} // aligns with `h-24` tailwind layout bound
                  onUpdateBounds={updateClipBounds}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
