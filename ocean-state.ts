// Single source of truth for the ship's legal position: a nautical-mile
// distance from the Australian baseline. Everything else (zone, visuals,
// content) is derived from this number — never from DOM/pixel coordinates,
// so resizing the viewport can never desync the interaction.

export const MIN_NM = 0;
export const MAX_NM = 250;

export const BOUNDARIES = {
  territorialSea: 12,
  contiguousZone: 24,
  eez: 200,
} as const;

export type ZoneId = "territorial-sea" | "contiguous-zone" | "eez" | "high-seas";

export function clampDistance(distanceNm: number): number {
  if (Number.isNaN(distanceNm)) return MIN_NM;
  return Math.min(MAX_NM, Math.max(MIN_NM, distanceNm));
}

// Boundary equality is deliberate: a boundary NM itself belongs to the zone
// inside it (e.g. exactly 12 NM is still Territorial Sea, exactly 200 NM is
// still EEZ), matching UNCLOS's "not exceeding" phrasing for each limit.
export function getZoneId(distanceNm: number): ZoneId {
  const d = clampDistance(distanceNm);
  if (d <= BOUNDARIES.territorialSea) return "territorial-sea";
  if (d <= BOUNDARIES.contiguousZone) return "contiguous-zone";
  if (d <= BOUNDARIES.eez) return "eez";
  return "high-seas";
}

export type ActivityId = "navigate" | "fish" | "research" | "seabed";

// The three legal lines a first-time crossing is worth calling out. Kept as
// its own list (rather than reusing BOUNDARIES' values) so the "event" axis
// can be reasoned about independently of the zone-lookup axis above.
export const CROSSING_BOUNDARIES = [12, 24, 200] as const;
export type BoundaryNm = (typeof CROSSING_BOUNDARIES)[number];

// One formula for "how far through the whole journey is this", so the ship
// marker, the progress ruler and the continuous openness fade can't drift
// apart from each other or from the boundary markers' own --pos percentages.
export function getProgressFraction(distanceNm: number): number {
  return clampDistance(distanceNm) / MAX_NM;
}

// Boundaries newly crossed travelling outward from fromNm to toNm. Moving
// backward or staying still always yields none — this is what makes a
// first-time-only discovery event possible without extra bookkeeping at the
// call site beyond remembering the previous distance.
export function getBoundariesCrossedOutbound(fromNm: number, toNm: number): BoundaryNm[] {
  if (toNm <= fromNm) return [];
  return CROSSING_BOUNDARIES.filter((b) => b > fromNm && b <= toNm);
}

const APPROACH_NM = 2;

// The nearest boundary the ship is about to cross, while still short of it —
// purely an ambient hint, not gated by discovery state like the toast event.
export function getApproachingBoundary(distanceNm: number): BoundaryNm | null {
  const d = clampDistance(distanceNm);
  return CROSSING_BOUNDARIES.find((b) => d < b && b - d <= APPROACH_NM) ?? null;
}
