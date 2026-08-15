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

// The screen-space counterpart to getProgressFraction: still a pure function
// of the NM distance (never a DOM measurement), but non-linear, so the two
// tightly-packed early boundaries (12, 24 NM) get enough screen room to read
// as distinct moments instead of being crushed into the first 10% of a linear
// track. distance/getZoneId/every legal derivation still only ever uses the
// real NM number — this remaps the same number for placement only.
//
// The range is padded to [0.06, 0.96] rather than [0, 1] so the ship marker
// (centred on its own position via a translate(-50%) transform) is never
// clipped by the scene's overflow:hidden at either extreme — at fraction 0 or
// 1 the marker would sit exactly on the edge with half of it cut off.
const VISUAL_SEGMENTS: Array<[fromNm: number, toNm: number, fromFrac: number, toFrac: number]> = [
  [0, BOUNDARIES.territorialSea, 0.06, 0.3],
  [BOUNDARIES.territorialSea, BOUNDARIES.contiguousZone, 0.3, 0.52],
  [BOUNDARIES.contiguousZone, BOUNDARIES.eez, 0.52, 0.88],
  [BOUNDARIES.eez, MAX_NM, 0.88, 0.96],
];

export function getVisualPosition(distanceNm: number): number {
  const d = clampDistance(distanceNm);
  for (const [fromNm, toNm, fromFrac, toFrac] of VISUAL_SEGMENTS) {
    if (d <= toNm) {
      const span = toNm - fromNm;
      const t = span === 0 ? 0 : (d - fromNm) / span;
      return fromFrac + t * (toFrac - fromFrac);
    }
  }
  return 0.96;
}

// The exact inverse of getVisualPosition. The native <input type="range">'s
// own value domain is this screen fraction (see main.ts's handleDistanceInput
// and the CSS-inset .ship-control), not the NM distance — that's what makes
// the browser's own linear thumb-in-track math land pixel-for-pixel on the
// non-linear ship marker. NM stays a pure, deterministic function of a plain
// number throughout; only which number moved downstream.
export function getDistanceFromVisualFraction(fraction: number): number {
  const f = Math.min(0.96, Math.max(0.06, fraction));
  for (const [fromNm, toNm, fromFrac, toFrac] of VISUAL_SEGMENTS) {
    if (f <= toFrac) {
      const span = toFrac - fromFrac;
      const t = span === 0 ? 0 : (f - fromFrac) / span;
      return fromNm + t * (toNm - fromNm);
    }
  }
  return MAX_NM;
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
