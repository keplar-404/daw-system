/**
 * @file project-settings-dialog.tsx
 * @description Modal dialog for editing project-level settings:
 * tempo, time signature, key, scale, sample rate, and bit depth.
 * Pure presentational component — receives props, calls callbacks.
 */

import { Settings2 } from "lucide-react";
import React, { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import type {
  KeySignature,
  ProjectSettings,
  ScaleMode,
  TimeSignatureDenominator,
  TimeSignatureNumerator,
} from "@/types/project";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KEY_OPTIONS: KeySignature[] = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
];

const SCALE_OPTIONS: ScaleMode[] = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian"];

const NUMERATOR_OPTIONS: TimeSignatureNumerator[] = [2, 3, 4, 5, 6, 7, 8, 9, 12];
const DENOMINATOR_OPTIONS: TimeSignatureDenominator[] = [2, 4, 8, 16];
const SAMPLE_RATE_OPTIONS = [44100, 48000, 88200, 96000] as const;
const BIT_DEPTH_OPTIONS = [16, 24, 32] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProjectSettingsDialogProps {
  /** Current settings to display */
  settings: ProjectSettings;
  /** Called when the user confirms changes */
  onSave: (updated: Partial<ProjectSettings>) => void;
  /** Whether the trigger button should be disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ProjectSettingsDialog
 *
 * Renders a gear icon trigger button. When opened, presents a controlled form
 * for editing all project-level audio settings. Changes are not committed until
 * the user presses "Apply".
 */
export const ProjectSettingsDialog = React.memo(function ProjectSettingsDialog({
  settings,
  onSave,
  disabled = false,
}: ProjectSettingsDialogProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) setLocalSettings(settings);
      setOpen(isOpen);
    },
    [settings],
  );

  const handleApply = useCallback(() => {
    onSave(localSettings);
    setOpen(false);
  }, [localSettings, onSave]);

  const handleTempoChange = useCallback((value: number[]) => {
    setLocalSettings((prev) => ({ ...prev, tempo: value[0] }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          id="project-settings-trigger"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Open project settings"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] bg-card border-border" aria-describedby="project-settings-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Project Settings
          </DialogTitle>
        </DialogHeader>

        <form
          id="project-settings-desc"
          className="grid gap-5 py-2"
          aria-label="Project settings form"
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
        >
          {/* Tempo */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tempo-slider" className="text-sm text-foreground">
                Tempo (BPM)
              </Label>
              {/* aria-live region announces slider value changes to screen readers */}
              <output htmlFor="tempo-slider" className="text-sm font-mono text-primary tabular-nums" aria-live="polite">
                {localSettings.tempo}
              </output>
            </div>
            <Slider
              id="tempo-slider"
              min={20}
              max={300}
              step={1}
              value={[localSettings.tempo]}
              onValueChange={handleTempoChange}
              aria-label="Tempo in BPM"
              aria-valuemin={20}
              aria-valuemax={300}
              aria-valuenow={localSettings.tempo}
              aria-valuetext={`${localSettings.tempo} BPM`}
              className="cursor-pointer"
            />
          </div>

          {/* Time Signature */}
          <div className="grid gap-2">
            <Label className="text-sm text-foreground">Time Signature</Label>
            <div className="flex items-center gap-3">
              <Select
                value={String(localSettings.timeSignature.numerator)}
                onValueChange={(v) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    timeSignature: {
                      ...prev.timeSignature,
                      numerator: Number(v) as TimeSignatureNumerator,
                    },
                  }))
                }
              >
                <SelectTrigger id="time-sig-numerator" className="w-20" aria-label="Time signature numerator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NUMERATOR_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-lg font-bold" aria-hidden="true">
                /
              </span>
              <Select
                value={String(localSettings.timeSignature.denominator)}
                onValueChange={(v) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    timeSignature: {
                      ...prev.timeSignature,
                      denominator: Number(v) as TimeSignatureDenominator,
                    },
                  }))
                }
              >
                <SelectTrigger id="time-sig-denominator" className="w-20" aria-label="Time signature denominator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DENOMINATOR_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key + Scale row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="key-select" className="text-sm text-foreground">
                Key
              </Label>
              <Select
                value={localSettings.key}
                onValueChange={(v) => setLocalSettings((prev) => ({ ...prev, key: v as KeySignature }))}
              >
                <SelectTrigger id="key-select" aria-label="Musical key">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEY_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scale-select" className="text-sm text-foreground">
                Scale
              </Label>
              <Select
                value={localSettings.scale}
                onValueChange={(v) => setLocalSettings((prev) => ({ ...prev, scale: v as ScaleMode }))}
              >
                <SelectTrigger id="scale-select" aria-label="Scale mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sample Rate + Bit Depth row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sample-rate-select" className="text-sm text-foreground">
                Sample Rate
              </Label>
              <Select
                value={String(localSettings.sampleRate)}
                onValueChange={(v) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    sampleRate: Number(v) as ProjectSettings["sampleRate"],
                  }))
                }
              >
                <SelectTrigger id="sample-rate-select" aria-label="Sample rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_RATE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)} kHz
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bit-depth-select" className="text-sm text-foreground">
                Bit Depth
              </Label>
              <Select
                value={String(localSettings.bitDepth)}
                onValueChange={(v) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    bitDepth: Number(v) as ProjectSettings["bitDepth"],
                  }))
                }
              >
                <SelectTrigger id="bit-depth-select" aria-label="Bit depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BIT_DEPTH_OPTIONS.map((b) => (
                    <SelectItem key={b} value={String(b)}>
                      {b}-bit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project Length */}
          <div className="grid gap-2">
            <Label htmlFor="length-bars-input" className="text-sm text-foreground">
              Length (Bars)
            </Label>
            <Input
              id="length-bars-input"
              type="number"
              min={1}
              max={9999}
              value={localSettings.lengthBars}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  lengthBars: Math.max(1, Number(e.target.value)),
                }))
              }
              aria-label="Project length in bars"
              className="w-28 font-mono"
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} id="project-settings-cancel">
            Cancel
          </Button>
          {/* type="submit" triggers form's onSubmit → handleApply */}
          <Button
            type="submit"
            form="project-settings-desc"
            id="project-settings-apply"
            aria-label="Apply project settings"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
