"use client"
import { useTimelineStore } from "@/features/timeline-ruler/store/timelineStore";
import { useAudioStore } from "@/features/core-audio/store/audioStore";
import { useTrackStore } from "@/features/track-manager/store/trackStore";
import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { AudioEngine } from "@/features/core-audio/lib/audio-engine";
import { Track, AudioBlock } from "@/features/core-audio/types/audio";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay
} from "@dnd-kit/core";
import { AudioClip } from "./AudioClip";
import { restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SlidersHorizontal } from "lucide-react";

export function DashboardTimeline() {
  const {
    pixelsPerSecond,
    autoScroll,
    toggleAutoScroll,
    snapToGrid,
    toggleSnap
  } = useTimelineStore();

  const {
    isPlaying,
    playheadPosition,
    setPlayheadPosition,
    bpm,
    timeSignature,
    isLooping,
    loopStart,
    loopEnd,
    setLoopPoints,
    isRecording
  } = useAudioStore();

  const { tracks, updateBlock, addBlock } = useTrackStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [draggingLoop, setDraggingLoop] = useState<'start' | 'end' | 'both' | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isRecording && recordingStartTime === null) {
      setRecordingStartTime(playheadPosition);
    } else if (!isRecording) {
      setRecordingStartTime(null);
    }
  }, [isRecording, playheadPosition, recordingStartTime]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const block = active.data.current?.block as AudioBlock;
    if (!block) return;

    const deltaX = delta.x / pixelsPerSecond;
    let newStartTime = Math.max(0, block.startTime + deltaX);

    // Snapping logic if enabled
    if (snapToGrid) {
      newStartTime = Math.round(newStartTime / beatDuration) * beatDuration;
    }

    updateBlock(block.trackId, block.id, { startTime: newStartTime });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || tracks.length === 0) return;

    const blobUrl = URL.createObjectURL(file);

    // Create temporary audio context to get duration
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

    const newBlock: AudioBlock = {
      id: Math.random().toString(36).substring(7),
      trackId: tracks[0].id,
      name: file.name,
      fileName: file.name,
      blobUrl,
      startTime: playheadPosition,
      duration: decodedData.duration,
      originalDuration: decodedData.duration,
      offset: 0,
    };

    addBlock(tracks[0].id, newBlock);
    audioCtx.close();
  };

  const MAX_SECONDS = 300; // Increased for performance test
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * timeSignature[0];

  const scrollRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);

  const totalWidth = Math.max(800, MAX_SECONDS * pixelsPerSecond + 300);
  const totalHeight = Math.max(500, tracks.length * 80);

  // Format seconds to mm:ss.ms
  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(3).padStart(6, '0');
    return `${mins}:${secs}`;
  }, []);

  // 1. Draw Ruler
  useEffect(() => {
    const canvas = rulerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = totalWidth;
    canvas.height = 30;

    ctx.clearRect(0, 0, totalWidth, 30);
    ctx.fillStyle = '#111119'; ctx.fillRect(0, 0, totalWidth, 30);

    const pxBar = barDuration * pixelsPerSecond;
    const labelEvery = pxBar < 40 ? Math.ceil(50 / pxBar) : 1;

    for (let bar = 0; bar < (MAX_SECONDS / barDuration) + 1; bar++) {
      const time = bar * barDuration;
      const x = Math.round(time * pixelsPerSecond);
      if (x > totalWidth) break;

      // Bar line
      ctx.strokeStyle = '#2a2a44'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 30); ctx.stroke();

      // Beat subdivisions
      for (let b = 1; b < timeSignature[0]; b++) {
        const bx = Math.round((time + b * beatDuration) * pixelsPerSecond);
        if (bx > totalWidth) break;
        ctx.strokeStyle = '#1c1c2e'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(bx, 18); ctx.lineTo(bx, 30); ctx.stroke();
      }

      if (bar % labelEvery === 0) {
        ctx.fillStyle = '#555575'; ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillText((bar + 1).toString(), x + 3, 13);
        ctx.fillStyle = '#33334a'; ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText(formatTime(time), x + 3, 26);
      }
    }

    // DRAW LOOP MARKERS ON RULER
    if (loopStart !== undefined && loopEnd !== undefined) {
      const lX = loopStart * pixelsPerSecond;
      const rX = loopEnd * pixelsPerSecond;

      // Highlight loop duration area
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(lX, 0, rX - lX, 30);

      ctx.fillStyle = '#c084fc'; // purple-400
      // Left flag
      ctx.beginPath();
      ctx.moveTo(lX, 0); ctx.lineTo(lX + 8, 0); ctx.lineTo(lX, 8); ctx.closePath(); ctx.fill();
      // Right flag
      ctx.beginPath();
      ctx.moveTo(rX, 0); ctx.lineTo(rX - 8, 0); ctx.lineTo(rX, 8); ctx.closePath(); ctx.fill();

      // Line connecting them at top
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lX, 1); ctx.lineTo(rX, 1); ctx.stroke();
    }
  }, [totalWidth, pixelsPerSecond, barDuration, beatDuration, timeSignature, formatTime, MAX_SECONDS, loopStart, loopEnd]);

  // 2. Draw Grid
  useEffect(() => {
    const canvas = gridRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.clearRect(0, 0, totalWidth, totalHeight);

    // Draw Loop Overlay
    if (isLooping && loopStart !== undefined && loopEnd !== undefined) {
      const lX = loopStart * pixelsPerSecond;
      const rX = loopEnd * pixelsPerSecond;
      ctx.fillStyle = 'rgba(192, 132, 252, 0.05)'; // purple-400 with very low opacity
      ctx.fillRect(lX, 0, rX - lX, totalHeight);

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lX, 0); ctx.lineTo(lX, totalHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rX, 0); ctx.lineTo(rX, totalHeight); ctx.stroke();
    }

    for (let bar = 0; bar < (MAX_SECONDS / barDuration) + 1; bar++) {
      const time = bar * barDuration;
      const x = Math.round(time * pixelsPerSecond);
      const nx = Math.round((time + barDuration) * pixelsPerSecond);
      if (x > totalWidth) break;

      // Zebra striping
      if (bar % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.016)';
        ctx.fillRect(x, 0, nx - x, totalHeight);
      }

      ctx.strokeStyle = '#1e1e2e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, totalHeight); ctx.stroke();

      for (let b = 1; b < timeSignature[0]; b++) {
        const bx = Math.round((time + b * beatDuration) * pixelsPerSecond);
        if (bx > totalWidth) break;
        ctx.strokeStyle = '#161626'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, totalHeight); ctx.stroke();
      }
    }

    // Horizontal track dividers
    for (let i = 0; i <= tracks.length; i++) {
      ctx.strokeStyle = '#1a1a28'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, i * 80); ctx.lineTo(totalWidth, i * 80); ctx.stroke();
    }
  }, [totalWidth, totalHeight, pixelsPerSecond, barDuration, beatDuration, timeSignature, tracks.length, MAX_SECONDS, isLooping, loopStart, loopEnd]);

  // 3. Playhead Sync RAf Loop
  useEffect(() => {
    let rafId: number;
    const engine = AudioEngine.getInstance();

    const update = () => {
      if (engine) {
        setPlayheadPosition(engine.getSeconds());
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [setPlayheadPosition]);

  // 5. Sync Loop State with AudioEngine
  useEffect(() => {
    AudioEngine.getInstance()?.setLoop(isLooping, loopStart, loopEnd);
  }, [isLooping, loopStart, loopEnd]);

  // 6. Auto-Scroll Effect
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const phX = playheadPosition * pixelsPerSecond;
      const vw = scrollRef.current.clientWidth;
      if (phX > scrollRef.current.scrollLeft + vw * 0.72) {
        scrollRef.current.scrollLeft = phX - vw * 0.28;
      }
    }
  }, [playheadPosition, pixelsPerSecond, autoScroll]);

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const time = x / pixelsPerSecond;

    // Check hit on loop handles
    const hitTolerance = 10 / pixelsPerSecond;
    if (Math.abs(time - loopStart) < hitTolerance) {
      setDraggingLoop('start');
    } else if (Math.abs(time - loopEnd) < hitTolerance) {
      setDraggingLoop('end');
    } else {
      // Set playhead position or start defining a new loop region if CMD key is held
      if (e.metaKey || e.ctrlKey) {
        setLoopPoints(time, time + 0.1);
        setDraggingLoop('end');
      } else {
        let newTime = time;
        if (snapToGrid) {
          newTime = Math.round(newTime / beatDuration) * beatDuration;
        }
        AudioEngine.getInstance()?.seek(newTime);
        setPlayheadPosition(newTime);
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingLoop) return;

    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    let time = Math.max(0, x / pixelsPerSecond);

    if (snapToGrid) {
      time = Math.round(time / beatDuration) * beatDuration;
    }

    if (draggingLoop === 'start') {
      setLoopPoints(Math.min(time, loopEnd - 0.1), loopEnd);
    } else if (draggingLoop === 'end') {
      setLoopPoints(loopStart, Math.max(time, loopStart + 0.1));
    }

    // Update AudioEngine loop points
    AudioEngine.getInstance()?.setLoop(isLooping, loopStart, loopEnd);
  }, [draggingLoop, loopStart, loopEnd, pixelsPerSecond, snapToGrid, beatDuration, setLoopPoints, isLooping]);

  const handleMouseUp = useCallback(() => {
    setDraggingLoop(null);
  }, []);

  useEffect(() => {
    if (draggingLoop) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingLoop, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="flex-1 bg-background flex flex-col relative overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        if (e.dataTransfer.files.length > 0) {
          const files = e.dataTransfer.files;
          const fakeEvent = { target: { files } } as any;
          handleFileUpload(fakeEvent);
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="audio/*"
      />

      {isOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center pointer-events-none">
          <p className="text-xl font-bold text-primary animate-pulse">Drop Audio to Upload</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto relative select-none custom-scrollbar"
        >
          <div
            className="relative min-h-full"
            style={{ width: `${totalWidth}px` }}
          >
            {/* Ruler Canvas */}
            <canvas
              ref={rulerRef}
              className="sticky top-0 z-30 cursor-crosshair h-[30px] border-b border-white/5 shadow-sm"
              onMouseDown={handleRulerMouseDown}
              style={{ width: `${totalWidth}px`, height: '30px' }}
            />

            {/* Grid Canvas */}
            <canvas
              ref={gridRef}
              className="absolute top-[30px] left-0 pointer-events-none z-0"
              style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}
            />

            {/* Track Rows Layer */}
            <div className="absolute top-[30px] left-0 right-0 z-10 flex flex-col min-h-[calc(100%-30px)]">
              {tracks.length > 0 ? (
                <>
                  {tracks.map((track: Track) => (
                    <div
                      key={track.id}
                      className="h-[80px] relative w-full border-b border-white/5 bg-transparent"
                    >
                      {track.blocks.map((block) => (
                        <AudioClip key={block.id} block={block} color={track.color} />
                      ))}

                      {/* Ghost block for recording */}
                      {isRecording && recordingStartTime !== null && track.isArmed && (
                        <div
                          className="absolute h-[64px] top-[8px] bg-rose-500/30 border border-rose-500/50 z-20 pointer-events-none rounded animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                          style={{
                            left: `${recordingStartTime * pixelsPerSecond}px`,
                            width: `${Math.max(4, (playheadPosition - recordingStartTime) * pixelsPerSecond)}px`
                          }}
                        >
                          <div className="absolute top-1 left-2 text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                            Recording
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Padding rows if few tracks */}
                  {Array.from({ length: Math.max(0, 8 - tracks.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-[80px] w-full border-b border-white/10 opacity-[0.03]" />
                  ))}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 mt-32 space-y-4 pointer-events-none">
                  <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex items-center justify-center">
                    <SlidersHorizontal className="w-8 h-8 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">No tracks yet</p>
                    <p className="text-xs opacity-60">Click 'Add Track' in the sidebar or drop audio here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Playhead Marker */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-40 pointer-events-none"
              style={{ transform: `translateX(${playheadPosition * pixelsPerSecond}px)` }}
            >
              <div className="absolute top-0 -left-[5px] w-0 h-0 border-x-[6px] border-x-transparent border-t-8 border-t-white" />
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
