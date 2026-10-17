import { ref, shallowRef } from 'vue'

// Shared model for the one continuous tree: the hero draws the upper spiral, TreeTrunk continues the
// same strands down the page. Both read these definitions so strands, twist and light match exactly.

export const TAU = Math.PI * 2

// Fibres: [radius share, twist (negative = counter-wound), phase, width, strength].
export const FIBRES = [
  [1.0, 1.0, 0.0, 2.2, 1],
  [0.82, -0.9, 1.3, 1.5, 0.9],
  [0.64, 1.2, 2.6, 1.2, 0.8],
  [0.92, -1.15, 3.7, 1.0, 0.65],
  [0.52, 0.85, 4.8, 0.9, 0.6],
  [0.74, -0.75, 5.6, 0.8, 0.5],
  [0.42, 1.35, 0.7, 0.7, 0.45],
]

// Radius share the hero's fibres settle to at the bottom of the stage (zero slope), where the page
// trunk takes over with the same value.
export const EXIT_ENV = 0.45

// Light travelling along the main fibres, in px so the dash pattern continues across the join.
export const FLOW_PERIOD = 40 // must match the 3 + 37 dasharray in style.css
export const flowDuration = (k) => `${3.2 + k * 1.1}s`

// Hero → page join, in hero-stage coordinates: { x, y, rho, rate, thetas[], n, flowLen[] }.
export const heroExit = shallowRef(null)

// Project card currently hovered/focused in the tree (lights its branch), and Projects visibility.
export const litProject = ref(null)
export const projectsVisible = ref(true)

export const ease = (e) => e * e * (3 - 2 * e)
export const polyLength = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)
