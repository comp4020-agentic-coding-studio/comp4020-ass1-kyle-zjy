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
