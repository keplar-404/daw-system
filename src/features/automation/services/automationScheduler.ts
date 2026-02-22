import { getChannel } from "@/features/tracks/services/audioGraph";
import type { AutomationLane } from "../types/automation.types";

/**
 * Schedules automation curves on the Tone.js audio graph.
 *
 * @param lanes - Array of automation lanes from Zustand store.
 * @param bpm - Current DAW BPM to calculate absolute time.
 */
export async function scheduleAutomation(
    lanes: AutomationLane[],
    bpm: number,
): Promise<void> {
    const { getContext } = await import("tone");
    const ctx = getContext();
    const now = ctx.currentTime;

    for (const lane of lanes) {
        const channel = getChannel(lane.trackId);
        if (!channel) continue;

        const param = lane.target === "volume" ? channel.volume : channel.pan;

        // Clear any previously scheduled automation for this playback run
        param.cancelScheduledValues(0);

        for (const node of lane.nodes) {
            // Calculate absolute time for this node:
            // beat / bpm = minutes -> * 60 = seconds from start
            const time = now + (node.beat / bpm) * 60;

            // setValueAtTime creates a hard step. Tone.js also has rampTo,
            // linearRampToValueAtTime, etc., but we'll use linear ramps to make it a "curve".
            // If it's the first node, just set the value.
            if (node === lane.nodes[0]) {
                param.setValueAtTime(node.value, time);
            } else {
                param.linearRampToValueAtTime(node.value, time);
            }
        }
    }
}

/**
 * Cancels all scheduled automation for the given lanes.
 */
export async function clearAutomation(lanes: AutomationLane[]): Promise<void> {
    const { getContext } = await import("tone");
    // Ensure Tone is loaded, though getting the channel implies it.
    getContext();

    for (const lane of lanes) {
        const channel = getChannel(lane.trackId);
        if (!channel) continue;

        const param = lane.target === "volume" ? channel.volume : channel.pan;
        param.cancelScheduledValues(0);

        // Reset to 0 when cleared, or we could leave it at the last value.
        // Usually stopping playback resets params or leaves them alone depending on DAW design.
        // For now, we just cancel future schedules.
    }
}
