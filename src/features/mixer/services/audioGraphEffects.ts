/**
 * Audio Graph Effects Manager — Mixer feature.
 *
 * Manages a registry of Tone.Effect nodes for each track, inserted
 * dynamically between the track's Tone.Channel and Tone.Destination.
 *
 * Signal chain (single effect):
 *   Channel → Effect → Destination
 *
 * Signal chain (multiple effects, insertion order):
 *   Channel → Effect1 → Effect2 → ... → Destination
 *
 * IMPORTANT: Must only be imported in browser context (hooks/services).
 * Never import in RSC or test files without mocking.
 */

import { getChannel } from "@/features/tracks/services/audioGraph";
import type {
    DelayParams,
    EQParams,
    PluginParams,
    PluginType,
    ReverbParams,
} from "@/features/daw/types/daw.types";

// ── Types ──────────────────────────────────────────────────────────────────────

type ToneEffect =
    | import("tone").Reverb
    | import("tone").FeedbackDelay
    | import("tone").EQ3;

interface EffectEntry {
    pluginId: string;
    node: ToneEffect;
}

// Registry: trackId → ordered list of effect entries
type EffectRegistry = Map<string, EffectEntry[]>;

// ── Singleton registry ────────────────────────────────────────────────────────

let registry: EffectRegistry | null = null;

function getRegistry(): EffectRegistry {
    if (!registry) registry = new Map();
    return registry;
}

function getEffectList(trackId: string): EffectEntry[] {
    const reg = getRegistry();
    if (!reg.has(trackId)) reg.set(trackId, []);
    // biome-ignore lint/style/noNonNullAssertion: just set above
    return reg.get(trackId)!;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a Tone effect node from type + params.
 * All nodes are constructed with a wet signal of 1 — the `mix` param
 * controls the built-in `wet` property instead.
 */
async function buildNode(
    type: PluginType,
    params: PluginParams,
): Promise<ToneEffect> {
    const Tone = await import("tone");
    switch (type) {
        case "reverb": {
            const p = params as ReverbParams;
            const reverb = new Tone.Reverb({ decay: p.decay });
            reverb.wet.value = p.mix;
            return reverb;
        }
        case "delay": {
            const p = params as DelayParams;
            const delay = new Tone.FeedbackDelay({
                delayTime: p.delayTime,
                feedback: p.feedback,
            });
            delay.wet.value = p.mix;
            return delay;
        }
        case "eq": {
            const p = params as EQParams;
            return new Tone.EQ3({ low: p.low, mid: p.mid, high: p.high });
        }
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Insert a new effect at the end of this track's chain.
 *
 * Rewiring steps:
 *   1. Disconnect the current last node (or the channel) from Destination
 *   2. Connect it to the new effect
 *   3. Connect the new effect to Destination
 *   4. Register the new node
 */
export async function insertEffect(
    trackId: string,
    pluginId: string,
    type: PluginType,
    params: PluginParams,
): Promise<void> {
    const Tone = await import("tone");
    const channel = getChannel(trackId);
    if (!channel) return;

    const node = await buildNode(type, params);
    const effects = getEffectList(trackId);

    if (effects.length === 0) {
        // Channel was connected to Destination — disconnect it
        channel.disconnect();
        channel.connect(node);
    } else {
        // Disconnect the last effect from Destination and chain into new node
        const last = effects[effects.length - 1].node;
        last.disconnect();
        last.connect(node);
    }

    node.toDestination();
    effects.push({ pluginId, node });
}

/**
 * Remove an effect from the chain, rewiring neighbors together.
 */
export function removeEffect(trackId: string, pluginId: string): void {
    const effects = getEffectList(trackId);
    const idx = effects.findIndex((e) => e.pluginId === pluginId);
    if (idx === -1) return;

    const channel = getChannel(trackId);
    const entry = effects[idx];
    const prev = idx > 0 ? effects[idx - 1].node : channel;
    const next =
        idx < effects.length - 1 ? effects[idx + 1].node : ("destination" as const);

    // Disconnect the effect being removed from everything
    entry.node.disconnect();

    if (prev) {
        prev.disconnect();
        if (next === "destination") {
            prev.toDestination();
        } else {
            prev.connect(next);
        }
    }

    entry.node.dispose();
    effects.splice(idx, 1);
}

/**
 * Update a single param on a Tone effect node in real time.
 * This is the real-time path — does NOT touch Zustand.
 */
export function setEffectParam(
    trackId: string,
    pluginId: string,
    param: string,
    value: number,
): void {
    const effects = getEffectList(trackId);
    const entry = effects.find((e) => e.pluginId === pluginId);
    if (!entry) return;

    const node = entry.node;

    // Use type narrowing on param name to satisfy Tone's typed API
    if (param === "mix") {
        // `wet` is common to Reverb and FeedbackDelay but not EQ3
        if ("wet" in node) {
            (node as import("tone").Reverb | import("tone").FeedbackDelay).wet.value =
                value;
        }
    } else if (param === "decay" && "decay" in node) {
        // Reverb.decay is a Promise-based property; direct assignment works at runtime
        (node as unknown as { decay: number }).decay = value;
    } else if (param === "delayTime" && "delayTime" in node) {
        (
            node as import("tone").FeedbackDelay
        ).delayTime.value = value;
    } else if (param === "feedback" && "feedback" in node) {
        (node as import("tone").FeedbackDelay).feedback.value = value;
    } else if (
        (param === "low" || param === "mid" || param === "high") &&
        param in node
    ) {
        (node as import("tone").EQ3)[param].value = value;
    }
}

/**
 * Retrieve a registered effect node — primarily useful for testing.
 */
export function getEffect(
    trackId: string,
    pluginId: string,
): ToneEffect | undefined {
    return getEffectList(trackId).find((e) => e.pluginId === pluginId)?.node;
}

/**
 * Dispose all effects for a track and remove from registry.
 * Call this when a track is deleted.
 */
export function disposeTrackEffects(trackId: string): void {
    const effects = getEffectList(trackId);
    for (const { node } of effects) {
        node.dispose();
    }
    getRegistry().delete(trackId);
}
