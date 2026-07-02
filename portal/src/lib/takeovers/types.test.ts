import { describe, expect, it } from "vitest";

import { classifyTakeover, windowsOverlap } from "./types";

describe("windowsOverlap", () => {
  const base = { startsAt: "2026-05-01T00:00:00Z", endsAt: "2026-05-02T00:00:00Z" };

  it("returns true when B starts inside A", () => {
    const b = { startsAt: "2026-05-01T12:00:00Z", endsAt: "2026-05-03T00:00:00Z" };
    expect(windowsOverlap(base, b)).toBe(true);
  });
  it("returns true when B is fully inside A", () => {
    const b = { startsAt: "2026-05-01T06:00:00Z", endsAt: "2026-05-01T18:00:00Z" };
    expect(windowsOverlap(base, b)).toBe(true);
  });
  it("returns false when B ends exactly when A starts (adjacent)", () => {
    const b = { startsAt: "2026-04-30T12:00:00Z", endsAt: "2026-05-01T00:00:00Z" };
    expect(windowsOverlap(base, b)).toBe(false);
  });
  it("returns false when B starts exactly when A ends (adjacent)", () => {
    const b = { startsAt: "2026-05-02T00:00:00Z", endsAt: "2026-05-02T12:00:00Z" };
    expect(windowsOverlap(base, b)).toBe(false);
  });
  it("returns false when B is entirely before A", () => {
    const b = { startsAt: "2026-04-01T00:00:00Z", endsAt: "2026-04-30T00:00:00Z" };
    expect(windowsOverlap(base, b)).toBe(false);
  });
});

describe("classifyTakeover", () => {
  const anchor = new Date("2026-06-01T12:00:00Z");

  it("marks a paused takeover as paused regardless of window", () => {
    expect(
      classifyTakeover(
        { startsAt: "2026-05-01T00:00:00Z", endsAt: "2026-05-30T00:00:00Z", isPaused: true },
        anchor,
      ),
    ).toBe("paused");
  });
  it("returns 'upcoming' when now < starts_at", () => {
    expect(
      classifyTakeover(
        { startsAt: "2026-07-01T00:00:00Z", endsAt: "2026-07-02T00:00:00Z", isPaused: false },
        anchor,
      ),
    ).toBe("upcoming");
  });
  it("returns 'active' when starts_at ≤ now < ends_at", () => {
    expect(
      classifyTakeover(
        { startsAt: "2026-06-01T00:00:00Z", endsAt: "2026-06-02T00:00:00Z", isPaused: false },
        anchor,
      ),
    ).toBe("active");
  });
  it("returns 'past' when now ≥ ends_at", () => {
    expect(
      classifyTakeover(
        { startsAt: "2026-05-01T00:00:00Z", endsAt: "2026-05-30T00:00:00Z", isPaused: false },
        anchor,
      ),
    ).toBe("past");
  });
});
