# Process overview

## What I built

"Who Owns the Ocean?" is a single page with one mechanic: a native range
input drags a ship away from the Australian coast, and the legal status of
the water changes as it crosses invisible boundaries at 12, 24 and 200
nautical miles --- territorial sea, contiguous zone, exclusive economic zone,
high seas --- ending on the point the whole thing is built around: past 200 NM
no state's EEZ applies, but international law still does.

## The moments that mattered

1. **The state had to survive a resize, so it couldn't be built from pixels.**
   The brief requires the interaction to keep working if the viewport resizes
   mid-drag. The obvious build --- track the ship as a pixel offset inside the
   ocean scene, derive the zone from where it sits --- breaks the moment the
   scene's width changes, because the pixel position and the "real" distance
   fall out of sync. Instead the range input's value *is* the distance in
   nautical miles, `getZoneId` in `ocean-state.ts` is a pure function of that
   number, and the ship/boundary markers are positioned from the same
   `value / max` fraction the browser already uses for the input --- nothing
   in the whole page derives the zone from geometry. `spec/ocean-app.test.ts`'s
   resize test (dispatch a `resize` event mid-interaction, assert the zone is
   unchanged) is what verifies this holds, and it's why the rule is now in
   [`CLAUDE.md`](CLAUDE.md#this-project-who-owns-the-ocean) rather than left
   as something I'd have to remember to re-check by hand:
   [`49772f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/49772f0).

2. **Opacity-based de-emphasis silently risked failing contrast, and I had no
   automated way to check it.** The page recolours per legal zone --- the
   background runs from a pale near-white at the coast to near-black on the
   high seas --- and I'd first written secondary text (captions, the
   disclaimer, zone body copy) with `opacity` rather than a solid colour. That
   looks fine on whichever zone you happen to be looking at, but opacity
   blends the ink toward *whatever* background is behind it, and the sandbox
   here has no Lighthouse/axe-core/browser available to catch a bad ratio on a
   zone I wasn't looking at. Rather than guess, I worked the WCAG relative
   luminance formula by hand for the ink/background pairs across all four
   zones, picked an explicit `--ink-muted` colour per zone that clears 4.5:1
   against its own background, and replaced every `opacity` de-emphasis rule
   with `color: var(--ink-muted)`. That this was a real, recurring risk (not a
   one-off) is why it went into `CLAUDE.md` as a standing rule instead of just
   a fix: [`49772f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/49772f0),
   rule added in [`a5b8cbb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/a5b8cbb).

3. **Stylelint caught two conventions I'd otherwise have shipped wrong.**
   `stylelint-config-standard` rejected the BEM-style double-dash class names
   I'd used for the overlap diagram (`overlap-row--eez`) as not kebab-case, and
   rejected `@media (max-width: 600px)` in favour of the range-notation form
   `(width <= 600px)`. Both are exactly the kind of thing that "looks right"
   and works locally, which is the point of running `pnpm check` before
   pushing rather than trusting the diff by eye --- the class rename and media
   query fix both landed in the same commit as the rest of the build once
   `pnpm check` came back clean: [`49772f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/49772f0).

4. **I could not get a headless browser running in this sandbox, and said so
   instead of claiming a visual pass.** Playwright's chromium fails to launch
   here (`libnspr4.so` missing, no passwordless sudo to install it), so I
   could not screenshot the deployed page at 1920x1080 or 390x844, or watch
   the ship actually drag in a real browser. I did the responsive review at
   the code level instead --- fluid `clamp()` typography, a `width <= 600px`
   breakpoint that switches the ocean scene's aspect ratio and grows the
   thumb to a touch-safe size, `overflow-x: hidden` as a backstop --- but that
   is a code-level check, not a rendered one, and `CLAUDE.md`'s own guidance
   ("if you can't test the UI, say so explicitly rather than claiming
   success") is why this is written down here rather than left implicit.

## Before you ship

`pnpm check` is green (typecheck, build, oxlint, stylelint, 37 vitest tests
across `spec/ocean-state.test.ts`, `spec/ocean-app.test.ts`, and the shipped
`spec/invariants.test.ts`) as of
[`49772f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/49772f0).
Live-browser verification at both required viewports is still outstanding ---
see moment 4 above.
