import { AudioWaveform, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-30">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu"
          className="text-muted-foreground hover:text-foreground transition"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <AudioWaveform className="text-primary w-6 h-6" />
          <span className="font-bold text-lg tracking-tight text-foreground">
            SoundLab
          </span>
        </div>
      </div>

      <div className="hidden md:block">
        <h1 className="text-sm font-medium text-muted-foreground">
          New Project
        </h1>
      </div>

      <div className="flex items-center space-x-2">
      </div>
    </header>
  );
}
