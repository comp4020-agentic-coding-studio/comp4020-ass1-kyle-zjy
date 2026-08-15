// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_ANSWERS, AUTHORITY_MATRIX, XRAY_ZONE_LAYERS } from "../ocean-journey-content";
import { getDistanceFromVisualFraction, getVisualPosition } from "../ocean-state";

// Same real-markup + real-controller mount pattern as spec/ocean-app.test.ts,
// but re-mounted fresh per test (rather than once in beforeAll) since these
// tests exercise stateful things — discovered boundaries, activity selection,
// X-ray — that must not leak between cases.
beforeEach(async () => {
  const html = readFileSync(resolve("index.html"), "utf8");
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  document.body.innerHTML = body ? body[1] : html;
  vi.resetModules();
  // main.ts auto-mounts against the global `document` on import (see its
  // final `if (typeof document !== "undefined") mount(document)` guard), so
  // resetting modules and re-importing is enough to get a fresh mount here —
  // calling mount() again ourselves would double-attach every listener.
  await import("../main");
});

function slider(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("#ship-distance")!;
}

function setDistance(nm: number): void {
  const input = slider();
  input.value = String(getVisualPosition(nm) * 100);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function activityRadio(id: string): HTMLInputElement {
  return document.querySelector<HTMLInputElement>(`input[name="activity"][value="${id}"]`)!;
}

function chooseActivity(id: string): void {
  const radio = activityRadio(id);
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
}

// Toast cards remove themselves on the CSS animation's "animationend" event
// (see main.ts's showMinorToast), which jsdom never fires on its own — so
// tests that care about a single crossing's toast count must simulate it
// between steps, the same way a real animation completing would.
function clearToasts(): void {
  for (const card of document.querySelectorAll("#boundary-toast .toast-card")) {
    card.dispatchEvent(new Event("animationend", { bubbles: true }));
  }
}

function toastCount(): number {
  return document.querySelectorAll("#boundary-toast .toast-card").length;
}

// The climax overlay's last beat clears both the overlay and the
// body.climax-active hook on "animationend", same jsdom caveat as toasts.
function clearClimax(): void {
  const beats = document.querySelectorAll("#climax-overlay .climax-beat");
  beats[beats.length - 1]?.dispatchEvent(new Event("animationend", { bubbles: true }));
}

function climaxActive(): boolean {
  return (
    document.body.classList.contains("climax-active") &&
    document.querySelector("#climax-overlay")!.classList.contains("is-active")
  );
}

describe("boundary crossing events", () => {
  it("fires a toast and logs the 12 NM crossing exactly once", () => {
    setDistance(5);
    expect(toastCount()).toBe(0);

    setDistance(12);
    expect(toastCount()).toBe(1);
    expect(document.querySelector('.log-entry[data-nm="12"]')!.getAttribute("data-discovered")).toBe("true");
    clearToasts();

    setDistance(5);
    setDistance(12);
    expect(toastCount()).toBe(0);
  });

  it("fires independent single-beat toasts for 12 and 24 crossed together", () => {
    setDistance(25);
    expect(toastCount()).toBe(2); // 12 and 24, each a single-beat toast
    expect(climaxActive()).toBe(false);
  });

  it("gives the 200 NM crossing its own climax overlay, not a toast", () => {
    setDistance(199);
    clearToasts();
    expect(toastCount()).toBe(0);
    expect(climaxActive()).toBe(false);

    setDistance(201);
    expect(climaxActive()).toBe(true);
    expect(toastCount()).toBe(0);
    expect(document.querySelector('.log-entry[data-nm="200"]')!.getAttribute("data-discovered")).toBe("true");

    clearClimax();
    expect(climaxActive()).toBe(false);
  });

  it("plays only the climax, suppressing minor toasts, when 12/24/200 are all crossed in one fast drag", () => {
    setDistance(205);
    expect(climaxActive()).toBe(true);
    expect(toastCount()).toBe(0);
    expect(document.querySelector('.log-entry[data-nm="12"]')!.getAttribute("data-discovered")).toBe("true");
    expect(document.querySelector('.log-entry[data-nm="24"]')!.getAttribute("data-discovered")).toBe("true");
    expect(document.querySelector('.log-entry[data-nm="200"]')!.getAttribute("data-discovered")).toBe("true");
  });

  it("does not fire a new crossing event when moving backward over an already-discovered boundary", () => {
    setDistance(15);
    expect(toastCount()).toBe(1);
    clearToasts();

    setDistance(30);
    expect(toastCount()).toBe(1);
    clearToasts();

    setDistance(20);
    expect(toastCount()).toBe(0);
    expect(document.querySelector('.log-entry[data-nm="12"]')!.getAttribute("data-discovered")).toBe("true");
    expect(document.querySelector('.log-entry[data-nm="24"]')!.getAttribute("data-discovered")).toBe("true");
  });

  it("shows an approach hint just short of a boundary, and clears it once well clear of one", () => {
    setDistance(11);
    expect(document.querySelector("#approach-hint")!.textContent).not.toBe("");

    setDistance(15);
    expect(document.querySelector("#approach-hint")!.textContent).toBe("");
  });
});

describe("aria-valuetext", () => {
  it("names both the distance and the zone, and updates as either changes", () => {
    setDistance(5);
    expect(slider().getAttribute("aria-valuetext")).toMatch(/^5 nautical miles/);
    expect(slider().getAttribute("aria-valuetext")).toMatch(/Territorial Sea/i);

    setDistance(210);
    expect(slider().getAttribute("aria-valuetext")).toMatch(/^210 nautical miles/);
    expect(slider().getAttribute("aria-valuetext")).toMatch(/High Seas/i);
  });
});

describe("non-linear visual scale", () => {
  it("matches the piecewise spec at every segment boundary", () => {
    expect(getVisualPosition(0)).toBeCloseTo(0.06);
    expect(getVisualPosition(12)).toBeCloseTo(0.3);
    expect(getVisualPosition(24)).toBeCloseTo(0.52);
    expect(getVisualPosition(200)).toBeCloseTo(0.88);
    expect(getVisualPosition(250)).toBeCloseTo(0.96);
  });

  it("is monotonic non-decreasing across the whole range", () => {
    let previous = -Infinity;
    for (let nm = 0; nm <= 250; nm += 5) {
      const fraction = getVisualPosition(nm);
      expect(fraction).toBeGreaterThanOrEqual(previous);
      previous = fraction;
    }
  });
});

describe("visual fraction inverse", () => {
  it("round-trips getVisualPosition at each segment boundary", () => {
    for (const nm of [0, 12, 24, 200, 250]) {
      const fraction = getVisualPosition(nm);
      expect(getDistanceFromVisualFraction(fraction)).toBeCloseTo(nm);
    }
  });

  it("clamps fractions outside the padded [0.06, 0.96] range", () => {
    expect(getDistanceFromVisualFraction(0)).toBeCloseTo(0);
    expect(getDistanceFromVisualFraction(0.03)).toBeCloseTo(0);
    expect(getDistanceFromVisualFraction(1)).toBeCloseTo(250);
    expect(getDistanceFromVisualFraction(0.99)).toBeCloseTo(250);
  });
});

describe("activity selector", () => {
  it("defaults to navigate and updates the answer per zone", () => {
    expect(activityRadio("navigate").checked).toBe(true);
    const initialAnswer = document.querySelector("#activity-answer")!.textContent;
    expect(initialAnswer).toBe(ACTIVITY_ANSWERS["territorial-sea"].navigate.answer);

    chooseActivity("fish");
    expect(document.querySelector("#activity-answer")!.textContent).toBe(
      ACTIVITY_ANSWERS["territorial-sea"].fish.answer,
    );

    setDistance(85);
    expect(document.querySelector("#activity-answer")!.textContent).toBe(ACTIVITY_ANSWERS.eez.fish.answer);
  });

  it("reflects the chosen activity on the decorative ship marker", () => {
    chooseActivity("research");
    expect(document.querySelector("#ship-marker")!.getAttribute("data-activity")).toBe("research");
  });
});

describe("legal X-ray toggle", () => {
  it("is off by default and toggles a body data attribute", () => {
    expect(document.body.dataset.xray).toBe("off");

    const toggle = document.querySelector<HTMLInputElement>("#legal-xray-toggle")!;
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));

    expect(document.body.dataset.xray).toBe("on");
  });

  it("highlights the seabed layer when the seabed activity is selected", () => {
    chooseActivity("seabed");
    const seabedLayer = document.querySelector('[data-layer="seabed"]')!;
    const waterLayer = document.querySelector('[data-layer="water"]')!;
    expect(seabedLayer.getAttribute("data-highlight")).toBe("true");
    expect(waterLayer.getAttribute("data-highlight")).toBe("false");
  });

  it("updates the X-ray layer labels and captions when the zone changes, not just the highlight", () => {
    expect(document.querySelector("#xray-label-water")!.textContent).toBe(
      XRAY_ZONE_LAYERS["territorial-sea"].water.label,
    );
    expect(document.querySelector("#xray-caption-water")!.textContent).toBe(
      XRAY_ZONE_LAYERS["territorial-sea"].water.caption,
    );

    setDistance(85);
    expect(document.querySelector("#xray-label-water")!.textContent).toBe(XRAY_ZONE_LAYERS.eez.water.label);
    expect(document.querySelector("#xray-caption-water")!.textContent).toBe(XRAY_ZONE_LAYERS.eez.water.caption);
    expect(document.querySelector("#xray-label-water")!.textContent).not.toBe(
      XRAY_ZONE_LAYERS["territorial-sea"].water.label,
    );
  });
});

describe("authority matrix rendering", () => {
  it("renders both an actor and a value span per cell", () => {
    setDistance(85);
    for (const row of AUTHORITY_MATRIX) {
      const actorEl = document.querySelector(`#matrix-actor-${row.id}`)!;
      const valueEl = document.querySelector(`#matrix-value-${row.id}`)!;
      expect(actorEl.textContent).toBe(row.values.eez.actor);
      expect(valueEl.textContent).toBe(row.values.eez.value);
    }
  });
});

describe("authority matrix content safety", () => {
  it("never claims the EEZ is Australian territory or that Australia has sovereignty there", () => {
    for (const row of AUTHORITY_MATRIX) {
      expect(row.values.eez.value.toLowerCase()).not.toMatch(/australian territory/);
    }
    expect(AUTHORITY_MATRIX.find((r) => r.id === "sovereignty")!.values.eez.actor.toLowerCase()).not.toBe(
      "australia",
    );
  });

  it("never sequences the seabed row as a distinct fifth zone label", () => {
    const seabedRow = AUTHORITY_MATRIX.find((r) => r.id === "seabed")!;
    expect(seabedRow.label.toLowerCase()).not.toMatch(/zone/);
  });
});

describe("activity answers content safety", () => {
  it("keeps high-seas fishing framed as governed by international rules, not lawless", () => {
    expect(ACTIVITY_ANSWERS["high-seas"].fish.answer.toLowerCase()).not.toMatch(/unregulated$/);
  });

  it("never calls the EEZ Australian territory in any activity answer", () => {
    for (const answer of Object.values(ACTIVITY_ANSWERS.eez)) {
      expect(answer.answer.toLowerCase()).not.toMatch(/australian territory/);
    }
  });
});
