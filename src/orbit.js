// The project view's explorer: an outer spiral of branch labels and an inner ring of the active branch's
// projects around the selected one. Geometry, paging, slots and the turning rule live here, free of the
// DOM, so scripts/check-orbit.mjs can sweep a full rotation and prove that nothing overlaps.

export const TAU = Math.PI * 2
const RAD = Math.PI / 180

// Depth on the inner ring: the far side (top) a little smaller and dimmer, always readable.
export const DEPTH = { minScale: 0.86, minOpacity: 0.72 }
const GAP = 6 // px between neighbouring cards at their closest
export const MAX_PAGE = 6 // ring cards shown at once, at most; larger branches page through the rest

export const depthOf = (t) => Math.sin(t) // 1 = nearest (bottom of the ring), -1 = furthest (top)
const scaleAt = (z) => DEPTH.minScale + (1 - DEPTH.minScale) * ((z + 1) / 2)

// The inner ring: wider than tall, and just big enough that at every angle a card on it stays clear of
// the centre card (cw0 × ch0), corners included (checked by scripts/check-orbit.mjs).
export function innerRing(cx, cy, cw, ch, cw0, ch0) {
  const geo = { cx, cy, cw, ch, rx: cw0 / 2 + cw / 2 + 40, ry: ch0 / 2 + ch / 2 + 76 }
  geo.table = costTable(geo)
  return geo
}

// Cards are spaced by what each part of the ring needs: where it runs sideways (front and back)
// neighbours sit side by side and need a card's width; where it runs up and down they stack and need
// only its height. Cumulative "card spaces" along the ring:
function costTable(geo, steps = 1440) {
  const { rx, ry, cw, ch } = geo
  const c = [0]
  let px = rx
  let py = 0
  for (let k = 1; k <= steps; k++) {
    const t = (k / steps) * TAU
    const x = rx * Math.cos(t)
    const y = ry * Math.sin(t)
    const ds = Math.hypot(x - px, y - py)
    const s = scaleAt(depthOf(t))
    const along = Math.abs(x - px) / ds
    const across = Math.abs(y - py) / ds
    const need = Math.min(along > 1e-6 ? (cw * s + GAP) / along : Infinity, across > 1e-6 ? (ch * s + GAP) / across : Infinity)
    c.push(c[k - 1] + ds / need)
    px = x
    py = y
  }
  return c
}
export const capacity = (geo) => geo.table[geo.table.length - 1]
// How many ring cards to show at once: what the ring holds without overlap, at most MAX_PAGE.
export const pageSize = (geo) => Math.max(1, Math.min(MAX_PAGE, Math.floor(capacity(geo))))

function angleAt(table, f) {
  const steps = table.length - 1
  const target = (((f % 1) + 1) % 1) * table[steps]
  let lo = 0
  let hi = steps
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (table[mid] <= target) lo = mid
    else hi = mid
  }
  const k = (target - table[lo]) / (table[hi] - table[lo] || 1)
  return ((lo + k) / steps) * TAU
}

// A card at fraction f of the way round the ring: position, depth, scale, opacity. Growing f is clockwise.
export function ringCard(geo, f) {
  const a = angleAt(geo.table, f)
  const z = depthOf(a)
  return {
    a,
    z,
    x: geo.cx + geo.rx * Math.cos(a),
    y: geo.cy + geo.ry * z,
    s: scaleAt(z),
    o: DEPTH.minOpacity + (1 - DEPTH.minOpacity) * ((z + 1) / 2),
  }
}

// The ring's cards for one branch: every project except the selected one, a page at a time.
export function pageOf(ids, sel, size, page) {
  const others = ids.filter((id) => id !== sel)
  const pages = Math.max(1, Math.ceil(others.length / size))
  const p = ((page % pages) + pages) % pages
  return { ids: others.slice(p * size, p * size + size), page: p, pages, from: p * size + 1, to: Math.min(others.length, p * size + size), total: others.length }
}

// Slots (a fraction of a turn each, added to the rotation) for the ring's cards `ids`, evenly spaced in
// order and aligned with where the cards already on the ring are now (`current`, by id), so a new
// selection only moves the cards that trade places; cards new to the ring take their slots directly.
export function alignSlots(current, ids) {
  let sx = 0
  let sy = 0
  ids.forEach((id, k) => {
    if (current[id] == null) return
    const d = (current[id] - k / ids.length) * TAU
    sx += Math.cos(d)
    sy += Math.sin(d)
  })
  const g = sx || sy ? Math.atan2(sy, sx) / TAU : 0
  const out = {}
  ids.forEach((id, k) => {
    const t = g + k / ids.length
    out[id] = current[id] == null ? t : t + Math.round(current[id] - t) // the nearest way round
  })
  return out
}

// The outer spiral: branch labels on a curve that grows from the bottom (the earliest work, the roots)
// round the right and over the top (the newest), then curls in to the inner ring. Labels keep to the
// arcs above and below the ring, where there is room beside it. Px × Py: the spiral's outer radii.
export function outerSpiral(cx, cy, Px, Py, n, ring) {
  const nb = Math.max(1, Math.floor(n * 0.4)) // below the ring; the rest above
  const spread = (a, b, k) => (k === 1 ? [(a + b) / 2] : Array.from({ length: k }, (_, i) => a + ((b - a) * i) / (k - 1)))
  const angles = [...spread(110, 70, nb), ...spread(-50, -130, n - nb)].map((d) => d * RAD)
  const r = (u) => 1 - 0.06 * u // tightening very gently as it grows: a spiral, not a circle
  const at = (t, u) => [cx + Px * r(u) * Math.cos(t), cy + Py * r(u) * Math.sin(t)]
  const a0 = angles[0]
  const a1 = angles[angles.length - 1]
  const nodes = angles.map((t) => {
    const [x, y] = at(t, (a0 - t) / (a0 - a1 || 1))
    const deg = (((t / RAD) % 360) + 360) % 360
    // where the label sits beside its node: under the ring outward; over it inward, or above at the top
    const side = deg < 180 ? (Math.cos(t) >= 0 ? 'right' : 'left') : Math.abs(deg - 270) < 20 ? 'top' : Math.cos(t) >= 0 ? 'left' : 'right'
    return { x, y, t, side }
  })
  // the curve: from a little before the first label, through every label, then in to the ring's top
  const pts = []
  for (let j = 0; j <= 120; j++) {
    const t = a0 + 0.25 - ((a0 + 0.25 - a1) * j) / 120
    pts.push(at(t, (a0 - t) / (a0 - a1 || 1)))
  }
  const [ex, ey] = pts[pts.length - 1]
  const tx = cx
  const ty = cy - ring.ry * 0.82
  const d = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}C${(ex + 60).toFixed(1)} ${(ey - 20).toFixed(1)} ${(tx - 70).toFixed(1)} ${(ty - 30).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`
  return { nodes, d }
}

// The whole explorer in a W × H stage: the inner ring around the centre card, the spiral of n branch
// labels around it (wide enough to pass outside the ring's cards), and the caption line under it all.
// card / centre: [width, height] of a ring card and of the centre card.
export function explorerLayout(W, H, card, centre, n) {
  const cx = W / 2
  const cy = H / 2 - 24
  const ring = innerRing(cx, cy, card[0], card[1], centre[0], centre[1])
  const Px = Math.min(ring.rx + card[0] / 2 + 14, W / 2 - 6) // passes outside the cards, inside the stage
  const Py = Math.min(260, (H - 120) / 2)
  return { cx, cy, ring, spiral: outerSpiral(cx, cy, Px, Py, n, ring), captionY: cy + Py + 34 }
}

// Whether the inner ring turns. An explicit pause (motionOn false, shared with the navbar) or a
// reduced-motion preference always wins; the pointer over the ring or keyboard focus inside it only
// holds it while they last, so leaving never resumes motion the visitor paused.
export const turning = ({ open, motionOn, reduced, hover, focus }) => open && motionOn && !reduced && !hover && !focus

// The active branch's connection into the ring, across a branch change: the new connection draws in
// (DRAW, eased out) behind a bright leading edge, which then fades as the travelling light returns
// (SETTLE); the previous connection fades over FADE from however far it had drawn. A newer change takes
// over from the current state, so only the latest two connections ever show; `instant` (paused or
// reduced motion, or the scene opening) shows the final state at once.
export const LINK = { DRAW: 380, FADE: 180, SETTLE: 160 }
export function linkAt(L, t) {
  const k = Math.min(1, Math.max(0, (t - L.t0) / LINK.DRAW))
  const after = t - L.t0 - LINK.DRAW
  return {
    drawn: 1 - (1 - k) ** 3,
    edge: k < 1 ? 1 : Math.max(0, 1 - after / LINK.SETTLE),
    flow: Math.max(0, Math.min(1, after / LINK.SETTLE)),
    busy: after < LINK.SETTLE,
  }
}
// { in: { i, t0 }, out: { i, drawn, flow, t0 } | null } after a change to branch i at time now
export function connectTo(link, i, now, instant) {
  if (instant) return { in: { i, t0: -Infinity }, out: null }
  const s = linkAt(link.in, now)
  return { in: { i, t0: now }, out: { i: link.in.i, drawn: s.drawn, flow: s.flow, t0: now } }
}
// the outgoing connection's opacity at t (0 once it has gone)
export const fadeOut = (out, t) => (out ? Math.max(0, 1 - (t - out.t0) / LINK.FADE) : 0)
