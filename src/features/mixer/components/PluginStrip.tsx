"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { PluginInstance } from "@/features/daw/types/daw.types";

// ── Slider config per effect type ─────────────────────────────────────────────

interface ParamConfig {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: (plugin: PluginInstance) => number;
    format: (v: number) => string;
}

const PARAM_CONFIGS: Record<string, ParamConfig[]> = {
    reverb: [
        {
            key: "decay",
            label: "Decay",
            min: 0.1,
            max: 10,
            step: 0.1,
            defaultValue: (p) => (p.params as { decay: number }).decay,
            format: (v) => `${v.toFixed(1)}s`,
        },
        {
            key: "mix",
            label: "Mix",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: (p) => (p.params as { mix: number }).mix,
            format: (v) => `${Math.round(v * 100)}%`,
        },
    ],
    delay: [
        {
            key: "delayTime",
            label: "Time",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: (p) => (p.params as { delayTime: number }).delayTime,
            format: (v) => `${(v * 1000).toFixed(0)}ms`,
        },
        {
            key: "feedback",
            label: "Feedback",
            min: 0,
            max: 0.95,
            step: 0.01,
            defaultValue: (p) => (p.params as { feedback: number }).feedback,
            format: (v) => `${Math.round(v * 100)}%`,
        },
        {
            key: "mix",
            label: "Mix",
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: (p) => (p.params as { mix: number }).mix,
            format: (v) => `${Math.round(v * 100)}%`,
        },
    ],
    eq: [
        {
            key: "low",
            label: "Low",
            min: -15,
            max: 15,
            step: 0.5,
            defaultValue: (p) => (p.params as { low: number }).low,
            format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}dB`,
        },
        {
            key: "mid",
            label: "Mid",
            min: -15,
            max: 15,
            step: 0.5,
            defaultValue: (p) => (p.params as { mid: number }).mid,
            format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}dB`,
        },
        {
            key: "high",
            label: "High",
            min: -15,
            max: 15,
            step: 0.5,
            defaultValue: (p) => (p.params as { high: number }).high,
            format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}dB`,
        },
    ],
};

const TYPE_COLORS: Record<string, string> = {
    reverb: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    delay: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    eq: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface PluginStripProps {
    trackId: string;
    plugin: PluginInstance;
    onParamChange: (
        trackId: string,
        pluginId: string,
        param: string,
        value: number,
    ) => void;
    onParamCommit: (
        trackId: string,
        pluginId: string,
        param: string,
        value: number,
    ) => void;
    onRemove: (trackId: string, pluginId: string) => void;
}

/**
 * A single plugin card within a ChannelStrip.
 * Renders type badge, per-param sliders, and a remove button.
 * Rule 1 compliant — no direct audio imports.
 */
export function PluginStrip({
    trackId,
    plugin,
    onParamChange,
    onParamCommit,
    onRemove,
}: PluginStripProps) {
    const configs = PARAM_CONFIGS[plugin.type] ?? [];
    const badgeClass = TYPE_COLORS[plugin.type] ?? "bg-muted text-muted-foreground";

    return (
        <div
            data-testid={`plugin-strip-${plugin.id}`}
            className="rounded-md border border-border bg-card/50 p-2 flex flex-col gap-1.5"
        >
            {/* Header: type badge + remove */}
            <div className="flex items-center justify-between">
                <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${badgeClass}`}
                >
                    {plugin.type}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${plugin.type} effect`}
                    onClick={() => onRemove(trackId, plugin.id)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            {/* Param sliders */}
            {configs.map((cfg) => (
                <div key={cfg.key} className="flex items-center gap-1.5">
                    <span className="w-10 shrink-0 text-[9px] text-muted-foreground select-none">
                        {cfg.label}
                    </span>
                    <Slider
                        min={cfg.min}
                        max={cfg.max}
                        step={cfg.step}
                        defaultValue={[cfg.defaultValue(plugin)]}
                        onValueChange={([v]) => onParamChange(trackId, plugin.id, cfg.key, v)}
                        onValueCommit={([v]) => onParamCommit(trackId, plugin.id, cfg.key, v)}
                        aria-label={`${cfg.label} for ${plugin.type} on track ${trackId}`}
                        className="flex-1 h-3"
                    />
                    <span className="w-10 text-right text-[9px] tabular-nums text-muted-foreground select-none">
                        {cfg.format(cfg.defaultValue(plugin))}
                    </span>
                </div>
            ))}
        </div>
    );
}
