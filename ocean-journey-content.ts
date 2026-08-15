import type { ActivityId, BoundaryNm } from "./ocean-state";
import type { ZoneId } from "./ocean-state";

// Content for the voyage layer added on top of the core zone content in
// ocean-content.ts. Kept in its own file so that file — already load-bearing
// for three existing tests and CLAUDE.md's legal-content rules — stays small
// and untouched. Copy here follows the same rule: conservative, short, and
// never collapsing sovereignty into sovereign rights or implying the law
// ends at 200 NM. See CLAUDE.md before editing any EEZ/high-seas line.

// 12 and 24 NM are small, non-blocking moments — a short headline plus one
// line of context. 200 NM is the narrative climax and gets its own shape
// (ClimaxContent, below), not a toast: it is the one moment worth taking over
// the screen for, and the only one that should ever visually dominate.
export interface BoundaryToast {
  heading: string;
  body: string;
}

export interface MinorBoundaryEvent {
  toast: BoundaryToast;
  announcement: string;
  logCaption: string;
}

export const MINOR_BOUNDARY_EVENTS: Record<12 | 24, MinorBoundaryEvent> = {
  12: {
    toast: {
      heading: "Territorial sovereignty ends here",
      body: "The ocean looks the same. The legal relationship does not.",
    },
    announcement: "Crossed the 12 nautical mile boundary. Entered the Contiguous Zone.",
    logCaption: "Territorial sovereignty ended.",
  },
  24: {
    toast: {
      heading: "One layer of control ends",
      body: "Australia's EEZ rights continue farther out.",
    },
    announcement: "Crossed the 24 nautical mile boundary. Entered the Exclusive Economic Zone.",
    logCaption: "The contiguous zone's special controls ended.",
  },
};

export interface ClimaxBeat {
  text: string;
}

export interface ClimaxContent {
  beats: ClimaxBeat[];
  announcement: string;
  logCaption: string;
}

export const CLIMAX_EVENT: ClimaxContent = {
  beats: [{ text: "Australia's EEZ ends here." }, { text: "High seas." }, { text: "The law does not." }],
  announcement: "Crossed the 200 nautical mile boundary. Entered the High Seas.",
  logCaption: "Australia's EEZ ended. International law continued.",
};

export function getLogCaption(nm: BoundaryNm): string {
  return nm === 200 ? CLIMAX_EVENT.logCaption : MINOR_BOUNDARY_EVENTS[nm].logCaption;
}

export function getAnnouncement(nm: BoundaryNm): string {
  return nm === 200 ? CLIMAX_EVENT.announcement : MINOR_BOUNDARY_EVENTS[nm].announcement;
}

export const APPROACHING_LABEL = "Approaching a legal boundary";

// Each row now names who holds the thing (actor), not just what the thing is
// — "AUSTRALIA" / "OTHER STATES" / "ALL STATES" / "NONE" — so a reader can
// scan actors down the column instead of parsing a sentence per cell.
export interface AuthorityCell {
  actor: string;
  value: string;
}

export interface AuthorityMatrixRow {
  id: string;
  label: string;
  values: Record<ZoneId, AuthorityCell>;
}

export const AUTHORITY_MATRIX: AuthorityMatrixRow[] = [
  {
    id: "sovereignty",
    label: "Sovereignty",
    values: {
      "territorial-sea": { actor: "AUSTRALIA", value: "Full sovereignty" },
      "contiguous-zone": { actor: "NONE", value: "Sovereignty has ended" },
      eez: { actor: "NONE", value: "Sovereign rights only, not sovereignty" },
      "high-seas": { actor: "NONE", value: "No state holds sovereignty here" },
    },
  },
  {
    id: "resource-rights",
    label: "Resource rights",
    values: {
      "territorial-sea": { actor: "AUSTRALIA", value: "Full rights, as part of sovereignty" },
      "contiguous-zone": { actor: "AUSTRALIA", value: "EEZ resource rights already apply" },
      eez: { actor: "AUSTRALIA", value: "Sovereign rights over resources" },
      "high-seas": { actor: "NONE", value: "No coastal state's EEZ rights apply" },
    },
  },
  {
    id: "navigation",
    label: "Navigation",
    values: {
      "territorial-sea": { actor: "OTHER STATES", value: "Innocent passage only" },
      "contiguous-zone": { actor: "ALL STATES", value: "Freedom of navigation" },
      eez: { actor: "ALL STATES", value: "Freedom of navigation" },
      "high-seas": { actor: "ALL STATES", value: "High-seas freedom of navigation" },
    },
  },
  {
    id: "overflight",
    label: "Overflight",
    values: {
      "territorial-sea": { actor: "AUSTRALIA", value: "Controls the airspace" },
      "contiguous-zone": { actor: "ALL STATES", value: "Freedom of overflight" },
      eez: { actor: "ALL STATES", value: "Freedom of overflight" },
      "high-seas": { actor: "ALL STATES", value: "High-seas freedom of overflight" },
    },
  },
  {
    id: "special-control",
    label: "Special coastal-state control",
    values: {
      "territorial-sea": { actor: "AUSTRALIA", value: "Full territorial jurisdiction" },
      "contiguous-zone": { actor: "LIMITED COASTAL CONTROL", value: "Customs, fiscal, immigration, sanitary" },
      eez: { actor: "LIMITED COASTAL CONTROL", value: "Resources, research, environment" },
      "high-seas": { actor: "INTERNATIONAL LAW", value: "Flag-state jurisdiction applies" },
    },
  },
  {
    id: "seabed",
    label: "Seabed",
    values: {
      "territorial-sea": { actor: "AUSTRALIA", value: "Same sovereignty as the water above" },
      "contiguous-zone": { actor: "AUSTRALIA", value: "Follows the EEZ/continental-shelf regime" },
      eez: { actor: "AUSTRALIA", value: "Sovereign rights over the continental shelf" },
      "high-seas": { actor: "AUSTRALIA (POSSIBLY)", value: "Shelf rights can extend past this line" },
    },
  },
];

export interface ActivityOption {
  id: ActivityId;
  label: string;
  hint: string;
}

export const ACTIVITIES: ActivityOption[] = [
  { id: "navigate", label: "Navigate", hint: "Just passing through" },
  { id: "fish", label: "Fish", hint: "Taking resources from the water" },
  { id: "research", label: "Research", hint: "Studying the ocean itself" },
  { id: "seabed", label: "Seabed", hint: "Working the ocean floor" },
];

export interface ActivityAnswer {
  question: string;
  answer: string;
}

export const ACTIVITY_ANSWERS: Record<ZoneId, Record<ActivityId, ActivityAnswer>> = {
  "territorial-sea": {
    navigate: {
      question: "Can you sail here?",
      answer:
        "Yes — but passage through another state's territorial sea is subject to legal rules such as innocent passage.",
    },
    fish: {
      question: "Can you fish here?",
      answer: "Not freely. Australia controls access to resources within its territorial sea.",
    },
    research: {
      question: "Can you do research here?",
      answer: "Only with Australia's consent — marine scientific research here falls under its sovereignty.",
    },
    seabed: {
      question: "What about the seabed?",
      answer: "It follows the same sovereignty as the water above it.",
    },
  },
  "contiguous-zone": {
    navigate: {
      question: "Can you sail here?",
      answer: "Yes — the same navigation freedoms already apply here as farther out.",
    },
    fish: {
      question: "Can you fish here?",
      answer:
        "Generally yes, under the sovereign-rights regime that already applies beneath the contiguous zone's customs-style controls.",
    },
    research: {
      question: "Can you do research here?",
      answer: "Marine scientific research here falls under Australia's sovereign rights, as it does farther out in the EEZ.",
    },
    seabed: {
      question: "What about the seabed?",
      answer: "The seabed here already follows the EEZ and continental-shelf regime, not the contiguous zone's customs controls.",
    },
  },
  eez: {
    navigate: {
      question: "Can you sail here?",
      answer: "Yes. Other states retain freedom of navigation.",
    },
    fish: {
      question: "Can you fish here?",
      answer: "Australia has resource rights here. The EEZ gives Australia sovereign rights over living natural resources.",
    },
    research: {
      question: "Can you do research here?",
      answer: "Generally only with Australia's consent, reflecting its jurisdiction over research in the EEZ.",
    },
    seabed: {
      question: "What about the seabed?",
      answer: "Australia has sovereign rights over the continental shelf here, whether or not it matches the water-column boundary exactly.",
    },
  },
  "high-seas": {
    navigate: {
      question: "Can you sail here?",
      answer: "Yes. Navigation is one of the freedoms associated with the high seas.",
    },
    fish: {
      question: "Can you fish here?",
      answer:
        "No single coastal state has EEZ rights here. But that does not mean fishing is unregulated — international rules may still apply.",
    },
    research: {
      question: "Can you do research here?",
      answer: "Generally free, but international law — not any one coastal state — still governs how it's carried out.",
    },
    seabed: {
      question: "What about the seabed?",
      answer: "The seabed can still fall under a coastal state's continental-shelf rights extending beyond this line, even though the water above it is high seas.",
    },
  },
};

export const XRAY_LAYERS = [
  { id: "airspace", label: "Airspace" },
  { id: "water", label: "Water column" },
  { id: "seabed", label: "Seabed" },
] as const;

export type XrayLayerId = (typeof XRAY_LAYERS)[number]["id"];

// Which layer the current explanation is "about" — a simplification, since
// there's no separate overflight activity to point at airspace. Documented
// rather than hidden: acceptable given the brief only requires the three
// layers to exist, be labelled, and have at least one highlightable.
export const XRAY_LAYER_BY_ACTIVITY: Record<ActivityId, XrayLayerId> = {
  navigate: "water",
  fish: "water",
  research: "water",
  seabed: "seabed",
};

export interface XrayZoneLayer {
  label: string;
  caption: string;
}

// What each layer actually means changes zone to zone — X-ray should teach
// this, not just point a highlight at the same three static labels the whole
// way through the voyage.
export const XRAY_ZONE_LAYERS: Record<ZoneId, Record<XrayLayerId, XrayZoneLayer>> = {
  "territorial-sea": {
    airspace: { label: "Australian airspace", caption: "Australia controls this airspace" },
    water: { label: "Australian sovereignty", caption: "Full sovereignty, like land" },
    seabed: { label: "Australian seabed", caption: "Same sovereignty as the water above" },
  },
  "contiguous-zone": {
    airspace: { label: "International airspace", caption: "Freedom of overflight applies" },
    water: { label: "Limited coastal control", caption: "Customs, fiscal, immigration, sanitary only" },
    seabed: { label: "EEZ regime already applies", caption: "Sovereign rights, not customs control" },
  },
  eez: {
    airspace: { label: "International airspace", caption: "Freedom of overflight applies" },
    water: { label: "Sovereign rights only", caption: "Australia — resources, not territory" },
    seabed: { label: "Continental shelf rights", caption: "Australia holds sovereign rights" },
  },
  "high-seas": {
    airspace: { label: "High-seas freedom", caption: "No coastal state's control applies" },
    water: { label: "High-seas freedom", caption: "No coastal state's rights apply" },
    seabed: { label: "Possible shelf rights", caption: "A state's shelf claim may still reach here" },
  },
};
