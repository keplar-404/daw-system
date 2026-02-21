/**
 * @file open-project-dialog.tsx
 * @description Dialog for browsing recent projects and opening one.
 * Lists IndexedDB-persisted session records. Pure presentational component.
 */

import { Clock, FileAudio, FolderOpen, Trash2 } from "lucide-react";
import React, { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { SessionRecord } from "@/types/project";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OpenProjectDialogProps {
  /** All recent session records */
  recentProjects: SessionRecord[];
  /** Called when the user selects a project to open */
  onOpen: (projectId: string) => void;
  /** Called when the user deletes a project record */
  onDelete: (projectId: string) => void;
  /** Whether the dialog trigger should be disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * OpenProjectDialog
 *
 * Shows a scrollable list of recent projects with open and delete actions.
 */
export const OpenProjectDialog = React.memo(function OpenProjectDialog({
  recentProjects,
  onOpen,
  onDelete,
  disabled = false,
}: OpenProjectDialogProps): React.ReactElement {
  const formatDate = useCallback((isoString: string): string => {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          id="open-project-trigger"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Open recent project"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] bg-card border-border" aria-describedby="open-project-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FolderOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            Recent Projects
          </DialogTitle>
        </DialogHeader>

        <div id="open-project-desc" className="sr-only">
          Browse and open recent projects from local storage
        </div>

        <ScrollArea className="max-h-80">
          {recentProjects.length === 0 ? (
            <output className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <FileAudio className="h-10 w-10 opacity-30" aria-hidden="true" />
              <p className="text-sm">No recent projects</p>
              <p className="text-xs opacity-60">Create a new project to get started</p>
            </output>
          ) : (
            <ul className="space-y-1 pr-2" aria-label="Recent projects">
              {recentProjects.map((record) => (
                <li
                  key={record.id}
                  className="group flex items-center gap-3 rounded-md p-2.5 hover:bg-accent transition-colors"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 shrink-0"
                    aria-hidden="true"
                  >
                    <FileAudio className="h-4 w-4 text-primary" />
                  </div>

                  <button
                    type="button"
                    className="flex-1 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                    onClick={() => onOpen(record.projectId)}
                    aria-label={`Open project ${record.projectName}, last saved ${formatDate(record.updatedAt)}`}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{record.projectName}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <time dateTime={record.updatedAt}>{formatDate(record.updatedAt)}</time>
                    </div>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record.projectId);
                    }}
                    aria-label={`Delete project ${record.projectName}`}
                    id={`delete-project-${record.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});
