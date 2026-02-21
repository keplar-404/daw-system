"use client";

/**
 * @file Workspace.tsx
 * @description Main DAW Workspace container component.
 *
 * Layout (top → bottom):
 *   1. ProjectControlBar — project management + branding
 *   2. TransportBar     — play/stop/tempo/time-sig controls
 *   3. Timeline         — tracks, clips, ruler, mixer (main workspace)
 *
 * Global keyboard shortcuts are registered at this level.
 */

import type React from "react";
import { ProjectControlBar } from "@/components/daw/project-control-bar";
import { TransportBar } from "@/components/daw/transport-bar";
import { Timeline } from "@/features/workspace/timeline";
import { useProjectKeyboardShortcuts } from "@/hooks/use-project-keyboard-shortcuts";
import { useTransportKeyboardShortcuts } from "@/hooks/use-transport-keyboard-shortcuts";

/**
 * Main DAW Workspace Entry Component
 * @returns {React.ReactElement} The full DAW interface
 */
export function Workspace(): React.ReactElement {
  useProjectKeyboardShortcuts();
  useTransportKeyboardShortcuts();

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground"
      role="application"
      aria-label="DAW AI Workspace"
    >
      {/* Persistent top control bars */}
      <ProjectControlBar />
      <TransportBar />

      {/* Main workspace: timeline + tracks + mixer */}
      <Timeline />
    </div>
  );
}
