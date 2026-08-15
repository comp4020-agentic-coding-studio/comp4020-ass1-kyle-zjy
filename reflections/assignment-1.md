# Assignment 1 reflection

**The breakthrough that moved the work forward** was realising the single
mechanic only works if the ship's position is a number, not a place on
screen. My first instinct was to track where the ship sat inside the ocean
scene and work out the legal zone from that. It would have looked identical
at first, but the brief demands the interaction survive a resize mid-drag,
and anything built from pixel geometry can't promise that --- geometry changes
size, the number underneath it doesn't. Once the ship's distance in nautical
miles became the one thing everything else (the zone, the marker positions,
the boundary halo, the ship's own position) was computed from, most of the
brief's harder constraints --- resize survival, exact boundary values,
keyboard parity with dragging --- stopped being separate problems and started
falling out of the same design for free.

**What this changed about who I want to be as a developer** is how I treat
"looks right" versus "is checked." I hand-verified WCAG contrast ratios by
working the luminance formula myself rather than trusting an opacity value
that looked fine on the one zone I was staring at, because I had no
browser-based contrast tool available in this environment and wasn't willing
to ship a guess. I want to keep that habit outside a sandboxed environment
too: when the easy tool isn't there, do the check anyway, by hand if it comes
to that, rather than downgrading the standard to match the available tooling.
