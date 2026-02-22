import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TrackList } from "./TrackList";

// ── Mock Slider ──────────────────────────────────────────────────────────────
// Radix Slider fires onValueCommit on keyboard events (atomic commit).
// We mock the Slider so we can independently trigger onChange vs onCommit
// to verify the split-commit contract in isolation.
vi.mock("@/components/ui/slider", () => ({
  Slider: ({
    onValueChange,
    onValueCommit,
    defaultValue,
    min = 0,
    max = 1,
    "aria-label": label,
  }: {
    onValueChange?: (v: number[]) => void;
    onValueCommit?: (v: number[]) => void;
    defaultValue?: number[];
    min?: number;
    max?: number;
    "aria-label"?: string;
  }) => (
    <div
      role="slider"
      aria-label={label ?? "Slider"}
      aria-valuenow={defaultValue?.[0] ?? min}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-testid={`mock-slider-${(label ?? "slider").toLowerCase().replace(/\s+/g, "-")}`}
      // Click → onValueChange only (simulates drag tick)
      onClick={() => onValueChange?.([(defaultValue?.[0] ?? min) - 0.1])}
      // onKeyDown satisfies Biome useKeyWithClickEvents
      onKeyDown={() => onValueChange?.([(defaultValue?.[0] ?? min) - 0.1])}
      // Double-click → onValueCommit only (simulates pointer-up / commit)
      onDoubleClick={() => onValueCommit?.([(defaultValue?.[0] ?? min) - 0.1])}
    />
  ),
}));

// ── Mock useTrackList ────────────────────────────────────────────────────────
const mockToggleMute = vi.fn();
const mockToggleSolo = vi.fn();
const mockOnVolumeChange = vi.fn();
const mockOnVolumeCommit = vi.fn();
const mockOnPanChange = vi.fn();
const mockOnPanCommit = vi.fn();
const mockRenameTrack = vi.fn();
const mockRemoveTrack = vi.fn();
const mockAddTrack = vi.fn();

const mockTrack1 = {
  id: "track-1",
  name: "Track 1",
  muted: false,
  solo: false,
  volume: 0,
  pan: 0,
};
const mockTrack2 = {
  id: "track-2",
  name: "Track 2",
  muted: false,
  solo: false,
  volume: -6,
  pan: 0.5,
};

vi.mock("../hooks/useTrackList", () => ({
  useTrackList: () => ({
    tracks: [mockTrack1, mockTrack2],
    addTrack: mockAddTrack,
    toggleMute: mockToggleMute,
    toggleSolo: mockToggleSolo,
    onVolumeChange: mockOnVolumeChange,
    onVolumeCommit: mockOnVolumeCommit,
    onPanChange: mockOnPanChange,
    onPanCommit: mockOnPanCommit,
    renameTrack: mockRenameTrack,
    removeTrack: mockRemoveTrack,
  }),
}));

vi.mock("../services/audioGraph", () => ({
  createChannel: vi.fn(),
  getChannel: vi.fn(),
  removeChannel: vi.fn(),
  setChannelVolume: vi.fn(),
  setChannelPan: vi.fn(),
  setChannelMute: vi.fn(),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TrackList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1 — Two tracks render
  it("renders two track rows when mock store has two tracks", () => {
    render(<TrackList />);

    expect(screen.getByTestId("track-row-track-1")).toBeInTheDocument();
    expect(screen.getByTestId("track-row-track-2")).toBeInTheDocument();
  });

  // Test 2 — Clicking M on Track 1 fires toggleMute with correct ID.
  it("calls toggleMute with Track 1's ID when M button is clicked", () => {
    render(<TrackList />);

    // aria-label = "Mute track Track 1" — use flexible regex
    const muteButton = screen.getByRole("button", { name: /mute.*track 1/i });
    fireEvent.click(muteButton);

    expect(mockToggleMute).toHaveBeenCalledTimes(1);
    expect(mockToggleMute).toHaveBeenCalledWith("track-1");
  });

  // Test 3 — Split-commit contract:
  //   Single click → onVolumeChange fires, onVolumeCommit does NOT
  //   Double-click → onVolumeCommit fires (simulates mouse-up / commit)
  it("calls onVolumeChange without calling onVolumeCommit during a drag tick", () => {
    render(<TrackList />);

    // Volume slider for Track 1
    const volSlider = screen.getByTestId(
      "mock-slider-volume-for-track-track-1",
    );

    // Simulate a drag tick (single click = onValueChange only)
    fireEvent.click(volSlider);

    expect(mockOnVolumeChange).toHaveBeenCalledTimes(1);
    expect(mockOnVolumeCommit).not.toHaveBeenCalled();

    // Also verify commit fires on pointer-up (double-click = onValueCommit)
    fireEvent.dblClick(volSlider);
    expect(mockOnVolumeCommit).toHaveBeenCalledTimes(1);
  });

  // Test 4 — Inline rename functionality
  it("calls renameTrack when the inline track name input is blurred", () => {
    render(<TrackList />);

    const renameInput = screen.getAllByRole("textbox", { name: /rename track/i })[0];

    // Change value and blur
    fireEvent.change(renameInput, { target: { value: "New Drum Track" } });
    fireEvent.blur(renameInput);

    expect(mockRenameTrack).toHaveBeenCalledTimes(1);
    expect(mockRenameTrack).toHaveBeenCalledWith("track-1", "New Drum Track");
  });

  // Test 5 — Explicit delete track
  it("calls removeTrack when the Trash button is clicked", () => {
    render(<TrackList />);

    const deleteButton = screen.getByRole("button", { name: /delete track track 1/i });
    fireEvent.click(deleteButton);

    expect(mockRemoveTrack).toHaveBeenCalledTimes(1);
    expect(mockRemoveTrack).toHaveBeenCalledWith("track-1");
  });
});
