import type { ScaleLinear } from "d3-scale";
import { scaleLinear } from "d3-scale";

/**
 * Create a linear beat-to-pixel scale for the timeline.
 *
 * @param pxPerBeat  Zoom level — pixels per musical beat. e.g. 50.
 * @param totalBeats Total project length in beats. e.g. 128 (32 bars × 4/4).
 * @returns A d3 ScaleLinear that maps beat → pixel position.
 *
 * @example
 * const scale = createTimelineScale(50, 128);
 * scale(4)   // → 200
 * scale(0.5) // → 25
 */
export function createTimelineScale(
  pxPerBeat: number,
  totalBeats: number,
): ScaleLinear<number, number> {
  return scaleLinear()
    .domain([0, totalBeats])
    .range([0, totalBeats * pxPerBeat]);
}

/**
 * Convenience: total canvas width in pixels for a given config.
 */
export function totalCanvasWidth(
  pxPerBeat: number,
  totalBeats: number,
): number {
  return totalBeats * pxPerBeat;
}
