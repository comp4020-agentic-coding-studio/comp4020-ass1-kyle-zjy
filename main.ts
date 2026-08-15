import { clampDistance, getZoneId, type ZoneId } from "./ocean-state";
import { ZONE_CONTENT } from "./ocean-content";

// How far (in NM) from a boundary its marker starts fading in. Purely
// presentational — the legal zone itself is decided by getZoneId, not this.
const BOUNDARY_HALO_NM = 20;

export function mount(doc: Document): void {
  const slider = doc.querySelector<HTMLInputElement>("#ship-distance");
  if (!slider) return;

  const distanceValue = doc.querySelector<HTMLElement>("#distance-value");
  const zoneDistanceValue = doc.querySelector<HTMLElement>("#zone-distance-value");
  const zoneHeading = doc.querySelector<HTMLElement>("#zone-heading");
  const zoneStatement = doc.querySelector<HTMLElement>("#zone-statement");
  const zoneBody = doc.querySelector<HTMLElement>("#zone-body");
  const overlapDiagram = doc.querySelector<HTMLElement>("#overlap-diagram");
  const announcer = doc.querySelector<HTMLElement>("#zone-announcer");
  const boundaryEls = Array.from(doc.querySelectorAll<HTMLElement>("[data-boundary]"));

  let currentZone: ZoneId | null = null;

  function render(rawDistance: number): void {
    const distance = clampDistance(rawDistance);
    const zoneId = getZoneId(distance);
    const rounded = String(Math.round(distance));

    if (distanceValue) distanceValue.textContent = rounded;
    if (zoneDistanceValue) zoneDistanceValue.textContent = rounded;

    for (const el of boundaryEls) {
      const boundaryNm = Number(el.dataset.nm);
      const proximity = Math.abs(distance - boundaryNm);
      const emphasis = Math.max(0, 1 - proximity / BOUNDARY_HALO_NM);
      el.style.setProperty("--emphasis", emphasis.toFixed(3));
    }

    if (zoneId === currentZone) return;
    currentZone = zoneId;

    const content = ZONE_CONTENT[zoneId];
    doc.body.dataset.zone = zoneId;
    if (zoneHeading) zoneHeading.textContent = content.heading;
    if (zoneStatement) zoneStatement.textContent = content.statement;
    if (zoneBody) {
      zoneBody.replaceChildren(
        ...content.paragraphs.map((paragraph) => {
          const p = doc.createElement("p");
          p.textContent = paragraph;
          return p;
        }),
      );
    }
    if (overlapDiagram) overlapDiagram.hidden = !content.overlapDiagram;
    if (announcer) announcer.textContent = content.announcement;
  }

  slider.addEventListener("input", () => render(Number(slider.value)));
  render(Number(slider.value));
}

if (typeof document !== "undefined") {
  mount(document);
}
