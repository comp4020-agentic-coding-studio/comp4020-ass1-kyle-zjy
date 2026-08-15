import type { ActivityId, BoundaryNm } from "./ocean-state";
import type { ZoneId } from "./ocean-state";

// Content for the voyage layer added on top of the core zone content in
// ocean-content.ts. Kept in its own file so that file — already load-bearing
// for three existing tests and CLAUDE.md's legal-content rules — stays small
// and untouched. Copy here follows the same rule: conservative, short, and
// never collapsing sovereignty into sovereign rights or implying the law
// ends at 200 NM. See CLAUDE.md before editing any EEZ/high-seas line.

export interface BoundaryToastBeat {
  heading: string;
  body: string;
}

export interface BoundaryEventContent {
  toasts: BoundaryToastBeat[];
  announcement: string;
  logCaption: string;
}

export const BOUNDARY_EVENTS: Record<BoundaryNm, BoundaryEventContent> = {
  12: {
    toasts: [
      { heading: "Boundary crossed", body: "12 NM — Australia's territorial sovereignty ends here." },
    ],
    announcement: "Crossed the 12 nautical mile boundary. Entered the Contiguous Zone.",
    logCaption: "Territorial sovereignty ended.",
  },
  24: {
    toasts: [
      { heading: "Boundary crossed", body: "24 NM — the contiguous zone's special controls end here." },
    ],
    announcement: "Crossed the 24 nautical mile boundary. Entered the Exclusive Economic Zone.",
    logCaption: "The contiguous zone's special controls ended.",
  },
  200: {
    toasts: [
      { heading: "200 NM", body: "Australia's EEZ ends here." },
      { heading: "High seas", body: "The law does not." },
    ],
    announcement: "Crossed the 200 nautical mile boundary. Entered the High Seas.",
    logCaption: "Australia's EEZ ended. International law continued.",
  },
};

export const APPROACHING_LABEL = "Approaching a legal boundary";

export interface AuthorityMatrixRow {
  id: string;
  label: string;
  values: Record<ZoneId, string>;
}

export const AUTHORITY_MATRIX: AuthorityMatrixRow[] = [
  {
    id: "sovereignty",
    label: "Sovereignty",
    values: {
      "territorial-sea": "Australia",
      "contiguous-zone": "Ended",
      eez: "None — sovereign rights only",
      "high-seas": "None",
    },
  },
  {
    id: "resource-rights",
    label: "Resource rights",
    values: {
      "territorial-sea": "Australia",
      "contiguous-zone": "Australia (EEZ regime already applies)",
      eez: "Australia has sovereign rights",
      "high-seas": "No coastal state's EEZ rights apply",
    },
  },
  {
    id: "navigation",
    label: "Navigation",
    values: {
      "territorial-sea": "Innocent passage",
      "contiguous-zone": "International freedom of navigation",
      eez: "International freedom of navigation",
      "high-seas": "High-seas freedom of navigation",
    },
  },
  {
    id: "overflight",
    label: "Overflight",
    values: {
      "territorial-sea": "Australia controls airspace",
      "contiguous-zone": "International freedom",
      eez: "International freedom",
      "high-seas": "High-seas freedom",
    },
  },
  {
    id: "special-control",
    label: "Special coastal-state control",
    values: {
      "territorial-sea": "Full territorial jurisdiction",
      "contiguous-zone": "Customs, fiscal, immigration, sanitary control",
      eez: "Limited jurisdiction (resources, research, environment)",
      "high-seas": "None — flag-state jurisdiction applies",
    },
  },
  {
    id: "seabed",
    label: "Seabed",
    values: {
      "territorial-sea": "Full sovereignty, same as the water above",
      "contiguous-zone": "Sovereign rights, following the EEZ/continental-shelf regime",
      eez: "Australia has sovereign rights over the continental shelf",
      "high-seas": "May still involve continental-shelf rights beyond this line",
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
      answer: "It can still fall under continental-shelf rights that extend beyond this line, even though the water above is high seas.",
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
