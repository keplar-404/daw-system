/**
 * @file Workspace.tsx
 * @description Main DAW Workspace container component.
 *
 * Houses the top-level layout of the DAW:
 *   1. ProjectControlBar (persistent top bar with project management)
 *   2. [Timeline / Tracks / Mixer panels — to be added in subsequent features]
 *
 * Registers global keyboard shortcuts for the project.
 */

"use client";

import type React from "react";
import { ProjectControlBar } from "@/components/daw/project-control-bar";
import { TransportBar } from "@/components/daw/transport-bar";
import { useProjectKeyboardShortcuts } from "@/hooks/use-project-keyboard-shortcuts";
import { useTransportKeyboardShortcuts } from "@/hooks/use-transport-keyboard-shortcuts";

/**
 * Main DAW Workspace Entry Component
 * @returns {React.ReactElement} The DAW interface
 */
export function Workspace(): React.ReactElement {
  // Register global project keyboard shortcuts once at workspace root
  useProjectKeyboardShortcuts();
  useTransportKeyboardShortcuts();

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground"
      role="application"
      aria-label="DAW AI Workspace"
    >
      {/* Top control bar — always visible */}
      <ProjectControlBar />
      <TransportBar />

      {/* Main workspace area — timeline, tracks, mixer will go here */}
      <main className="flex-1 flex items-center justify-center min-h-0 relative" aria-label="DAW workspace canvas">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <p className="text-sm">Timeline and Tracks — coming next</p>
        </div>
      </main>
    </div>
  );
}
