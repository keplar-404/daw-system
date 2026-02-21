"use client";

/**
 * @file Timeline.tsx
 * @description Main timeline layout container.
 *
 * Architecture:
 * - Left: frozen track-header panel (DOM / React — virtualized)
 * - Top: TimelineRuler (Canvas 2D — bar markers)
 * - Right: PixiCanvas (WebGL — clips, grid, playhead)
 * - Bottom: collapsible Mixer panel
 *
 * Scroll/zoom is managed via UIStore + useZoomPan hook.
 * React renders track headers; Pixi renders the canvas content.
 * The two are kept in sync by sharing the UIStore camera.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProjectStore } from "@/features/project/project-store";
import { useUIStore, selectTrackHeight, TRACK_HEADER_WIDTH } from "@/store/uiStore";
import { useZoomPan } from "@/hooks/useZoomPan";
import { PixiCanvas } from "@/features/pixi/canvas";
import { TimelineRuler } from "@/components/daw/timeline-ruler";
import { TrackHeader } from "@/components/daw/track-header";
import { createDefaultTrack } from "@/features/project/project-factory";
import { Button } from "@/components/ui/button";
import { Plus, Music } from "lucide-react";
import { MixerPanel } from "@/features/mixer/mixer-panel";
import { TrackHeaderList } from "./components/track-header-list";
import { ZoomControls } from "./components/zoom-controls";
import { BottomBar } from "./components/bottom-bar";



// ---------------------------------------------------------------------------
// Add Track button
// ---------------------------------------------------------------------------

const AddTrackButton = React.memo(function AddTrackButton(): React.ReactElement {
  const addTrack = useProjectStore((s) => s.addTrack);
  const trackCount = useProjectStore((s) => s.activeProject?.tracks.length ?? 0);
  const hasProject = useProjectStore((s) => s.activeProject !== null);

  const handleAdd = useCallback(() => {
    if (!hasProject) return;
    const nextOrder = trackCount;
    const track = createDefaultTrack(
      `Track ${nextOrder + 1}`,
      nextOrder,
      nextOrder,
    );
    addTrack(track);
  }, [addTrack, hasProject, trackCount]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs font-semibold"
      aria-label="Add new track"
      disabled={!hasProject}
      onClick={handleAdd}
    >
      <Plus className="h-4 w-4 mr-1" />
      Add Track
    </Button>
  );
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState(): React.ReactElement {
  const createProject = useProjectStore((s) => s.createProject);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
      <Music className="h-16 w-16 opacity-20" aria-hidden="true" />
      <p className="text-sm">No project loaded.</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => createProject()}
        aria-label="Create a new project to start"
      >
        Create New Project
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Timeline
// ---------------------------------------------------------------------------

/**
 * Timeline
 *
 * Composes the complete multi-track grid UI:
 *   - Toolbar row (add track, zoom)
 *   - TimelineRuler (bar markers)
 *   - [TrackHeaders | PixiCanvas] side by side
 *   - Camera scrollY synced between headers and Pixi
 */
export function Timeline(): React.ReactElement {
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  const [containerWidth, setContainerWidth] = useState(800);

  const hasProject = useProjectStore((s) => s.activeProject !== null);
  const totalBars = useProjectStore((s) => s.activeProject?.settings.lengthBars ?? 64);
  const camera = useUIStore((s) => s.camera);
  const setScrollY = useUIStore((s) => s.setScrollY);
  const setScrollX = useUIStore((s) => s.setScrollX);
  const trackHeight = useUIStore(selectTrackHeight);
  const mixerVisible = useUIStore((s) => s.mixerVisible);
  const tracks = useProjectStore((s) => s.activeProject?.tracks) ?? [];

  // ---- Attach zoom/pan to the canvas area ----
  useZoomPan(canvasAreaRef, { enabled: hasProject });

  // ---- Observe canvas area height for header virtualization ----
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerHeight(entries[0]?.contentRect.height ?? 400);
      setContainerWidth(entries[0]?.contentRect.width ?? 800);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- Total scrollable height of all tracks ----
  const totalTracksHeight = useMemo(
    () => tracks.length * trackHeight,
    [tracks.length, trackHeight],
  );

  const totalPixelsWidth = useMemo(
    () => totalBars * camera.pixelsPerBar * camera.zoomX,
    [totalBars, camera.pixelsPerBar, camera.zoomX],
  );

  // ---- Sync scroll when UIStore camera.scrollY updates ----
  // (useZoomPan writes to UIStore; TrackHeaderList reads camera.scrollY directly)

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 h-full w-full bg-background">
      {/* ── Toolbar ── */}
      <div
        className="h-12 border-b flex items-center px-4 bg-card/60 shrink-0 gap-4"
        role="toolbar"
        aria-label="Timeline toolbar"
      >
        <AddTrackButton />
        <div className="w-px h-5 bg-border" aria-hidden="true" />
        <ZoomControls />
        <div className="flex-1" />
        {/* Tracks/Clips count badge */}
        {hasProject && (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {tracks.length} track{tracks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!hasProject ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Ruler ── */}
          <TimelineRuler headerWidth={TRACK_HEADER_WIDTH} />

          {/* ── Main workspace: headers + canvas ── */}
          <div className="flex-1 flex min-h-0 h-full relative overflow-hidden">
            {/* Frozen track-header column */}
            <div
              className="shrink-0 h-full overflow-hidden bg-card border-r z-10 relative flex flex-col"
              style={{ width: TRACK_HEADER_WIDTH }}
              aria-label="Track headers"
            >
              <TrackHeaderList
                trackHeight={trackHeight}
                scrollY={camera.scrollY}
                containerHeight={containerHeight}
              />
              {/* Add track affordance at bottom of headers */}
              {tracks.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: tracks.length * trackHeight - camera.scrollY,
                    left: 0,
                    right: 0,
                  }}
                >
                  <div className="h-px bg-border/50" />
                </div>
              )}
            </div>

            {/* Pixi canvas area — zoom/pan attached here */}
            <div
              ref={canvasAreaRef}
              className="flex-1 h-full relative overflow-hidden"
              aria-label="Timeline canvas"
              style={{ cursor: "default" }}
            >
              <PixiCanvas className="absolute inset-0 w-full h-full" />

              {/* Vertical scrollbar affordance (custom, synced to camera) */}
              {totalTracksHeight > containerHeight && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 z-20"
                  aria-hidden="true"
                  role="presentation"
                >
                  <div
                    className="absolute w-full bg-white/10 rounded-full transition-opacity hover:opacity-100 opacity-60 cursor-pointer"
                    style={{
                      top: `${(camera.scrollY / totalTracksHeight) * 100}%`,
                      height: `${Math.max(10, (containerHeight / totalTracksHeight) * 100)}%`,
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons !== 1) return;
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (!rect) return;
                      const ratio = (e.clientY - rect.top) / rect.height;
                      setScrollY(ratio * totalTracksHeight);
                    }}
                  />
                </div>
              )}

              {/* Horizontal scrollbar affordance */}
              {totalPixelsWidth > containerWidth && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 z-20"
                  aria-hidden="true"
                  role="presentation"
                >
                  <div
                    className="absolute h-full bg-white/10 rounded-full transition-opacity hover:opacity-100 opacity-60 cursor-pointer"
                    style={{
                      left: `${(camera.scrollX / totalPixelsWidth) * 100}%`,
                      width: `${Math.max(10, (containerWidth / totalPixelsWidth) * 100)}%`,
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons !== 1) return;
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (!rect) return;
                      const ratio = (e.clientX - rect.left) / rect.width;
                      setScrollX(ratio * totalPixelsWidth);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Mixer panel (collapsible) ── */}
          {mixerVisible && (
            <MixerPanel />
          )}

          {/* ── Bottom App Bar ── */}
          <BottomBar />
        </>
      )}
    </div>
  );
}


