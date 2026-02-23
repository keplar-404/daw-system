import { create } from "zustand";
import { AudioState } from "../types/audio";

interface AudioActions {
    togglePlayback: () => void;
    stopPlayback: () => void;
    setMasterVolume: (volume: number) => void;
    setPlayheadPosition: (position: number) => void;
    setBpm: (bpm: number) => void;
    setTimeSignature: (num: number, den: number) => void;
    toggleLooping: () => void;
    setLoopPoints: (start: number, end: number) => void;
    toggleRecording: () => void;
}

export const useAudioStore = create<AudioState & AudioActions>((set) => ({
    isPlaying: false,
    playheadPosition: 0,
    masterVolume: 0.8,
    bpm: 120,
    timeSignature: [4, 4],
    isRecording: false,
    isLooping: false,
    loopStart: 0,
    loopEnd: 4,

    togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
    stopPlayback: () => set({ isPlaying: false, playheadPosition: 0 }),
    setMasterVolume: (volume) => set({ masterVolume: volume }),
    setPlayheadPosition: (position) => set({ playheadPosition: position }),
    setBpm: (bpm) => set({ bpm }),
    setTimeSignature: (num, den) => set({ timeSignature: [num, den] }),
    toggleLooping: () => set((state) => ({ isLooping: !state.isLooping })),
    setLoopPoints: (start, end) => set({ loopStart: start, loopEnd: end }),
    toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
}));
