/**
 * @file transport-store.test.ts
 * @description Unit tests for the Transport Zustand store.
 * Mocks the engine layer to ensure isolated state testing without loading Tone.js.
 */

import { act, renderHook } from "@testing-library/react";
import {
  selectIsPaused,
  selectIsPlaying,
  selectTempoDisplay,
  selectTimeSigDisplay,
  useTransportStore,
} from "./transport-store";

// ---- Mock the engine module entirely ----
jest.mock("@/features/audio/engine", () => {
  let mockState: "started" | "paused" | "stopped" = "stopped";
  return {
    engineSetTempo: jest.fn(),
    engineSetTimeSignature: jest.fn(),
    engineSetMetronome: jest.fn(),
    engineSetCountIn: jest.fn(),
    enginePlay: jest.fn().mockImplementation(() => {
      mockState = "started";
      return Promise.resolve();
    }),
    enginePause: jest.fn().mockImplementation(() => {
      mockState = "paused";
    }),
    engineStop: jest.fn().mockImplementation(() => {
      mockState = "stopped";
    }),
    engineGetPlayState: jest.fn().mockImplementation(() => mockState),
  };
});

import * as engine from "@/features/audio/engine";

describe("Transport Store", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    const { setTempo, setTimeSignature, setSnapGrid } = useTransportStore.getState();
    act(() => {
      setTempo(120);
      setTimeSignature({ numerator: 4, denominator: 4 });
      setSnapGrid("1/4");
      useTransportStore.setState({ metronomeEnabled: false, countInEnabled: false, playState: "stopped" });
    });
    jest.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const state = useTransportStore.getState();
    expect(state.tempo).toBe(120);
    expect(state.timeSignature).toEqual({ numerator: 4, denominator: 4 });
    expect(state.snapGrid).toBe("1/4");
    expect(state.metronomeEnabled).toBe(false);
    expect(state.countInEnabled).toBe(false);
    expect(state.playState).toBe("stopped");
  });

  describe("Tempo", () => {
    it("should update tempo and call engine", () => {
      const { setTempo } = useTransportStore.getState();
      act(() => {
        setTempo(140);
      });
      const state = useTransportStore.getState();
      expect(state.tempo).toBe(140);
      expect(engine.engineSetTempo).toHaveBeenCalledWith(140);
    });

    it("should clamp tempo between 20 and 300", () => {
      const { setTempo } = useTransportStore.getState();
      act(() => setTempo(10));
      expect(useTransportStore.getState().tempo).toBe(20);
      expect(engine.engineSetTempo).toHaveBeenCalledWith(20);

      act(() => setTempo(400));
      expect(useTransportStore.getState().tempo).toBe(300);
      expect(engine.engineSetTempo).toHaveBeenCalledWith(300);
    });
  });

  describe("Time Signature", () => {
    it("should update time signature and call engine", () => {
      const { setTimeSignature } = useTransportStore.getState();
      act(() => {
        setTimeSignature({ numerator: 3, denominator: 8 });
      });
      const state = useTransportStore.getState();
      expect(state.timeSignature).toEqual({ numerator: 3, denominator: 8 });
      expect(engine.engineSetTimeSignature).toHaveBeenCalledWith(3, 8);
    });

    it("should update numerator only", () => {
      const { setTimeSignature } = useTransportStore.getState();
      act(() => {
        setTimeSignature({ numerator: 6 });
      });
      const state = useTransportStore.getState();
      expect(state.timeSignature).toEqual({ numerator: 6, denominator: 4 });
      expect(engine.engineSetTimeSignature).toHaveBeenCalledWith(6, 4);
    });
  });

  describe("Snap Grid", () => {
    it("should update snap grid", () => {
      const { setSnapGrid } = useTransportStore.getState();
      act(() => setSnapGrid("1/8"));
      expect(useTransportStore.getState().snapGrid).toBe("1/8");
    });
  });

  describe("Toggles", () => {
    it("should toggle metronome and call engine", () => {
      const { toggleMetronome } = useTransportStore.getState();
      act(() => toggleMetronome());
      expect(useTransportStore.getState().metronomeEnabled).toBe(true);
      expect(engine.engineSetMetronome).toHaveBeenCalledWith(true);

      act(() => toggleMetronome());
      expect(useTransportStore.getState().metronomeEnabled).toBe(false);
      expect(engine.engineSetMetronome).toHaveBeenCalledWith(false);
    });

    it("should toggle count-in and call engine", () => {
      const { toggleCountIn } = useTransportStore.getState();
      act(() => toggleCountIn());
      expect(useTransportStore.getState().countInEnabled).toBe(true);
      expect(engine.engineSetCountIn).toHaveBeenCalledWith(true);
    });
  });

  describe("Playback Controls", () => {
    it("should start playback and update state", async () => {
      const { play } = useTransportStore.getState();
      await act(async () => {
        await play();
      });
      expect(engine.enginePlay).toHaveBeenCalled();
      expect(useTransportStore.getState().playState).toBe("playing");
    });

    it("should pause playback and update state", () => {
      const { pause } = useTransportStore.getState();
      act(() => pause());
      expect(engine.enginePause).toHaveBeenCalled();
      expect(useTransportStore.getState().playState).toBe("paused");
    });

    it("should stop playback and update state", () => {
      const { stop } = useTransportStore.getState();
      act(() => stop());
      expect(engine.engineStop).toHaveBeenCalled();
      expect(useTransportStore.getState().playState).toBe("stopped");
    });
  });

  describe("Derived Selectors", () => {
    it("selectIsPlaying returns correct boolean", () => {
      useTransportStore.setState({ playState: "playing" });
      const { result } = renderHook(() => useTransportStore(selectIsPlaying));
      expect(result.current).toBe(true);
    });

    it("selectIsPaused returns correct boolean", () => {
      useTransportStore.setState({ playState: "paused" });
      const { result } = renderHook(() => useTransportStore(selectIsPaused));
      expect(result.current).toBe(true);
    });

    it("selectTempoDisplay formats tempo correctly", () => {
      useTransportStore.setState({ tempo: 125.5 });
      const { result } = renderHook(() => useTransportStore(selectTempoDisplay));
      expect(result.current).toBe("125.5");
    });

    it("selectTimeSigDisplay formats time signature correctly", () => {
      useTransportStore.setState({ timeSignature: { numerator: 7, denominator: 8 } });
      const { result } = renderHook(() => useTransportStore(selectTimeSigDisplay));
      expect(result.current).toBe("7/8");
    });
  });
});
