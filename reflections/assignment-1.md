# Assignment 1 reflection

**The breakthrough that moved the work forward** was realising that the
ship's logical distance had to be independent from where it happened to sit
on screen. My first instinct was to derive the legal zone from the ship's
pixel position inside the ocean scene. That would have looked correct at
first, but the brief requires the interaction to survive a resize mid-drag,
and screen geometry changes while the legal distance does not. Once nautical
miles became the source of truth for legal state, the visual position could
be remapped independently without changing the meaning underneath it. This
also made exact boundary values and resize-safe state much easier to reason
about and test.

**What this changed about who I want to be as a developer** is how I decide
when an agent's work is actually finished. At one point every automated check
was green, but after deploying the page and trying it myself I discovered that
the visible ship could not actually be dragged. The tests had verified the
state logic, not the human interaction. Fixing that changed my workflow:
checks are evidence, but they are not the final judgement. I want to be a
developer who uses agents and automated tests aggressively, while still
verifying the parts that require human perception and interaction before I
accept the result.
