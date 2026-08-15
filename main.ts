import {
  type ActivityId,
  type BoundaryNm,
  CROSSING_BOUNDARIES,
  getApproachingBoundary,
  getBoundariesCrossedOutbound,
  getDistanceFromVisualFraction,
  getVisualPosition,
  getZoneId,
  type ZoneId,
} from "./ocean-state";
import { ZONE_CONTENT } from "./ocean-content";
import {
  ACTIVITY_ANSWERS,
  APPROACHING_LABEL,
  AUTHORITY_MATRIX,
  CLIMAX_EVENT,
  getAnnouncement,
  getLogCaption,
  MINOR_BOUNDARY_EVENTS,
  XRAY_LAYER_BY_ACTIVITY,
  XRAY_ZONE_LAYERS,
  type XrayLayerId,
} from "./ocean-journey-content";

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

// How far (in NM) from a boundary its marker starts fading in. Purely
// presentational — the legal zone itself is decided by getZoneId, not this.
const BOUNDARY_HALO_NM = 20;

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // DOM REFS
  // -------------------------------------------------------------------------

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
  const climaxOverlay = doc.querySelector<HTMLElement>("#climax-overlay");
  const climaxBeatEls = CLIMAX_EVENT.beats.map((_, i) => doc.querySelector<HTMLElement>(`#climax-beat-${i}`));
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

  const initialDistance = getDistanceFromVisualFraction(Number(slider.value) / 100);

  const state: AppState = {
    distance: initialDistance,
    zone: getZoneId(initialDistance),
    activity: "navigate",
    legalXray: false,
    crossedBoundaries: new Set<BoundaryNm>(),
  };

  let lastRenderedZone: ZoneId | null = null;

  // -------------------------------------------------------------------------
  // DERIVED STATE (per-render DOM updates)
  // -------------------------------------------------------------------------

  function updatePositions(): void {
    const fraction = getVisualPosition(state.distance);
    const percent = `${(fraction * 100).toFixed(2)}%`;
    // The ship marker is positioned via a calc() in styles.css that
    // replicates the real range input's own thumb-centring formula, so it
    // needs the raw 0-1 slider fraction (matching (value-min)/(max-min)),
    // not the 6%-96% screen percent the ruler marker uses.
    const rawFraction = (fraction - 0.06) / 0.9;
    shipMarker?.style.setProperty("--ship-frac", rawFraction.toFixed(4));
    rulerMarker?.style.setProperty("--ship-pos", percent);
    oceanScene?.style.setProperty("--openness", (1 - fraction).toFixed(3));
  }

  function updateSliderValueText(): void {
    const rounded = Math.round(state.distance);
    slider?.setAttribute("aria-valuetext", `${rounded} nautical miles from the coast — ${ZONE_CONTENT[state.zone].heading}`);
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

  function updateXrayZoneContent(zoneId: ZoneId): void {
    const layers = XRAY_ZONE_LAYERS[zoneId];
    for (const layerId of Object.keys(layers) as XrayLayerId[]) {
      const labelEl = doc.querySelector<HTMLElement>(`#xray-label-${layerId}`);
      const captionEl = doc.querySelector<HTMLElement>(`#xray-caption-${layerId}`);
      if (labelEl) labelEl.textContent = layers[layerId].label;
      if (captionEl) captionEl.textContent = layers[layerId].caption;
    }
  }

  function updateCaptainLog(): void {
    for (const entry of logEntries) {
      const discovered = state.crossedBoundaries.has(entry.nm);
      if (entry.li) entry.li.dataset.discovered = discovered ? "true" : "false";
      if (entry.text) {
        entry.text.textContent = discovered ? `${entry.nm} NM — ${getLogCaption(entry.nm)}` : `${entry.nm} NM — not yet crossed`;
      }
    }
  }

  function updateAuthorityMatrix(zoneId: ZoneId): void {
    for (const row of AUTHORITY_MATRIX) {
      const cell = row.values[zoneId];
      const actorEl = doc.querySelector<HTMLElement>(`#matrix-actor-${row.id}`);
      const valueEl = doc.querySelector<HTMLElement>(`#matrix-value-${row.id}`);
      if (actorEl) actorEl.textContent = cell.actor;
      if (valueEl) valueEl.textContent = cell.value;
    }
  }

  // ---------------------------------------------------------------------------
  // BOUNDARY EVENTS
  // ---------------------------------------------------------------------------

  // 12 and 24 NM are small, non-blocking toasts. 200 NM is the narrative
  // climax and gets a full-bleed overlay instead — if it's crossed in the
  // same fast drag as a minor boundary, the climax alone plays so it never
  // has to compete with a smaller notification for attention.

  function showMinorToast(nm: 12 | 24): void {
    if (!boundaryToast) return;
    const { heading, body } = MINOR_BOUNDARY_EVENTS[nm].toast;
    const card = doc.createElement("div");
    card.className = "toast-card";
    const headingEl = doc.createElement("p");
    headingEl.className = "toast-heading";
    headingEl.textContent = heading;
    const bodyEl = doc.createElement("p");
    bodyEl.className = "toast-body";
    bodyEl.textContent = body;
    card.append(headingEl, bodyEl);
    card.addEventListener("animationend", () => card.remove());
    boundaryToast.append(card);
  }

  function showClimax(): void {
    if (!climaxOverlay) return;
    CLIMAX_EVENT.beats.forEach((beat, i) => {
      const el = climaxBeatEls[i];
      if (el) el.textContent = beat.text;
    });
    doc.body.classList.add("climax-active");
    climaxOverlay.classList.add("is-active");
    const lastBeat = climaxBeatEls[climaxBeatEls.length - 1];
    lastBeat?.addEventListener(
      "animationend",
      () => {
        doc.body.classList.remove("climax-active");
        climaxOverlay.classList.remove("is-active");
      },
      { once: true },
    );
  }

  function showBoundaryEvents(nms: BoundaryNm[]): void {
    if (nms.length === 0) return;
    const hasClimax = nms.includes(200);
    if (hasClimax) {
      showClimax();
    } else {
      for (const nm of nms) showMinorToast(nm as 12 | 24);
    }
    const lastAnnouncement = getAnnouncement(nms[nms.length - 1]);
    if (boundaryAnnouncer) boundaryAnnouncer.textContent = lastAnnouncement;
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

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
    updateSliderValueText();
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
    updateXrayZoneContent(state.zone);
  }

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------

  function handleDistanceInput(rawScreenPercent: number): void {
    const prevDistance = state.distance;
    const nextDistance = getDistanceFromVisualFraction(rawScreenPercent / 100);
    const newlyCrossed = getBoundariesCrossedOutbound(prevDistance, nextDistance).filter(
      (nm) => !state.crossedBoundaries.has(nm),
    );

    state.distance = nextDistance;
    state.zone = getZoneId(nextDistance);
    for (const nm of newlyCrossed) state.crossedBoundaries.add(nm);

    render();
    showBoundaryEvents(newlyCrossed);
  }

  function clearFirstNudge(): void {
    shipMarker?.classList.remove("first-nudge");
  }

  slider.addEventListener("input", () => handleDistanceInput(Number(slider.value)));
  slider.addEventListener("focus", () => shipMarker?.classList.add("is-focused"));
  slider.addEventListener("blur", () => shipMarker?.classList.remove("is-focused"));
  slider.addEventListener("pointerdown", clearFirstNudge, { once: true });
  slider.addEventListener("keydown", clearFirstNudge, { once: true });

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

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  shipMarker?.classList.add("first-nudge");
  render();
}

if (typeof document !== "undefined") {
  mount(document);
}
