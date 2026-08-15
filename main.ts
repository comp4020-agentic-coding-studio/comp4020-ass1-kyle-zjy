import {
  type ActivityId,
  type BoundaryNm,
  CROSSING_BOUNDARIES,
  clampDistance,
  getApproachingBoundary,
  getBoundariesCrossedOutbound,
  getProgressFraction,
  getZoneId,
  type ZoneId,
} from "./ocean-state";
import { ZONE_CONTENT } from "./ocean-content";
import {
  ACTIVITY_ANSWERS,
  APPROACHING_LABEL,
  AUTHORITY_MATRIX,
  BOUNDARY_EVENTS,
  XRAY_LAYER_BY_ACTIVITY,
} from "./ocean-journey-content";

// How far (in NM) from a boundary its marker starts fading in. Purely
// presentational — the legal zone itself is decided by getZoneId, not this.
const BOUNDARY_HALO_NM = 20;

interface AppState {
  distance: number;
  zone: ZoneId;
  activity: ActivityId;
  legalXray: boolean;
  crossedBoundaries: Set<BoundaryNm>;
}

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
  const boundaryAnnouncer = doc.querySelector<HTMLElement>("#boundary-announcer");
  const boundaryEls = Array.from(doc.querySelectorAll<HTMLElement>("[data-boundary]"));
  const boundaryToast = doc.querySelector<HTMLElement>("#boundary-toast");
  const approachHint = doc.querySelector<HTMLElement>("#approach-hint");
  const oceanScene = doc.querySelector<HTMLElement>("#ocean-scene");
  const shipMarker = doc.querySelector<HTMLElement>("#ship-marker");
  const rulerMarker = doc.querySelector<HTMLElement>("#ruler-marker");
  const xrayToggle = doc.querySelector<HTMLInputElement>("#legal-xray-toggle");
  const xrayLayerEls = Array.from(doc.querySelectorAll<HTMLElement>("[data-layer]"));
  const activityRadios = Array.from(doc.querySelectorAll<HTMLInputElement>('input[name="activity"]'));
  const activityOptionEls = Array.from(doc.querySelectorAll<HTMLElement>(".activity-option"));
  const activityQuestion = doc.querySelector<HTMLElement>("#activity-question");
  const activityAnswer = doc.querySelector<HTMLElement>("#activity-answer");
  const logEntries = CROSSING_BOUNDARIES.map((nm) => ({
    nm,
    li: doc.querySelector<HTMLElement>(`.log-entry[data-nm="${nm}"]`),
    text: doc.querySelector<HTMLElement>(`#log-text-${nm}`),
  }));

  const state: AppState = {
    distance: clampDistance(Number(slider.value)),
    zone: getZoneId(Number(slider.value)),
    activity: "navigate",
    legalXray: false,
    crossedBoundaries: new Set<BoundaryNm>(),
  };

  let lastRenderedZone: ZoneId | null = null;

  function updatePositions(): void {
    const fraction = getProgressFraction(state.distance);
    const percent = `${(fraction * 100).toFixed(2)}%`;
    shipMarker?.style.setProperty("--ship-pos", percent);
    rulerMarker?.style.setProperty("--ship-pos", percent);
    oceanScene?.style.setProperty("--openness", (1 - fraction).toFixed(3));
  }

  function updateApproachHint(): void {
    if (!approachHint) return;
    approachHint.textContent = getApproachingBoundary(state.distance) !== null ? APPROACHING_LABEL : "";
  }

  function updateActivitySelection(): void {
    for (const el of activityOptionEls) {
      el.classList.toggle("is-selected", el.dataset.activity === state.activity);
    }
    if (shipMarker) shipMarker.dataset.activity = state.activity;
  }

  function updateActivityAnswer(): void {
    const entry = ACTIVITY_ANSWERS[state.zone][state.activity];
    if (activityQuestion) activityQuestion.textContent = entry.question;
    if (activityAnswer) activityAnswer.textContent = entry.answer;
  }

  function updateLegalXray(): void {
    doc.body.dataset.xray = state.legalXray ? "on" : "off";
    const highlightLayer = XRAY_LAYER_BY_ACTIVITY[state.activity];
    for (const layerEl of xrayLayerEls) {
      layerEl.dataset.highlight = layerEl.dataset.layer === highlightLayer ? "true" : "false";
    }
    shipMarker?.classList.toggle("show-seabed-line", state.legalXray || state.activity === "seabed");
  }

  function updateCaptainLog(): void {
    for (const entry of logEntries) {
      const discovered = state.crossedBoundaries.has(entry.nm);
      if (entry.li) entry.li.dataset.discovered = discovered ? "true" : "false";
      if (entry.text) {
        entry.text.textContent = discovered
          ? `${entry.nm} NM — ${BOUNDARY_EVENTS[entry.nm].logCaption}`
          : `${entry.nm} NM — not yet crossed`;
      }
    }
  }

  function updateAuthorityMatrix(zoneId: ZoneId): void {
    for (const row of AUTHORITY_MATRIX) {
      const el = doc.querySelector<HTMLElement>(`#matrix-value-${row.id}`);
      if (el) el.textContent = row.values[zoneId];
    }
  }

  function showBoundaryEvents(nms: BoundaryNm[]): void {
    let lastAnnouncement = "";
    for (const nm of nms) {
      const event = BOUNDARY_EVENTS[nm];
      event.toasts.forEach((toast, i) => {
        if (!boundaryToast) return;
        const card = doc.createElement("div");
        card.className = "toast-card";
        card.style.setProperty("--beat", String(i));
        const heading = doc.createElement("p");
        heading.className = "toast-heading";
        heading.textContent = toast.heading;
        const body = doc.createElement("p");
        body.className = "toast-body";
        body.textContent = toast.body;
        card.append(heading, body);
        card.addEventListener("animationend", () => card.remove());
        boundaryToast.append(card);
      });
      lastAnnouncement = event.announcement;
    }
    if (boundaryAnnouncer && lastAnnouncement) boundaryAnnouncer.textContent = lastAnnouncement;
  }

  function render(): void {
    const distance = state.distance;
    const rounded = String(Math.round(distance));

    if (distanceValue) distanceValue.textContent = rounded;
    if (zoneDistanceValue) zoneDistanceValue.textContent = rounded;

    for (const el of boundaryEls) {
      const boundaryNm = Number(el.dataset.nm);
      const proximity = Math.abs(distance - boundaryNm);
      const emphasis = Math.max(0, 1 - proximity / BOUNDARY_HALO_NM);
      el.style.setProperty("--emphasis", emphasis.toFixed(3));
      el.dataset.discovered = state.crossedBoundaries.has(boundaryNm as BoundaryNm) ? "true" : "false";
    }

    updatePositions();
    updateApproachHint();
    updateActivitySelection();
    updateActivityAnswer();
    updateLegalXray();
    updateCaptainLog();

    if (state.zone === lastRenderedZone) return;
    lastRenderedZone = state.zone;

    const content = ZONE_CONTENT[state.zone];
    doc.body.dataset.zone = state.zone;
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
    updateAuthorityMatrix(state.zone);
  }

  function handleDistanceInput(rawValue: number): void {
    const prevDistance = state.distance;
    const nextDistance = clampDistance(rawValue);
    const newlyCrossed = getBoundariesCrossedOutbound(prevDistance, nextDistance).filter(
      (nm) => !state.crossedBoundaries.has(nm),
    );

    state.distance = nextDistance;
    state.zone = getZoneId(nextDistance);
    for (const nm of newlyCrossed) state.crossedBoundaries.add(nm);

    render();
    if (newlyCrossed.length > 0) showBoundaryEvents(newlyCrossed);
  }

  slider.addEventListener("input", () => handleDistanceInput(Number(slider.value)));
  slider.addEventListener("focus", () => shipMarker?.classList.add("is-focused"));
  slider.addEventListener("blur", () => shipMarker?.classList.remove("is-focused"));

  for (const radio of activityRadios) {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state.activity = radio.value as ActivityId;
      render();
    });
  }

  xrayToggle?.addEventListener("change", () => {
    state.legalXray = xrayToggle.checked;
    render();
  });

  render();
}

if (typeof document !== "undefined") {
  mount(document);
}
