import { Activity, Command, Edit2, FileEdit, Music, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardFooter() {
  return (
    <footer className="h-11 bg-card border-t border-border flex items-center justify-between px-4 shrink-0 z-30">
      <div className="flex items-center space-x-1">
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          className="h-7 px-4 rounded-full text-muted-foreground hover:text-foreground text-[11px] font-semibold"
          aria-label="Lyrics and Notes"
        >
          <FileEdit className="w-3.5 h-3.5 mr-1.5" />
          <span>Lyrics/Notes</span>
        </Button>
        <Button
          variant="outline"
          className="h-7 px-4 ml-2 bg-background hover:bg-accent border-border rounded-full text-muted-foreground/80 hover:text-foreground text-[11px] font-semibold"
          aria-label="Shortcuts"
        >
          <Command className="w-3.5 h-3.5 mr-1.5" />
          <span>Shortcuts</span>
        </Button>
      </div>
    </footer>
  );
}
