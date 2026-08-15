// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_ANSWERS, AUTHORITY_MATRIX } from "../ocean-journey-content";

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
  input.value = String(nm);
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
// (see main.ts's showBoundaryEvents), which jsdom never fires on its own —
// so tests that care about a single crossing's toast count must simulate it
// between steps, the same way a real animation completing would.
function clearToasts(): void {
  for (const card of document.querySelectorAll("#boundary-toast .toast-card")) {
    card.dispatchEvent(new Event("animationend", { bubbles: true }));
  }
}

function toastCount(): number {
  return document.querySelectorAll("#boundary-toast .toast-card").length;
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

  it("gives the 200 NM crossing two toast beats", () => {
    setDistance(25);
    expect(toastCount()).toBe(2); // 12 and 24, each a single-beat toast
    clearToasts();

    setDistance(199);
    expect(toastCount()).toBe(0);

    setDistance(201);
    expect(toastCount()).toBe(2);
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
});

describe("authority matrix content safety", () => {
  it("never claims the EEZ is Australian territory or that Australia has sovereignty there", () => {
    for (const row of AUTHORITY_MATRIX) {
      expect(row.values.eez.toLowerCase()).not.toMatch(/australian territory/);
    }
    expect(AUTHORITY_MATRIX.find((r) => r.id === "sovereignty")!.values.eez.toLowerCase()).not.toBe("australia");
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
