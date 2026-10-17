// Tuning knobs for the hero carousel and its light trunk. Values were picked by eye on a 1440×900 laptop screen.
export const motion = {
  traversalSeconds: 52, // time one card takes from its top fade-in to its bottom fade-out
  visibleSlots: 3.4, // ≈ how many cards share the visible column at once
  hiddenSlots: 0.6, // minimum off-screen gap, so wrapping back to the top is never seen
  turnsPerDescent: 0.9, // revolutions around the column during one descent
  orbitWidth: 420, // px, maximum horizontal swing; shrinks automatically to fit the column
  depth: { minScale: 0.8, maxScale: 1.04, minOpacity: 0.42 }, // rear → front
  fadeEdge: 0.13, // share of the path used to fade in at the top and out at the bottom
  trunk: { radius: 0.62, turns: 1.6, strands: 5 }, // light trunk: coil radius (share of the orbit), turns, strand count (1–5)
  glowIntensity: 1, // strength of the soft halo around the trunk, ~0.4–1.5
  hoverScale: 1.04, // zoom of a hovered / focused card
  resumeRampSeconds: 0.7, // speed ramps up after a pause; the position itself never jumps
}
