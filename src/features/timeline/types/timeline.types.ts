/** Configuration driving the timeline rendering. */
export interface TimelineConfig {
  /** Pixels per musical beat. Controls zoom level. Default: 50. */
  pxPerBeat: number;
  /** Total project length in beats. Default: 128 (32 bars × 4/4). */
  totalBeats: number;
  /** Beats per measure (time signature numerator). Default: 4. */
  beatsPerMeasure: number;
  /** Height of the canvas grid in pixels. Default: 600 */
  height: number;
  /** Whether the automation layer overlay is active. Default: true */
  automationActive?: boolean;
}

/** A single visible measure item returned by the virtualizer. */
export interface VirtualMeasure {
  /** Measure index (0-based). */
  index: number;
  /** Pixel start position for this measure. */
  start: number;
  /** Pixel width of this measure. */
  size: number;
}
