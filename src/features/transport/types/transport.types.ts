export interface UseTransportReturn {
  isPlaying: boolean;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
  bpm: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleLoop: () => void;
  setLoopStart: (beats: number) => void;
  setLoopEnd: (beats: number) => void;
  setBpm: (bpm: number) => void;
}
