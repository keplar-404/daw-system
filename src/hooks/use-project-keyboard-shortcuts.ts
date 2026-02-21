/**
 * @file use-project-keyboard-shortcuts.ts
 * @description Registers project-level keyboard shortcuts (Ctrl+S, Ctrl+Z, etc.)
 * scoped to the document. Must only be mounted once at the workspace level.
 *
 * Handles:
 *   Ctrl+S          → Save active project
 *   Ctrl+Z          → Undo
 *   Ctrl+Shift+Z    → Redo
 *   Ctrl+Y          → Redo (Windows alt)
 *   Ctrl+N          → New project
 *   Ctrl+E          → Export project
 *
 * Performance notes:
 * - The event listener is registered ONCE on mount and never re-registered.
 * - Store state is read via `useProjectStore.getState()` inside the handler,
 *   avoiding the need to close over reactive values and making `activeProject`
 *   a non-dependency of the effect.
 */

import { useEffect } from "react";
import { useProjectStore } from "@/features/project/project-store";

/**
 * Registers global keyboard shortcuts for project management.
 * Call this hook once in the workspace container component.
 */
export function useProjectKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when no text input is focused
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      // Read fresh state on every keydown instead of closing over stale refs.
      // This avoids re-registering the listener on every store mutation.
      const { activeProject, saveActiveProject, undo, redo, exportProject, createProject } = useProjectStore.getState();

      switch (e.key.toLowerCase()) {
        case "s":
          if (!isTyping) {
            e.preventDefault();
            if (activeProject) saveActiveProject();
          }
          break;
        case "z":
          if (!isTyping) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case "y":
          if (!isTyping) {
            e.preventDefault();
            redo();
          }
          break;
        case "n":
          if (!isTyping) {
            e.preventDefault();
            createProject("Untitled Project");
          }
          break;
        case "e":
          if (!isTyping) {
            e.preventDefault();
            if (activeProject) exportProject();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Cleanup: removes the listener when the workspace unmounts
    return () => document.removeEventListener("keydown", handleKeyDown);
    // Empty dep array: register ONCE. State is read via getState() at call time.
  }, []);
}
