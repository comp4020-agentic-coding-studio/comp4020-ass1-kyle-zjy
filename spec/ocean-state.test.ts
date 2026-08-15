import { describe, expect, it } from "vitest";
import { clampDistance, getZoneId, MAX_NM, MIN_NM } from "../ocean-state";

describe("getZoneId boundary logic", () => {
  const cases: Array<[number, ReturnType<typeof getZoneId>]> = [
    [0, "territorial-sea"],
    [11, "territorial-sea"],
    [12, "territorial-sea"],
    [13, "contiguous-zone"],
    [23, "contiguous-zone"],
    [24, "contiguous-zone"],
    [25, "eez"],
    [199, "eez"],
    [200, "eez"],
    [201, "high-seas"],
    [250, "high-seas"],
  ];

  for (const [distance, expected] of cases) {
    it(`${distance} NM is ${expected}`, () => {
      expect(getZoneId(distance)).toBe(expected);
    });
  }
});

describe("clampDistance", () => {
  it("clamps below the minimum", () => {
    expect(clampDistance(-50)).toBe(MIN_NM);
  });

  it("clamps above the maximum", () => {
    expect(clampDistance(9999)).toBe(MAX_NM);
  });

  it("passes through in-range values", () => {
    expect(clampDistance(47)).toBe(47);
  });
});
