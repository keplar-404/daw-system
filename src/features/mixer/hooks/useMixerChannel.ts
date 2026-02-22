"use client";

import { useCallback } from "react";

import { useDawStore } from "@/features/daw/store/dawStore";
import type {
    DelayParams,
    EQParams,
    PluginInstance,
    PluginParams,
    PluginType,
    ReverbParams,
} from "@/features/daw/types/daw.types";
import {
    disposeTrackEffects,
    insertEffect,
    removeEffect,
    setEffectParam,
} from "../services/audioGraphEffects";

// ── Default params per effect type ────────────────────────────────────────────

function buildDefaultParams(type: PluginType): PluginParams {
    switch (type) {
        case "reverb":
            return { type: "reverb", decay: 1.5, mix: 0.5 } satisfies ReverbParams;
        case "delay":
            return {
                type: "delay",
                delayTime: 0.25,
                feedback: 0.3,
                mix: 0.5,
            } satisfies DelayParams;
        case "eq":
            return { type: "eq", low: 0, mid: 0, high: 0 } satisfies EQParams;
    }
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseMixerChannelReturn {
    /** Add a plugin of the given type to a track's effects chain. */
    addPlugin: (trackId: string, type: PluginType) => Promise<void>;
    /** Permanently remove a plugin from a track's chain. */
    removePlugin: (trackId: string, pluginId: string) => void;
    /** Real-time: update a single param on the Tone node — zero Zustand, zero re-render. */
    onParamChange: (
        trackId: string,
        pluginId: string,
        param: string,
        value: number,
    ) => void;
    /** Commit: persist param value to Zustand after drag ends. */
    onParamCommit: (
        trackId: string,
        pluginId: string,
        param: string,
        value: number,
    ) => void;
    /** Remove all effects for a track (called when the track itself is deleted). */
    disposeTrack: (trackId: string) => void;
}

/**
 * Orchestrates the Mixer Channel feature:
 * - Manages Tone.Effect nodes via audioGraphEffects (real-time path)
 * - Writes plugin state to Zustand (commit path)
 *
 * Follows the same split-commit contract as useTrackList:
 *   onParamChange → audioGraphEffects only (no re-render)
 *   onParamCommit → Zustand persist
 */
export function useMixerChannel(): UseMixerChannelReturn {
    const storeAddPlugin = useDawStore((s) => s.addPlugin);
    const storeRemovePlugin = useDawStore((s) => s.removePlugin);
    const storeUpdatePluginParam = useDawStore((s) => s.updatePluginParam);

    const addPlugin = useCallback(
        async (trackId: string, type: PluginType) => {
            const id = crypto.randomUUID();
            const params = buildDefaultParams(type);
            const plugin: PluginInstance = { id, type, params };

            // Wire up the audio graph first, then persist to store
            await insertEffect(trackId, id, type, params);
            storeAddPlugin(trackId, plugin);
        },
        [storeAddPlugin],
    );

    const removePlugin = useCallback(
        (trackId: string, pluginId: string) => {
            removeEffect(trackId, pluginId);
            storeRemovePlugin(trackId, pluginId);
        },
        [storeRemovePlugin],
    );

    // Real-time: audio only — no Zustand, no re-render
    const onParamChange = useCallback(
        (trackId: string, pluginId: string, param: string, value: number) => {
            setEffectParam(trackId, pluginId, param, value);
        },
        [],
    );

    // Commit: persist to Zustand after slider drag ends
    const onParamCommit = useCallback(
        (trackId: string, pluginId: string, param: string, value: number) => {
            storeUpdatePluginParam(trackId, pluginId, { [param]: value } as Partial<PluginParams>);
        },
        [storeUpdatePluginParam],
    );

    const disposeTrack = useCallback((trackId: string) => {
        disposeTrackEffects(trackId);
    }, []);

    return {
        addPlugin,
        removePlugin,
        onParamChange,
        onParamCommit,
        disposeTrack,
    };
}
