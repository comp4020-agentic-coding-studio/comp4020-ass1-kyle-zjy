// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// Loads the real index.html markup into jsdom's document, then mounts the
// real main.ts controller against it — no re-implementation of the markup,
// no reliance on <script> execution (jsdom won't run scripts inserted via
// innerHTML, so main.ts is imported and mounted directly instead).
beforeAll(async () => {
  const html = readFileSync(resolve("index.html"), "utf8");
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  document.body.innerHTML = body ? body[1] : html;
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

function heading(): string {
  return document.querySelector("#zone-heading")!.textContent!.trim();
}

function statement(): string {
  return document.querySelector("#zone-statement")!.textContent!.trim();
}

// Test A — initial render
describe("initial render", () => {
  it("shows the core concept and the ship control", () => {
    expect(document.querySelector("h1")!.textContent).toMatch(/who owns the ocean/i);
    expect(slider()).toBeTruthy();
    expect(slider().getAttribute("aria-label")).toMatch(/distance/i);
  });

  it("starts in the Territorial Sea at 0 NM", () => {
    expect(slider().value).toBe("0");
    expect(heading()).toMatch(/territorial sea/i);
  });
});

// Test B — territorial sea
it("shows TERRITORIAL SEA at or below 12 NM", () => {
  setDistance(12);
  expect(heading()).toMatch(/territorial sea/i);
});

// Test C — contiguous zone
it("shows CONTIGUOUS ZONE between 12 and 24 NM", () => {
  setDistance(18);
  expect(heading()).toMatch(/contiguous zone/i);
});

// Test D — EEZ
it("shows EXCLUSIVE ECONOMIC ZONE well beyond 24 but below 200 NM, and disclaims territory", () => {
  setDistance(85);
  expect(heading()).toMatch(/exclusive economic zone/i);
  expect(statement()).toMatch(/not australian territory/i);
});

// Test E — High Seas
it("shows HIGH SEAS beyond 200 NM, and that the law does not end there", () => {
  setDistance(201);
  expect(heading()).toMatch(/high seas/i);
  expect(statement()).toMatch(/the law does not/i);
});

// Test F — keyboard interaction (arrow keys move a native range input by
// changing its value and firing "input" — the same event this asserts on)
it("responds correctly to a keyboard-style value change", () => {
  setDistance(50);
  expect(heading()).toMatch(/exclusive economic zone/i);

  const input = slider();
  input.focus();
  expect(document.activeElement).toBe(input);

  setDistance(5);
  expect(document.querySelector("#distance-value")!.textContent).toBe("5");
  expect(heading()).toMatch(/territorial sea/i);
});

// Test G — state survives resize
it("keeps the ship's logical distance and zone across a viewport resize", () => {
  setDistance(150);
  expect(heading()).toMatch(/exclusive economic zone/i);

  window.dispatchEvent(new Event("resize"));

  expect(slider().value).toBe("150");
  expect(heading()).toMatch(/exclusive economic zone/i);
  expect(document.querySelector("#zone-heading")!.textContent!.trim().length).toBeGreaterThan(0);
});
