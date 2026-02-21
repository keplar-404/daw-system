import type React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

/**
 * Main Timeline Layout wrapper with Tracks overlay and Bottom Mixer
 */
export function Timeline(): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
      {/* Top Transport and Tools Bar */}
      <div className="h-10 border-b flex items-center px-4 bg-muted/40 shrink-0 gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs font-semibold">
          <span className="material-symbols-outlined text-sm mr-1">add</span>
          Add Track
        </Button>
        <div className="w-px h-4 bg-border mx-2" />
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <span className="material-symbols-outlined text-sm text-primary">play_arrow</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <span className="material-symbols-outlined text-sm text-destructive">fiber_manual_record</span>
        </Button>
      </div>

      {/* Timeline Tracking / Playlist view */}
      <div className="flex-1 relative overflow-auto">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "6rem 100%",
          }}
        />

        <ScrollArea className="h-full">
          {/* Track 1 Example */}
          <div className="flex h-20 border-b relative group">
            {/* Track Header */}
            <div className="w-64 border-r shrink-0 bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-xs truncate mr-2">Lead Synth 01</span>
                <span className="bg-primary/20 text-primary text-[9px] font-bold px-1 rounded border border-primary/30 shrink-0">
                  MIDI
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="w-6 h-6 p-0 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  M
                </Button>
                <Button
                  variant="outline"
                  className="w-6 h-6 p-0 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  S
                </Button>
              </div>
            </div>
            {/* Track Content / Clips Area */}
            <div className="flex-1 relative bg-background/50">
              {/* Example Clip */}
              <div className="absolute top-2 left-[5%] h-16 w-[25%] bg-primary/20 border border-primary/40 rounded-lg shadow-lg cursor-pointer hover:brightness-110 flex flex-col overflow-hidden">
                <div className="bg-primary/40 text-[10px] font-bold px-2 py-0.5 truncate tracking-wide">
                  Lead Synth 01_A
                </div>
              </div>
            </div>
          </div>

          {/* Track 2 Example */}
          <div className="flex h-24 border-b relative group bg-destructive/5 cursor-default">
            {/* Track Header */}
            <div className="w-64 border-r shrink-0 bg-card p-3 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-xs truncate mr-2">Vocals Main</span>
                <span className="bg-destructive/20 text-destructive text-[9px] font-bold px-1 rounded border border-destructive/30 shrink-0">
                  AUDIO
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="w-6 h-6 p-0 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  M
                </Button>
                <Button
                  variant="outline"
                  className="w-6 h-6 p-0 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  S
                </Button>
              </div>
            </div>
            {/* Track Content / Clips Area */}
            <div className="flex-1 relative bg-background/50">
              <div className="absolute top-2 left-[15%] h-20 w-[40%] bg-destructive/20 border border-destructive/40 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-destructive/40 text-[10px] font-bold px-2 py-0.5 truncate tracking-wide text-foreground">
                  Vocals Main_Verse
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Mixer Panel (Matches HTML footprint) */}
      <div className="h-[280px] border-t shrink-0 flex overflow-x-auto overflow-y-hidden z-20 shadow-2xl bg-card">
        {/* Mixer Channel 1 */}
        {[
          { name: "Lead Synth", db: "-6.2dB", plugins: ["EQ 8", "Compressor", "Reverb"] },
          { name: "Vocals", db: "-12.0dB", plugins: ["De-Esser", "Pro-Q 3"] },
        ].map((channel, i) => (
          <div
            key={i.toString()}
            className="w-24 border-r flex flex-col items-center py-2 relative group hover:bg-muted/30 transition-colors"
          >
            {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
            <div className="flex flex-col space-y-1 w-full px-2 mb-2 min-h-[72px]">
              {channel.plugins.map((pl, idx) => (
                <div
                  key={idx.toString()}
                  className="h-4 bg-muted border text-[9px] rounded flex items-center justify-center text-muted-foreground truncate cursor-pointer hover:text-foreground"
                >
                  {pl}
                </div>
              ))}
              <div className="h-4 w-full bg-transparent border border-dashed rounded flex items-center justify-center text-muted-foreground text-[10px] hover:text-foreground cursor-pointer">
                +
              </div>
            </div>
            <div className="flex space-x-2 my-2">
              <Button variant="outline" className="w-6 h-6 p-0 text-[10px] rounded-full font-bold">
                M
              </Button>
              <Button variant="outline" className="w-6 h-6 p-0 text-[10px] rounded-full font-bold">
                S
              </Button>
            </div>
            <div className="flex-1 w-full flex justify-center space-x-2 px-2 pb-2 h-32 relative group-hover:opacity-90">
              {/* Virtual Fader Slider Implementation using Shadcn Slider */}
              <Slider defaultValue={[70]} max={100} step={1} orientation="vertical" className="h-28 mt-2" />
            </div>
            <div className="mt-auto w-full text-center px-1">
              <div className="bg-background border rounded py-1 px-1 flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-primary truncate leading-none">{channel.name}</span>
                <span className="text-[9px] text-muted-foreground font-mono leading-none">{channel.db}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
