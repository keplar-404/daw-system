"use client";

import { useState } from "react";
import {
  Redo2,
  Repeat,
  Magnet,
  SlidersHorizontal,
  Timer,
  Undo2,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTimelineStore } from "@/features/timeline-ruler/store/timelineStore";
import { AudioEngine } from "@/features/core-audio/lib/audio-engine";
import { VuMeter } from "./VuMeter";
import { useAudioStore } from "@/features/core-audio/store/audioStore";
import { useTrackStore } from "@/features/track-manager/store/trackStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DashboardToolbar() {
  const { tracks, addBlock } = useTrackStore();
  const {
    pixelsPerSecond,
    setPixelsPerSecond,
    snapToGrid,
    toggleSnap
  } = useTimelineStore();

  const {
    isPlaying,
    togglePlayback,
    stopPlayback,
    masterVolume,
    setMasterVolume,
    playheadPosition,
    setPlayheadPosition,
    bpm,
    setBpm,
    timeSignature,
    setTimeSignature,
    isLooping,
    toggleLooping,
    isRecording,
    toggleRecording
  } = useAudioStore();

  const handleVolumeChange = (values: number[]) => {
    const vol = values[0] / 100;
    setMasterVolume(vol);
    // Convert 0-1 to dB (-60 to 0 roughly)
    const db = 20 * Math.log10(Math.max(vol, 0.001));
    AudioEngine.getInstance()?.setVolume(db);
  };

  const handleToggleRecording = async () => {
    const engine = AudioEngine.getInstance();
    if (!engine) return;

    if (!isRecording) {
      // Starting recording
      const armedTrack = tracks.find((t) => t.isArmed);
      if (!armedTrack) {
        alert("Please arm a track first (click the 'R' button on a track)");
        return;
      }

      try {
        await engine.startRecording();
        toggleRecording();
        // Start playback if not already playing to allow recording in context
        if (!isPlaying) {
          togglePlayback();
          engine.play();
        }
      } catch (e) {
        console.error("Failed to start recording", e);
      }
    } else {
      // Stopping recording
      try {
        const result = await engine.stopRecording();
        const { blob, duration } = result;
        toggleRecording();

        // Find the track that WAS armed (assuming it stayed armed)
        const armedTrack = tracks.find((t) => t.isArmed);
        if (armedTrack && blob) {
          const blobUrl = URL.createObjectURL(blob);
          // Calculate start time based on end time - duration if we don't have playhead sync
          const startTime = playheadPosition - duration;

          const newBlock = {
            id: Math.random().toString(36).substring(7),
            trackId: armedTrack.id,
            name: "Recording",
            startTime: Math.max(0, startTime),
            duration: duration,
            originalDuration: duration,
            offset: 0,
            blobUrl: blobUrl,
            fileName: "recording.webm"
          };

          addBlock(armedTrack.id, newBlock);
        }
      } catch (e) {
        console.error("Failed to stop recording", e);
      }
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.2 : 1 / 1.2;
    setPixelsPerSecond(Math.max(20, Math.min(500, pixelsPerSecond * factor)));
  };

  // Format seconds to mm:ss.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1).padStart(4, '0');
    return `${mins}:${secs}`;
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 space-x-4 shrink-0 z-20">

        {/* Left section empty spacers or logo could go here */}
        <div className="flex-1 flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition" aria-label="Undo">
                  <Undo2 className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition" aria-label="Redo">
                  <Redo2 className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Redo</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Center Section: BPM, Transport, Undo/Redo */}
        <div className="flex items-center justify-center space-x-8">

          {/* BPM and Time Signature */}
          <div className="flex items-center bg-[#18181b] rounded-lg h-8 px-2.5 gap-2.5 border border-border/40 shadow-sm">
            {/* Timer and BPM Input */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 focus-within:opacity-100 transition-opacity">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={bpm}
                    onChange={(e) => {
                      const newBpm = parseInt(e.target.value);
                      setBpm(newBpm);
                      AudioEngine.getInstance()?.setBpm(newBpm);
                    }}
                    className="w-10 h-[23px] px-1 py-0 text-[12px] font-bold bg-white/10 hover:bg-white/20 border-none focus-visible:ring-1 focus-visible:ring-white/20 text-foreground shadow-none text-center rounded-md [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0 transition-colors"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Tempo (BPM)</TooltipContent>
            </Tooltip>
            <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
              BPM
            </span>

            {/* Time Signature Select */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Select
                    value={`${timeSignature[0]}/${timeSignature[1]}`}
                    onValueChange={(val) => {
                      const [num, den] = val.split("/").map(Number);
                      setTimeSignature(num, den);
                      AudioEngine.getInstance()?.setTimeSignature(num);
                    }}
                  >
                    <SelectTrigger style={{ height: "24px" }} className="w-auto px-2 pt-2.5 border-none bg-white/10 hover:bg-white/20 text-[12px] font-bold text-foreground focus:ring-0 focus:ring-offset-0 shadow-none rounded-md transition-colors [&>svg]:hidden flex items-center justify-center">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3/4" className="text-xs font-bold">3/4</SelectItem>
                      <SelectItem value="4/4" className="text-xs font-bold">4/4</SelectItem>
                      <SelectItem value="6/8" className="text-xs font-bold">6/8</SelectItem>
                      <SelectItem value="2/4" className="text-xs font-bold">2/4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Time Signature</TooltipContent>
            </Tooltip>

            {/* Key */}
            <button className="flex items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Key</span>
            </button>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center bg-black/60 dark:bg-black/80 rounded-full border border-border/50 p-1 pl-5 shadow-sm">
            <div className="font-mono text-foreground tracking-wider text-sm mr-5">
              {formatTime(playheadPosition)}
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Play/Pause Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      togglePlayback();
                      const engine = AudioEngine.getInstance();
                      if (isPlaying) {
                        engine?.pause();
                      } else {
                        engine?.play();
                      }
                    }}
                    className="h-7 px-4 bg-foreground text-background rounded-full flex items-center justify-center hover:opacity-90 transition shadow-sm"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <div className="flex space-x-1">
                        <div className="w-[3px] h-[10px] bg-background rounded-sm" />
                        <div className="w-[3px] h-[10px] bg-background rounded-sm" />
                      </div>
                    ) : (
                      <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-8 border-l-background ml-0.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isPlaying ? "Pause" : "Play"}</TooltipContent>
              </Tooltip>

              {/* Stop Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      stopPlayback();
                      const engine = AudioEngine.getInstance();
                      engine?.stop();
                      setPlayheadPosition(0);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-foreground/70 hover:text-foreground transition"
                    aria-label="Stop"
                  >
                    <div className="w-3.5 h-3.5 bg-current rounded-[2px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Stop</TooltipContent>
              </Tooltip>

              {/* Record Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleToggleRecording}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center transition",
                      isRecording ? "text-rose-600 animate-pulse" : "text-rose-500 hover:text-rose-400"
                    )}
                    aria-label="Record"
                  >
                    <div className="w-3.5 h-3.5 bg-current rounded-full" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isRecording ? "Stop Recording" : "Record"}</TooltipContent>
              </Tooltip>

              {/* Loop Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleLooping}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center transition pr-1",
                      isLooping ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Toggle Looping"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Toggle Loop</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Zoom and Snap Controls */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSnap}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition",
                    snapToGrid ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Toggle Snapping"
                >
                  <Magnet className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Snap to Grid</TooltipContent>
            </Tooltip>
            <div className="w-px h-4 bg-border mx-1"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleZoom('out')}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom Out</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleZoom('in')}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom In</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Section: Preset */}
        <div className="flex-1 flex justify-end items-center">
          <div className="flex items-center space-x-4 bg-accent rounded-lg p-1 px-2 border border-border h-8">
            <div className="flex items-center space-x-2 px-2 border-r border-background h-full">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs font-bold text-foreground/90 tracking-tight">
                Preset
              </div>
            </div>
            <div className="flex items-center space-x-2 pr-2 w-48 relative">
              <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider
                defaultValue={[masterVolume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-16 **:data-[slot=slider-track]:h-1 **:data-[slot=slider-thumb]:size-2.5"
              />
              <span className="text-[10px] font-mono text-muted-foreground tracking-tighter shrink-0 w-12 text-right">
                {(20 * Math.log10(Math.max(masterVolume, 0.001))).toFixed(1)} dB
              </span>
              <VuMeter />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
