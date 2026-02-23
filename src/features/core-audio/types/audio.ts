export interface AudioBlock {
    id: string;
    trackId: string;
    name: string;
    startTime: number; // Position on timeline in seconds
    duration: number; // Current length in seconds
    originalDuration: number; // Source file length
    offset: number; // Start offset within audio file
    blobUrl: string; // URL for wavesurfer and Tone.Player
    fileName: string;
}

export interface Track {
    id: string;
    name: string;
    color: string;
    volume: number; // 0 to 1
    isMuted: boolean;
    isSolo: boolean;
    isArmed?: boolean;
    blocks: AudioBlock[];
    gainNode?: GainNode;
}

export interface AudioState {
    isPlaying: boolean;
    playheadPosition: number;
    bpm: number;
    timeSignature: [number, number];
    masterVolume: number;
    isLooping: boolean;
    loopStart: number;
    loopEnd: number;
    isRecording: boolean;
}
