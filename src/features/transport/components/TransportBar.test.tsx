import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransportBar } from "./TransportBar";

// ── Mock useTransport ────────────────────────────────────────────────────────
// We test the component's wiring to the hook, not Tone.js/Zustand internals.
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockStop = vi.fn();
const mockToggleLoop = vi.fn();
const mockSetBpm = vi.fn();
const mockSetLoopStart = vi.fn();
const mockSetLoopEnd = vi.fn();

const mockTransportState = {
  isPlaying: false,
  isLooping: false,
  loopStart: 0,
  loopEnd: 16,
  bpm: 120,
  play: mockPlay,
  pause: mockPause,
  stop: mockStop,
  toggleLoop: mockToggleLoop,
  setBpm: mockSetBpm,
  setLoopStart: mockSetLoopStart,
  setLoopEnd: mockSetLoopEnd,
};

vi.mock("../hooks/useTransport", () => ({
  useTransport: () => mockTransportState,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TransportBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransportState.isPlaying = false;
    mockTransportState.isLooping = false;
    mockTransportState.bpm = 120;
    mockTransportState.loopStart = 0;
    mockTransportState.loopEnd = 16;
  });

  // Test 1 — Buttons exist in the DOM
  it("renders Play, Stop, and Loop buttons", () => {
    render(<TransportBar />);

    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enable loop/i })).toBeInTheDocument();

    mockTransportState.isPlaying = true;
    mockTransportState.isLooping = true;

    // Rerender with state updates explicitly
    const { unmount } = render(<TransportBar />);
    unmount();

    render(<TransportBar />);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disable loop/i })).toBeInTheDocument();
  });

  // Test 2 — Clicking Play / Pause / Stop calls actions
  it("calls play, pause, and stop actions when their assigned buttons are clicked", () => {
    const { rerender } = render(<TransportBar />);

    const playButton = screen.getByRole("button", { name: /play/i });
    fireEvent.click(playButton);
    expect(mockPlay).toHaveBeenCalledTimes(1);

    const stopButton = screen.getByRole("button", { name: /stop/i });
    fireEvent.click(stopButton);
    expect(mockStop).toHaveBeenCalledTimes(1);

    mockTransportState.isPlaying = true;
    rerender(<TransportBar />);

    const pauseButton = screen.getByRole("button", { name: /pause/i });
    fireEvent.click(pauseButton);
    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  // Test 3 — Loop control inputs correctly trigger store actions
  it("calls loop bounding and toggle actions on change/click", () => {
    render(<TransportBar />);

    const loopStartInput = screen.getByLabelText(/loop start/i);
    const loopEndInput = screen.getByLabelText(/loop end/i);
    const toggleLoopBtn = screen.getByRole("button", { name: /enable loop/i });

    fireEvent.change(loopStartInput, { target: { value: "4" } });
    expect(mockSetLoopStart).toHaveBeenCalledWith(4);

    fireEvent.change(loopEndInput, { target: { value: "12" } });
    expect(mockSetLoopEnd).toHaveBeenCalledWith(12);

    fireEvent.click(toggleLoopBtn);
    expect(mockToggleLoop).toHaveBeenCalledTimes(1);
  });

  // Test 4 — BPM input logic
  it("rejects non-numeric BPM input and does not call setBpm", () => {
    render(<TransportBar />);

    const bpmInput = screen.getByLabelText(/beats per minute/i);
    fireEvent.change(bpmInput, { target: { value: "abc" } });
    expect(mockSetBpm).not.toHaveBeenCalled();
  });

  it("accepts valid numeric BPM and calls setBpm", () => {
    render(<TransportBar />);

    const bpmInput = screen.getByLabelText(/beats per minute/i);
    fireEvent.change(bpmInput, { target: { value: "140" } });
    expect(mockSetBpm).toHaveBeenCalledWith(140);
  });
});
