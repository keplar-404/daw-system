"use client";

/**
 * SSR-safe lazy wrapper for TimelineCanvas.
 *
 * react-konva touches `document` and `window` on import, which crashes
 * Next.js SSR. This wrapper ensures the canvas only loads in the browser.
 */
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

// Re-export the prop type for consumer convenience
export type { TimelineConfig } from "../types/timeline.types";

const TimelineCanvas = dynamic(
  () =>
    import("./TimelineCanvas").then((mod) => ({ default: mod.TimelineCanvas })),
  {
    ssr: false,
    loading: () => (
      <output
        className="flex h-full w-full items-center justify-center"
        aria-label="Timeline loading"
      >
        <div className="h-px w-16 animate-pulse rounded bg-border" />
      </output>
    ),
  },
);

type TimelineCanvasProps = ComponentProps<typeof TimelineCanvas>;

export function TimelineCanvasLazy(props: TimelineCanvasProps) {
  return <TimelineCanvas {...props} />;
}
