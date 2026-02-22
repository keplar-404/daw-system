/**
 * Audio Graph Manager — Rule 2 implementation.
 *
 * "Treat the DAW state as a directed graph where audio flows
 *  from source nodes to destination nodes."
 *
 * This module is the authoritative registry of all Tone.Channel nodes.
 * Each channel routes:   source clips → Tone.Channel → Tone.Destination
 *
 * IMPORTANT: This file must only be imported in browser context (hooks/services).
 * Never import it in RSC or test files without mocking.
 */

type ChannelMap = Map<string, import("tone").Channel>;

// Module-level singleton — persists across React renders
let channelMap: ChannelMap | null = null;

function getMap(): ChannelMap {
  if (!channelMap) channelMap = new Map();
  return channelMap;
}

/**
 * Create and register a Tone.Channel for the given track ID.
 * Connects it to master output immediately.
 */
export async function createChannel(trackId: string): Promise<void> {
  const { Channel } = await import("tone");
  const map = getMap();
  if (map.has(trackId)) return; // idempotent

  const channel = new Channel({ volume: 0, pan: 0 }).toDestination();
  map.set(trackId, channel);
}

/**
 * Retrieve a registered channel by track ID.
 * Returns undefined if the channel doesn't exist yet.
 */
export function getChannel(
  trackId: string,
): import("tone").Channel | undefined {
  return getMap().get(trackId);
}

/**
 * Disconnect and remove a channel for the given track ID.
 */
export function removeChannel(trackId: string): void {
  const map = getMap();
  const channel = map.get(trackId);
  if (channel) {
    channel.dispose();
    map.delete(trackId);
  }
}

/**
 * Directly set volume (dB) on a channel — bypasses Zustand for real-time
 * slider updates without triggering React re-renders.
 */
export function setChannelVolume(trackId: string, db: number): void {
  const channel = getMap().get(trackId);
  if (channel) channel.volume.value = db;
}

/**
 * Directly set pan on a channel — same real-time bypass pattern.
 */
export function setChannelPan(trackId: string, pan: number): void {
  const channel = getMap().get(trackId);
  if (channel) channel.pan.value = pan;
}

/**
 * Set mute state on a channel.
 */
export function setChannelMute(trackId: string, muted: boolean): void {
  const channel = getMap().get(trackId);
  if (channel) channel.mute = muted;
}
