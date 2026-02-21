import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Left Side Panels (Asset Browser, Instruments)
 */
export function Panels(): React.ReactElement {
  return (
    <aside className="w-[300px] border-r flex flex-col shrink-0 z-40 bg-card text-card-foreground">
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Browser</h2>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <span className="material-symbols-outlined text-base">dock_to_left</span>
          </Button>
        </div>

        <Input className="h-8 text-xs bg-muted/50 focus-visible:ring-1" placeholder="Search sounds..." />

        <div className="flex gap-2 text-[10px] pb-1">
          <button type="button" className="flex-1 font-semibold border-b-2 border-primary pb-1">
            Sounds
          </button>
          <button type="button" className="flex-1 font-semibold text-muted-foreground hover:text-foreground transition">
            Inst.
          </button>
          <button type="button" className="flex-1 font-semibold text-muted-foreground hover:text-foreground transition">
            Loops
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Example Sound Items */}
          {[
            { name: "Deep House Kick", type: "One Shot", bpm: "—" },
            { name: "Analog Synth Loop", type: "Loop", bpm: "124 BPM" },
            { name: "Grand Piano Chord", type: "Synth", bpm: "—" },
            { name: "Tech House Bass", type: "Loop", bpm: "126 BPM" },
          ].map((item, idx) => (
            <div
              key={idx.toString()}
              className="flex items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer group transition-colors"
            >
              <div className="w-8 h-8 rounded shrink-0 border bg-background flex items-center justify-center mr-3 relative overflow-hidden">
                <span className="material-symbols-outlined text-muted-foreground text-sm z-10 group-hover:text-primary transition-colors">
                  graphic_eq
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{item.name}</div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded border">{item.type}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">{item.bpm}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
