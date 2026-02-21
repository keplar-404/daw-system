/**
 * @file use-transport-keyboard-shortcuts.ts
 * @description Registers transport-level keyboard shortcuts (Space, etc.)
 * scoped to the document. Must only be mounted once at the workspace level.
 *
 * Handles:
 *   Space           → Play / Pause
 *
 * Performance notes:
 * - The event listener is registered ONCE on mount and never re-registered.
 * - Store state is read via `useTransportStore.getState()` inside the handler,
 *   avoiding the need to close over reactive values.
 */

import { useEffect } from "react";
import { useTransportStore } from "@/features/transport/transport-store";

/**
 * Registers global keyboard shortcuts for transport management.
 * Call this hook once in the workspace container component.
 */
export function useTransportKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when no text input is focused
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      switch (e.code) {
        case "Space":
          if (!isTyping) {
            e.preventDefault();
            const { playState, play, pause } = useTransportStore.getState();
            if (playState === "playing") {
              pause();
            } else {
              play();
            }
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
