import { describe, expect, it } from "vitest";

import { createTimelineScale } from "./scale";

describe("createTimelineScale", () => {
  // Shared scale: 50px per beat, 16 total beats
  const scale = createTimelineScale(50, 16);

  // Test 1 — scale initialises with the correct zoom level
  it("maps beat 0 to pixel 0 and beat 16 to the full canvas width", () => {
    expect(scale(0)).toBe(0);
    expect(scale(16)).toBe(800); // 16 beats × 50px = 800px
  });

  // Test 2 — quarter note (beat 4 at 4/4) → 200px
  it("maps beat 4 to 200 pixels at 50px/beat", () => {
    expect(scale(4)).toBe(200);
  });

  // Test 3 — eighth note (beat 0.5) → 25px
  it("maps beat 0.5 (eighth note) to 25 pixels at 50px/beat", () => {
    expect(scale(0.5)).toBe(25);
  });
});
