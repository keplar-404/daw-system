"use client";

import { useCallback } from "react";

import { useDawStore } from "@/features/daw/store/dawStore";

import type { UseTransportReturn } from "../types/transport.types";

/**
 * Bridges the Zustand DAW state ↔ Tone.js Transport.
 *
 * All audio engine calls are isolated here per Rule 1:
 * "Separate visual UI strictly from audio processing logic."
 *
 * Tone.js is lazily imported to avoid touching AudioContext during
 * Next.js SSR (which would throw a hard crash).
 */
export function useTransport(): UseTransportReturn {
  const isPlaying = useDawStore((s) => s.isPlaying);
  const isLooping = useDawStore((s) => s.isLooping);
  const loopStart = useDawStore((s) => s.loopStart);
  const loopEnd = useDawStore((s) => s.loopEnd);
  const bpm = useDawStore((s) => s.bpm);

  const storePlay = useDawStore((s) => s.play);
  const storePause = useDawStore((s) => s.pause);
  const storeStop = useDawStore((s) => s.stop);
  const storeToggleLoop = useDawStore((s) => s.toggleLoop);
  const storeSetLoopStart = useDawStore((s) => s.setLoopStart);
  const storeSetLoopEnd = useDawStore((s) => s.setLoopEnd);
  const storeSetBpm = useDawStore((s) => s.setBpm);

  const play = useCallback(async () => {
    storePlay();
    const { getTransport } = await import("tone");
    getTransport().start();
  }, [storePlay]);

  const pause = useCallback(async () => {
    storePause();
    const { getTransport } = await import("tone");
    getTransport().pause();
  }, [storePause]);

  const stop = useCallback(async () => {
    storeStop();
    const { getTransport } = await import("tone");
    getTransport().stop();
  }, [storeStop]);

  const toggleLoop = useCallback(async () => {
    storeToggleLoop();
    const { getTransport } = await import("tone");

    // The state isn't synchronous here, so we evaluate based on reversing the current state
    const newIsLooping = !isLooping;

    const transport = getTransport();
    transport.loop = newIsLooping;

    if (newIsLooping) {
      // Tone converts values like '4n', '1m', or numeric Seconds natively.
      // It's generally best to provide the strict time format for beats: `[bar]:[beat]:[sixteenth]`
      // Since we are working purely in beats across our DAW:
      // 1 beat = a quarter note.
      // Tone Time format for "beats": "0:X" where X is the beat number
      // However, setting it strictly as `X * Tone.Time("4n").toSeconds()` is safer
      const { Time } = await import("tone");
      transport.loopStart = Time(`${loopStart} * 4n`).toSeconds();
      transport.loopEnd = Time(`${loopEnd} * 4n`).toSeconds();
    }
  }, [storeToggleLoop, isLooping, loopStart, loopEnd]);

  const setLoopStart = useCallback(async (beats: number) => {
    storeSetLoopStart(beats);
    const { getTransport, Time } = await import("tone");
    getTransport().loopStart = Time(`${beats} * 4n`).toSeconds();
  }, [storeSetLoopStart]);

  const setLoopEnd = useCallback(async (beats: number) => {
    storeSetLoopEnd(beats);
    const { getTransport, Time } = await import("tone");
    getTransport().loopEnd = Time(`${beats} * 4n`).toSeconds();
  }, [storeSetLoopEnd]);

  const setBpm = useCallback(
    async (value: number) => {
      storeSetBpm(value);

      const { getTransport } = await import("tone");
      const transport = getTransport();
      transport.bpm.value = value;
    },
    [storeSetBpm],
  );

  return {
    isPlaying,
    isLooping,
    loopStart,
    loopEnd,
    bpm,
    play,
    pause,
    stop,
    toggleLoop,
    setLoopStart,
    setLoopEnd,
    setBpm
  };
}
