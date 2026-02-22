"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import { useMemo } from "react";

import { createTimelineScale } from "@/lib/audio/scale";
import type { TimelineConfig, VirtualMeasure } from "../types/timeline.types";

export interface UseTimelineGridReturn {
  /** Visible measure items to draw (from the virtualizer). */
  virtualMeasures: VirtualMeasure[];
  /** Total scroll width of the timeline in pixels. */
  totalWidth: number;
  /** Convert a beat number to a pixel x-position. */
  beatToPixel: (beat: number) => number;
  /** Width of one measure in pixels. */
  measureWidth: number;
}

/**
 * Drives the timeline grid rendering.
 *
 * Uses @tanstack/react-virtual (horizontal) to calculate which measures
 * are currently inside the scrolling viewport. Only those measures are
 * returned — the Konva canvas draws ONLY those lines (virtualisation).
 *
 * @param config    Timeline display config (zoom, total beats, time sig)
 * @param scrollRef Ref to the horizontally scrolling container element
 */
export function useTimelineGrid(
  config: TimelineConfig,
  scrollRef: RefObject<HTMLElement | null>,
): UseTimelineGridReturn {
  const { pxPerBeat, totalBeats, beatsPerMeasure } = config;

  const scale = useMemo(
    () => createTimelineScale(pxPerBeat, totalBeats),
    [pxPerBeat, totalBeats],
  );

  const totalMeasures = Math.ceil(totalBeats / beatsPerMeasure);
  const measureWidth = pxPerBeat * beatsPerMeasure;
  const totalWidth = totalBeats * pxPerBeat;

  // useVirtualizer calculates which measures are in the scroll viewport.
  // We use it for index math only — the Konva canvas does the actual draw.
  const virtualizer = useVirtualizer({
    count: totalMeasures,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => measureWidth,
    horizontal: true,
    overscan: 3, // render 3 extra measures outside viewport edges
  });

  const virtualMeasures: VirtualMeasure[] = virtualizer
    .getVirtualItems()
    .map((item) => ({
      index: item.index,
      start: item.start,
      size: item.size,
    }));

  return {
    virtualMeasures,
    totalWidth,
    beatToPixel: (beat: number) => scale(beat) ?? 0,
    measureWidth,
  };
}
