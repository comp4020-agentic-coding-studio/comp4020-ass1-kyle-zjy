# Process overview

## What I built

"Who Owns the Ocean?" is a single page, one mechanic: a native range input
drags a ship from the Australian coast, and the water's legal status changes
at three boundaries --- 12, 24, 200 NM: territorial sea, contiguous zone,
exclusive economic zone, high seas. Its point: in this simplified transect,
crossing 200 NM takes the ship beyond Australia's EEZ; Australia's EEZ rights
end there, but international law does not.

## The moments that mattered

1. **The state had to survive a resize, so it couldn't be built from
   pixels.** Tracking the ship as a pixel offset and deriving the zone from
   it breaks the moment the scene's width changes mid-drag, since geometry
   and "real" distance fall out of sync. Instead the logical distance in
   nautical miles is the single source of truth: the slider's on-screen
   position is converted back to NM, `getZoneId` in `ocean-state.ts` is a
   pure function of that NM number, and every visual element derives from it
   --- nothing reads the zone off geometry.
   `spec/ocean-app.test.ts`'s resize test (dispatch `resize` mid-drag, assert
   the zone is unchanged) verifies this, and it's why the rule is in
   [`CLAUDE.md`](CLAUDE.md#this-project-who-owns-the-ocean), not something
   to re-check by hand:
   [`49772f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/49772f0).

2. **Opacity-based de-emphasis risked failing contrast, with no automated
   way to check it.** The background recolours per zone from
   pale to near-black, and `opacity` on secondary text blends toward
   whatever's behind it --- fine on the zone I was looking at, invisible
   elsewhere, with no Lighthouse/axe-core to catch it. I worked the WCAG
   luminance formula by hand per zone, picking an explicit
   `--ink-muted` colour clearing 4.5:1, and made "never use bare opacity for
   de-emphasis" a standing `CLAUDE.md` rule rather than a one-off fix:
   [`49772f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/49772f0),
   rule in
   [`a5b8cbb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/a5b8cbb).

3. **The legal distance and the on-screen distance had to stop being the
   same number.** Laid out linearly across 0--250 NM, 12 and 24 sit under 5%
   apart on screen --- unreadable as distinct boundaries. `getVisualPosition`
   is a non-linear NM-to-screen-fraction remap giving crowded early
   boundaries real room, while `getZoneId` still decides the zone from the
   untouched NM number
   ([`d093631`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/d093631)).
   That split had to become exact: the native slider still moved linearly
   while the ship moved on the new curve, so cursor and ship disagreed.
   Repointing the slider's value domain to on-screen percentage, with
   `getDistanceFromVisualFraction` as its exact inverse, locked the two
   together
   ([`e3879dd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/e3879dd)).

4. **A real bug only showed up once I stopped treating automated checks as
   the finish line.** The agent sandbox has no working browser to drive, so
   once `pnpm check` was green I pushed, deployed, and manually tested the
   live Pages URL
   --- which is how I found the visible ship couldn't actually be grabbed.
   `.xray-layers` sat over the real `<input type="range">` with no
   `pointer-events: none`, swallowing every pointer event, and the
   decorative ship's position formula didn't match the native thumb's
   centring math; nothing local had ever dragged the ship in a real
   browser. I fixed the hit target itself (`pointer-events: none` on the
   decorative layer, an explicit `z-index`, a `calc()` reproducing the
   thumb's centring formula) without touching the semantic input, then
   re-verified the drag by hand on the deployed page
   ([`887d992`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/887d992)).
   The standing rule in
   [`CLAUDE.md`](CLAUDE.md#end-of-iteration-workflow) --- checks → commit →
   push → deploy → inspect live interaction ---
   ([`98ae5cf`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-kyle-zjy/commit/98ae5cf))
   earns its keep here: green tests meant the logic was right, not the page.

## Final verification

`pnpm check` is green: typecheck, build, oxlint, stylelint, 62 vitest tests
across 5 files --- 4 in `spec/` plus `scripts/check-evidence.test.ts`.
`pnpm check:evidence` passes. Ship dragging and boundary crossings were
manually re-verified on the deployed Pages URL, per moment 4.
