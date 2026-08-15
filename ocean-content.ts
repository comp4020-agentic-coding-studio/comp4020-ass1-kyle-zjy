import type { ZoneId } from "./ocean-state";

export interface ZoneContent {
  id: ZoneId;
  heading: string;
  statement: string;
  paragraphs: string[];
  announcement: string;
  // Which overlapping coastal-state legal regimes currently apply, shown as
  // the "legal regimes active here" badge list. Not a progress/completion
  // measure — each regime is either in force at this distance or it isn't.
  activeRegimes: { eez: boolean; contiguous: boolean };
}

// Copy is deliberately conservative and short — see CLAUDE.md's legal-content
// rules. Do not add detail beyond this without checking it against an
// authoritative source: this is an explainer, not a law essay.
export const ZONE_CONTENT: Record<ZoneId, ZoneContent> = {
  "territorial-sea": {
    id: "territorial-sea",
    heading: "Territorial Sea",
    statement: "Australia has sovereignty here.",
    paragraphs: [
      "Australia exercises sovereignty over the water, seabed and airspace.",
      "Foreign ships may still exercise rights such as innocent passage.",
    ],
    announcement: "Now in the Territorial Sea: Australia has sovereignty here.",
    activeRegimes: { eez: false, contiguous: false },
  },
  "contiguous-zone": {
    id: "contiguous-zone",
    heading: "Contiguous Zone",
    statement: "Sovereignty has ended. Some control remains.",
    paragraphs: [
      "Australia may exercise limited control here relating to customs, fiscal, immigration and sanitary matters.",
      "Different legal regimes now overlap: the Exclusive Economic Zone regime already applies underneath this control.",
    ],
    announcement: "Now in the Contiguous Zone: sovereignty has ended, some control remains.",
    activeRegimes: { eez: true, contiguous: true },
  },
  eez: {
    id: "eez",
    heading: "Exclusive Economic Zone",
    statement: "Not Australian territory.",
    paragraphs: [
      "Australia has sovereign rights over natural resources and specific jurisdiction here.",
      "Other states retain important freedoms, including navigation and overflight.",
    ],
    announcement: "Now in the Exclusive Economic Zone: not Australian territory.",
    activeRegimes: { eez: true, contiguous: false },
  },
  "high-seas": {
    id: "high-seas",
    heading: "High Seas",
    statement: "Australia's EEZ ends here. The law does not.",
    paragraphs: [
      "No state has an EEZ here — no coastal state has the same resource rights it has inside its own.",
      "Beyond national jurisdiction does not mean beyond law: international law, including the new BBNJ Agreement on marine biodiversity, still governs activities here.",
    ],
    announcement: "Now in the High Seas: Australia's EEZ ends here. The law does not.",
    activeRegimes: { eez: false, contiguous: false },
  },
};
