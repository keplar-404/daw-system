/**
 * @file project-control-bar.tsx
 * @description Top control bar for the DAW workspace.
 *
 * Contains: project name (inline edit), save/load/export/import/new buttons,
 * undo/redo controls, project settings trigger, and save status indicator.
 *
 * Reads from projectStore; dispatches actions back to projectStore.
 * Follows glass-panel discipline: subtle backdrop-blur, no heavy shadows.
 *
 * Performance notes:
 * - Uses derived scalar selectors (selectCanUndo, selectCanRedo, etc.) instead
 *   of subscribing to full Project objects or undo arrays. This prevents
 *   re-renders when unrelated parts of the project change.
 * - All store actions are read in a single useShallow selector block so they
 *   share one subscription.
 * - useTransition removed from synchronous createProject call.
 */

"use client";

import { AlertCircle, CheckCircle2, Download, FilePlus2, Loader2, Redo2, Save, Undo2, Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { OpenProjectDialog } from "@/components/daw/open-project-dialog";
import { ProjectSettingsDialog } from "@/components/daw/project-settings-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createDefaultTrack } from "@/features/project/project-factory";
import {
  selectCanRedo,
  selectCanUndo,
  selectHasProject,
  selectProjectName,
  useProjectStore,
} from "@/features/project/project-store";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SaveStatusIndicator({
  isDirty,
  isSaving,
  error,
}: {
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}): React.ReactElement {
  if (error) {
    return (
      <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
        Error
      </p>
    );
  }
  if (isSaving) {
    return (
      <output className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        <span>Saving…</span>
      </output>
    );
  }
  if (isDirty) {
    return (
      <output className="flex items-center gap-1 text-xs text-amber-500">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        <span>Unsaved</span>
      </output>
    );
  }
  return (
    <output className="flex items-center gap-1 text-xs text-emerald-500">
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      <span>Saved</span>
    </output>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * ProjectControlBar
 *
 * The primary persistent top bar of the DAW. Stays visible at all times
 * per DAW UX standards. Uses glass discipline: backdrop-blur-md + bg-white/5.
 */
export function ProjectControlBar(): React.ReactElement {
  // ---- Derived scalar subscriptions (cheap, stable primitives) ----
  // Each selector returns a primitive — no re-render unless the VALUE changes.
  const canUndo = useProjectStore(selectCanUndo);
  const canRedo = useProjectStore(selectCanRedo);
  const projectName = useProjectStore(selectProjectName);
  const projectReady = useProjectStore(selectHasProject);

  // ---- Small state slice (booleans + nullable string) ----
  const isDirty = useProjectStore((s) => s.isDirty);
  const isSaving = useProjectStore((s) => s.isSaving);
  const isLoading = useProjectStore((s) => s.isLoading);
  const error = useProjectStore((s) => s.error);

  // ---- Infrequently-changing data ----
  const recentProjects = useProjectStore((s) => s.recentProjects);

  // ---- Settings: subscribe only to the settings object (separate from tracks/clips) ----
  const projectSettings = useProjectStore((s) => s.activeProject?.settings ?? null);

  // ---- Actions: one useShallow call for all action refs ----
  // useShallow does a shallow equality check on the returned object so the
  // component only re-renders if an action reference itself changes (never).
  const {
    createProject,
    saveActiveProject,
    loadProjectById,
    deleteProjectById,
    refreshRecentProjects,
    setProjectName,
    updateProjectSettings,
    exportProject,
    importProject,
    undo,
    redo,
    addTrack,
  } = useProjectStore(
    useShallow((s) => ({
      createProject: s.createProject,
      saveActiveProject: s.saveActiveProject,
      loadProjectById: s.loadProjectById,
      deleteProjectById: s.deleteProjectById,
      refreshRecentProjects: s.refreshRecentProjects,
      setProjectName: s.setProjectName,
      updateProjectSettings: s.updateProjectSettings,
      exportProject: s.exportProject,
      importProject: s.importProject,
      undo: s.undo,
      redo: s.redo,
      addTrack: s.addTrack,
    })),
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialise project on first mount if none exists.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    if (!projectReady && !isLoading) {
      createProject("Untitled Project");
    }
    refreshRecentProjects();
  }, []);

  // Sync local name display when the project name changes externally.
  useEffect(() => {
    if (!isEditingName) {
      setLocalName(projectName);
    }
  }, [projectName, isEditingName]);

  const handleNameClick = useCallback(() => {
    if (!projectReady) return;
    setLocalName(projectName);
    setIsEditingName(true);
    requestAnimationFrame(() => nameInputRef.current?.select());
  }, [projectReady, projectName]);

  const handleNameCommit = useCallback(() => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== projectName) {
      setProjectName(trimmed);
    }
    setIsEditingName(false);
  }, [localName, projectName, setProjectName]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleNameCommit();
      if (e.key === "Escape") {
        setLocalName(projectName);
        setIsEditingName(false);
      }
    },
    [handleNameCommit, projectName],
  );

  const handleNewProject = useCallback(() => {
    createProject("Untitled Project");
    addTrack(createDefaultTrack("Track 1", 0, 0));
  }, [createProject, addTrack]);

  const handleSave = useCallback(() => {
    saveActiveProject();
  }, [saveActiveProject]);

  const handleExport = useCallback(() => {
    exportProject();
  }, [exportProject]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      importProject(file);
      e.target.value = "";
    },
    [importProject],
  );

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      await loadProjectById(projectId);
    },
    [loadProjectById],
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectById(projectId);
    },
    [deleteProjectById],
  );

  return (
    <TooltipProvider delayDuration={800}>
      {/*
       * <header> has an implicit ARIA landmark role of "banner" when it is a
       * direct child of <body> or a top-level sectioning element. No explicit
       * role or aria-label is needed — biome rejects aria-label on landmarks.
       */}
      <header
        className={cn(
          "flex items-center h-11 px-3 gap-2 shrink-0",
          "border-b border-white/10 bg-white/5 backdrop-blur-md",
        )}
      >
        {/* ---- New Project ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-new-project"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleNewProject}
              disabled={isLoading}
              aria-label="Create new project"
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>New Project</p>
          </TooltipContent>
        </Tooltip>

        {/* ---- Open ---- */}
        <OpenProjectDialog
          recentProjects={recentProjects}
          onOpen={handleOpenProject}
          onDelete={handleDeleteProject}
          disabled={isLoading}
        />

        <Separator orientation="vertical" className="h-5 mx-0.5 bg-white/10" />

        {/* ---- Save ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-save-project"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleSave}
              disabled={!projectReady || isSaving || isLoading}
              aria-label="Save project (Ctrl+S)"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Save Project</p>
            <kbd className="ml-1 text-xs opacity-60">Ctrl+S</kbd>
          </TooltipContent>
        </Tooltip>

        {/* ---- Export ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-export-project"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleExport}
              disabled={!projectReady || isLoading}
              aria-label="Export project as JSON"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Export Project</p>
          </TooltipContent>
        </Tooltip>

        {/* ---- Import ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-import-project"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleImportClick}
              disabled={isLoading}
              aria-label="Import project from JSON file"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Import Project</p>
          </TooltipContent>
        </Tooltip>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.dawai.json,application/json"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Import project file"
          tabIndex={-1}
        />

        <Separator orientation="vertical" className="h-5 mx-0.5 bg-white/10" />

        {/* ---- Project Name (center) ---- */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          {isEditingName ? (
            <Input
              ref={nameInputRef}
              id="project-name-input"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameCommit}
              onKeyDown={handleNameKeyDown}
              className="h-7 w-48 text-sm text-center font-medium bg-transparent border-transparent focus:border-primary/50 focus:bg-accent/50 rounded-md"
              maxLength={80}
              aria-label="Project name"
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            <button
              type="button"
              id="project-name-display"
              onClick={handleNameClick}
              onKeyDown={(e) => e.key === "Enter" && handleNameClick()}
              disabled={!projectReady}
              className="group flex items-center gap-1.5 h-7 px-2 rounded-md text-sm font-medium text-foreground hover:bg-accent/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[200px]"
              aria-label={`Project name: ${projectName || "No project"}. Click to rename.`}
            >
              <span className="truncate">{projectName || "No Project"}</span>
            </button>
          )}
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5 bg-white/10" />

        {/* ---- Undo ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-undo"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              onClick={undo}
              disabled={!canUndo || !projectReady}
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Undo</p>
            <kbd className="ml-1 text-xs opacity-60">Ctrl+Z</kbd>
          </TooltipContent>
        </Tooltip>

        {/* ---- Redo ---- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="btn-redo"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              onClick={redo}
              disabled={!canRedo || !projectReady}
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Redo</p>
            <kbd className="ml-1 text-xs opacity-60">Ctrl+Shift+Z</kbd>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 mx-0.5 bg-white/10" />

        {/* ---- Project Settings ---- */}
        {projectReady && projectSettings && (
          <ProjectSettingsDialog settings={projectSettings} onSave={updateProjectSettings} disabled={isLoading} />
        )}

        {/* ---- Save Status ---- */}
        <div className="ml-1 min-w-[60px] flex justify-end">
          <SaveStatusIndicator isDirty={isDirty} isSaving={isSaving} error={error} />
        </div>
      </header>
    </TooltipProvider>
  );
}
