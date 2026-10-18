<script setup>
import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import { FIBRES, heroExit, litProject, pulseIn, projectsVisible, exploreShown, ease, flowDuration } from '../tree.js'

/*
 * The one continuous tree below the hero. It starts exactly where the hero's fibres leave the stage
 * (same positions, twist phase, rate, radius and flow phase), then follows a smooth centreline
 * through waypoints measured from real layout anchors:
 *   Projects trunk line → ClariFile suite node → About, Skills and interests lanes → Contact beacon →
 *   Where it began → roots.
 * Waypoints are joined by cubic curves with vertical tangents (C1 continuous), the strands twist
 * around that centreline, and every branch starts on the main strand and ends on a content port.
 * Geometry is rebuilt only when the page resizes, the hero changes or fonts load.
 */
const root = ref(null)
const box = ref({ W: 1, H: 1 })
const geo = shallowRef(null)
const rootsLit = ref(false) // one-time light through the roots when Where it began first comes into view

const rand = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
const f1 = (v) => v.toFixed(1)

// Offsets ignore transforms, so hover zoom and entrance animations never skew the geometry.
function off(el, page) {
  let x = 0
  let y = 0
  for (let e = el; e && e !== page; e = e.offsetParent) {
    // offsets are measured inside the parent's border, so add that border (e.g. a card's 1px edge)
    const op = e.offsetParent
    x += e.offsetLeft + (op && op !== page ? op.clientLeft : 0)
    y += e.offsetTop + (op && op !== page ? op.clientTop : 0)
  }
  return [x, y]
}
function at(page, sel) {
  const el = page.querySelector(sel)
  if (!el || !el.offsetParent) return null // missing or display:none at this breakpoint
  const [x, y] = off(el, page)
  return { x, y, w: el.offsetWidth, h: el.offsetHeight, el }
}

// Point and tangent on the cubic a → b with control points c1, c2.
function bez(a, c1, c2, b, t) {
  const m = 1 - t
  const k = (i) => [m * m * m * a[i] + 3 * m * m * t * c1[i] + 3 * m * t * t * c2[i] + t * t * t * b[i], 3 * m * m * (c1[i] - a[i]) + 6 * m * t * (c2[i] - c1[i]) + 3 * t * t * (b[i] - c2[i])]
  const [x, dx] = k(0)
  const [y, dy] = k(1)
  return [x, y, dx, dy]
}
// Tapered branch: the cubic as a filled outline whose width along it is wf(t).
function ribbonF(a, c1, c2, b, wf, steps = 20) {
  const l = []
  const r = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const [x, y, dx, dy] = bez(a, c1, c2, b, t)
    const len = Math.hypot(dx, dy) || 1
    const h = wf(t) / 2
    l.push(`${f1(x - (dy / len) * h)} ${f1(y + (dx / len) * h)}`)
    r.push(`${f1(x + (dy / len) * h)} ${f1(y - (dx / len) * h)}`)
  }
  return `M${l.join('L')}L${r.reverse().join('L')}Z`
}
// w0 wide at a, narrowing linearly to w1 at b.
const ribbon = (a, c1, c2, b, w0, w1, steps = 20) => ribbonF(a, c1, c2, b, (t) => w0 + (w1 - w0) * t, steps)
const cubic = (a, c1, c2, b) => `M${f1(a[0])} ${f1(a[1])}C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(b[0])} ${f1(b[1])}`

// Cubic segments with vertical end tangents, sampled every ~6px: x, y, tangent, radius, arc length.
function centreline(wps) {
  const pts = []
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i]
    const b = wps[i + 1]
    const dy = b.y - a.y
    const steps = Math.max(6, Math.ceil(Math.hypot(b.x - a.x, dy) / 6))
    for (let j = i ? 1 : 0; j <= steps; j++) {
      const t = j / steps
      const m = 1 - t
      const x = m * m * m * a.x + 3 * m * t * (m * a.x + t * b.x) + t * t * t * b.x
      const y = m * m * m * a.y + 3 * m * m * t * (a.y + dy / 2) + 3 * m * t * t * (b.y - dy / 2) + t * t * t * b.y
      const dx = 6 * m * t * (b.x - a.x) // derivative of the x cubic (control points share a.x / b.x)
      const dyt = 3 * m * m * (dy / 2) + 6 * m * t * (b.y - dy / 2 - a.y - dy / 2) + 3 * t * t * (dy / 2)
      pts.push({ x, y, dx, dy: dyt, rho: a.rho + (b.rho - a.rho) * ease(t) })
    }
  }
  let s = 0
  pts.forEach((p, i) => {
    if (i) s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)
    p.s = s
  })
  return pts
}

function measure() {
  const page = root.value?.parentElement
  const hx = heroExit.value
  if (!page || !hx) return
  const W = page.clientWidth
  const H = page.offsetHeight
  const narrow = innerWidth <= 860
  const stage = at(page, '.stage')
  const anchor = at(page, '#projects .trunk-anchor')
  const head = at(page, '#projects .section-head')
  const zone = at(page, '[data-roots]')
  if (!stage || !anchor || !head || !zone) return

  // ---- anchors measured from the layout ----
  const ax = anchor.x
  const headRight = Math.max(...[...head.el.children].map((c) => off(c, page)[0] + c.offsetWidth))
  const labels = [...page.querySelectorAll('#projects .group-label')].map((el) => {
    const [x, y] = off(el, page)
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 }
  })
  const ports = [...page.querySelectorAll('#projects [data-project]')].map((li) => {
    const [x, y] = off(li.querySelector('.port'), page)
    return { id: li.dataset.project, group: li.dataset.group, quiet: !!li.closest('.quiet'), x, y }
  })
  // Group junctions: each group label sits on the trunk; its projects branch out from beneath it.
  const junctions = {}
  page.querySelectorAll('#projects .group-label[data-group]').forEach((el) => {
    const [, y] = off(el, page)
    junctions[el.dataset.group] = y + el.offsetHeight * 0.6
  })
  const port = (name) => {
    const p = at(page, `[data-port="${name}"]`)
    return p && { x: p.x, y: p.y } // ports are centred on their own origin via translate(-50%,-50%)
  }

  // ---- waypoints: the trunk's route through the page ----
  const rhoMid = narrow ? 8 : 24
  const wps = [{ x: stage.x + hx.x, y: stage.y + hx.y, rho: hx.rho }]
  const push = (x, y, rho = rhoMid) => y > wps[wps.length - 1].y + 8 && wps.push({ x, y, rho })
  // Projects: pass beside the heading with room for the trunk's width, then settle on the trunk line.
  if (narrow) {
    // Narrow screens: slim the trunk on a short vertical run first, then swing to the side spine
    // (a wide trunk on a tight curve would fold back on itself).
    push(wps[0].x, wps[0].y + Math.min(60, (head.y - wps[0].y) * 0.35))
    push(ax, head.y - 18)
  } else if (headRight + 40 + rhoMid > ax) {
    // The heading reaches the trunk line: pass beside it, with enough height for the sideways shift
    // that the strands bend gently instead of folding at the join, settling before the first label.
    const x = headRight + 40 + rhoMid
    const roomy = wps[0].y + 1.6 * Math.abs(x - wps[0].x)
    push(x, Math.max(head.y + head.h, Math.min(roomy, (labels[0]?.y ?? Infinity) - 30)))
  } else {
    // Otherwise a short straight run out of the hero, then one swing to the first group label.
    push(wps[0].x, wps[0].y + 40, hx.rho)
  }
  // Projects: the trunk wanders through each group's label (groups sit a little left or right of centre),
  // staying under a group until its last card, then swinging across in the gap to the next group.
  labels.forEach((l, gi) => {
    const x = narrow ? ax : l.x
    push(x, l.y)
    const ys = ports.filter((p) => p.group === String(gi)).map((p) => p.y)
    if (ys.length) push(x, Math.max(...ys) + (gi === labels.length - 1 ? 70 : 20))
  })
  if (!labels.length && ports.length) push(ax, Math.max(...ports.map((p) => p.y)) + 70)
  // Current explorations: the suite node sits on the trunk (desktop); on small screens it branches off the spine.
  const suiteX = narrow ? ax : (at(page, '#explorations .suite-anchor')?.x ?? ax)
  const suiteNode = at(page, '#explorations [data-suite]')
  if (suiteNode) push(suiteX, suiteNode.y + suiteNode.h / 2)
  const appEls = [...page.querySelectorAll('#explorations [data-project]')]
  if (appEls.length) push(suiteX, Math.max(...appEls.map((li) => off(li, page)[1] + li.offsetHeight)) + 40)
  // About, Skills and Beyond the Code: the trunk runs down each lane, and where the column beside it opens
  // up (below the portrait, below the general tools, below the interests heading) it drifts out into that
  // space and back, rather than running straight down beside empty room. Each swing gets at least ~1.3×
  // its sideways shift in height, so the strands bend instead of folding.
  const WANDER = {
    about: { side: -1, from: '#about .identity' },
    skills: { side: 1, from: '#about .sky-group.general' },
    interests: { side: -1, from: '#about .interests .intro' },
  }
  for (const name of ['about', 'skills', 'interests']) {
    const lane = at(page, `[data-lane="${name}"]`)
    if (!lane) continue
    const cx = lane.x + lane.w / 2
    const bottom = lane.y + lane.h
    push(cx, lane.y)
    const open = !narrow && at(page, WANDER[name].from)
    if (open) {
      const y0 = Math.max(lane.y, open.y + open.h + 24)
      const rest = bottom - y0
      // a short lane can't fit a gentle swing (the strands would curl), so it stays straight
      const amp = Math.min(Math.abs(open.x + open.w / 2 - cx) * 0.75, rest / 4)
      if (rest > 360 && amp > 40) {
        const dx = WANDER[name].side * amp
        push(cx, y0)
        push(cx + dx, y0 + rest * 0.4)
        push(cx + dx * 0.6, y0 + rest * 0.62)
      }
    }
    push(cx, bottom)
  }
  const node = at(page, '[data-node="contact"]')
  const contactPort = port('contact')
  if (node) push(node.x, node.y, 20)
  else if (contactPort) push(ax, contactPort.y + 60)

  // Where it began: the trunk descends the centre, loosening (wider radius) as it reaches the roots.
  const began = at(page, '#beginnings')
  const bhead = at(page, '#beginnings .began-head')
  const cardPorts = [...page.querySelectorAll('#beginnings [data-project]')].map((li) => {
    const [x, y] = off(li.querySelector('.port'), page)
    return { id: li.dataset.project, x, y }
  })
  const bx = narrow ? ax : W / 2
  const T0 = (bhead ?? began ?? zone).y + 10 // transition region: strands split off between T0 and T1
  const T1 = cardPorts.length ? Math.min(...cardPorts.map((p) => p.y)) - (narrow ? 26 : 40) : zone.y
  if (began) push(bx, began.y)
  push(bx, T0, rhoMid)
  push(bx, T1 + 30, narrow ? 18 : 58)

  const cl = centreline(wps)

  // ---- strands: the hero's fibres, continued around the centreline until each splits into a root ----
  // Split points are staggered through the transition region, each on the strand's front side, so a
  // root continues the strand with the same position, direction, colour and width (no seam).
  const SPLIT = [0.5, 0.18, 0.8, 0.34, 0.66, 0.26, 0.92]
  const strands = FIBRES.slice(0, hx.n).map((f, k) => {
    const pts = []
    const sides = []
    for (const c of cl) {
      const th = hx.thetas[k] + hx.rate * f[1] * c.s
      const len = Math.hypot(c.dx, c.dy) || 1
      const breathe = 1 + 0.08 * (1 - Math.cos(c.s / 380)) // gently changing width, zero slope at the join
      const o = Math.sin(th) * c.rho * breathe * f[0]
      pts.push([c.x + (c.dy / len) * o, c.y - (c.dx / len) * o])
      sides.push(Math.cos(th) >= 0 ? 'f' : 'b')
    }
    const ty = T0 + (T1 - T0) * SPLIT[k]
    let cut = pts.findIndex((p, i) => p[1] >= ty && sides[i] === 'f' && i > 2)
    if (cut < 0) cut = pts.length - 1
    pts.length = cut + 1
    let front = ''
    let back = ''
    let full = ''
    pts.forEach(([x, y], i) => {
      const xy = `${f1(x)} ${f1(y)}`
      full += `${i ? 'L' : 'M'}${xy}`
      if (sides[i] === 'f') front += `${sides[i - 1] === 'f' ? 'L' : 'M'}${xy}`
      else back += `${sides[i - 1] === 'b' ? 'L' : 'M'}${xy}`
    })
    const end = pts[cut]
    const prev = pts[Math.max(0, cut - 3)]
    const dl = Math.hypot(end[0] - prev[0], end[1] - prev[1]) || 1
    return { front, back, full, pts, w: f[3], k: f[4], o0: hx.flowLen[k] ?? 0, end, dir: [(end[0] - prev[0]) / dl, (end[1] - prev[1]) / dl] }
  })

  // ---- branches: start on the main strand, end on a content port ----
  // Hierarchy by width: section and group limbs are thick where they leave the trunk, project and
  // skill-group branches thinner; every branch tapers to its port. Twigs are sparse and tapering.
  const main = strands[0].pts
  const onTrunk = (y) => main.reduce((b, p) => (Math.abs(p[1] - y) < Math.abs(b[1] - y) ? p : b))
  const branch = (S, P, w0, seed) => {
    const a = [S[0], S[1]]
    const b = [P.x, P.y]
    const dx = b[0] - a[0]
    const v = 0.8 + rand(seed + 7) * 0.4 // organic variation, deterministic per branch
    // leave the trunk outward early (never running alongside it), arrive level with the port
    const c1 = [a[0] + dx * 0.6 * v, a[1] + (b[1] - a[1]) * 0.2 - 4]
    const c2 = [b[0] - dx * 0.55, b[1] + 6 * v]
    let twig = null
    if (rand(seed + 31) < 0.45) {
      // a short tapering twig from part-way along, curling up and away from the trunk
      const [x, y] = bez(a, c1, c2, b, 0.35 + rand(seed + 41) * 0.25)
      const s = Math.sign(dx) || 1
      const len = 12 + rand(seed + 53) * 20
      twig = ribbon([x, y], [x + s * len * 0.2, y - len * 0.5], [x + s * len * 0.6, y - len * 0.85], [x + s * len, y - len * 0.9], 1.5, 0.2, 8)
    }
    return { d: cubic(a, c1, c2, b), r: ribbon(a, c1, c2, b, w0, 1), twig }
  }
  const pbranches = ports.map((p, k) => {
    // desktop: from the group's junction under its label; narrow: a short stub from the side spine
    const jy = !narrow && junctions[p.group]
    const S = onTrunk(jy || p.y + 34)
    return { id: p.id, quiet: p.quiet, ...branch(S, p, p.quiet ? 3 : 4.6, k) }
  })
  // The ClariFile suite: its apps branch out of the suite node, not straight from the trunk.
  const out = port('suite-out')
  const suiteIn = port('suite-in')
  const kbranches = appEls.map((li, k) => {
    const [x, y] = off(li.querySelector('.port'), page)
    if (!out) return { id: li.dataset.project, ...branch(onTrunk(y + 30), { x, y }, 4, k + 60) }
    // a fork: leave the suite node downward, then turn out to arrive level with the app's port
    const a = [out.x, out.y]
    const b = [x, y]
    const c1 = [a[0] + (b[0] - a[0]) * 0.12, a[1] + (b[1] - a[1]) * 0.7]
    const c2 = [b[0] - (b[0] - a[0]) * 0.5, b[1]]
    return { id: li.dataset.project, kid: true, d: cubic(a, c1, c2, b), r: ribbon(a, c1, c2, b, 4.2, 1), twig: null }
  })
  if (suiteIn) kbranches.push({ id: 'clarifile', ...branch(onTrunk(suiteIn.y + 34), suiteIn, 4.2, 70) })
  const sbranches = [
    ['about-identity', 4.2],
    ['about-story', 4.2],
    ['milestones', 3.2],
    ['skills-core', 2.8],
    ['skills-general', 2.8],
    ['skills-exploring', 2.8],
    ['interests', 3.4],
    ['contact', 4.2],
  ]
    .map(([name, w]) => [port(name), w])
    .filter(([p]) => p)
    .map(([p, w], k) => branch(onTrunk(p.y + 30), p, w, k + 20))

  // ---- roots: each strand continues as a primary root from its split point ----
  // Primary roots are strongest just after the split, then taper through forks into fine rootlets.
  // Two reach the earliest-project cards; the rest go deep, diagonal or out toward the page edges,
  // with uneven lengths and depths (no symmetric fan).
  const zb = zone.y + zone.h - 16
  const clampX = (x) => Math.min(W - 6, Math.max(6, x))
  const bottom = (y) => Math.min(zb, y)
  const roots = []
  const rootlets = []
  // width along a primary: from the strand's own width up to its peak over the first stretch, then tapering
  const profile = (w0, peak, tip) => (t) => (t < 0.14 ? w0 + (peak - w0) * ease(t / 0.14) : peak + (tip - peak) * ((t - 0.14) / 0.86) ** 0.8)
  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]
  function forks(a, c1, c2, b, wf, ts, seed, outward) {
    ts.forEach((t, j) => {
      const [px, py, tx, ty] = bez(a, c1, c2, b, t)
      const tl = Math.hypot(tx, ty) || 1
      const T = [tx / tl, ty / tl]
      const s = (j % 2 ? -1 : 1) * outward
      let dir = rot(T, s * (0.38 + rand(seed + j * 7) * 0.4))
      if (dir[1] < 0.3) dir = rot(T, -s * 0.3) // roots grow downward
      if (dir[1] < 0.2) dir = [dir[0] * 0.8, 0.6]
      const dl = Math.hypot(dir[0], dir[1])
      dir = [dir[0] / dl, dir[1] / dl]
      const len = (narrow ? 60 : 90) + rand(seed + j * 13) * (narrow ? 70 : 120) * (1 - t * 0.35)
      const e = [clampX(px + dir[0] * len), bottom(py + dir[1] * len)]
      // a child follows its parent's direction briefly, then diverges
      const k1 = [px + T[0] * len * 0.3, py + T[1] * len * 0.3]
      const k2 = [px + dir[0] * len * 0.65, bottom(py + dir[1] * len * 0.72) - 6]
      const w = wf(t) * 0.72
      rootlets.push(ribbon([px, py], k1, k2, e, w, 0.18, 14))
      if (len > 80) {
        // one fine rootlet off the child
        const u = 0.45 + rand(seed + j * 17) * 0.25
        const [qx, qy, qtx, qty] = bez([px, py], k1, k2, e, u)
        const ql = Math.hypot(qtx, qty) || 1
        let d2 = rot([qtx / ql, qty / ql], -s * (0.5 + rand(seed + j * 19) * 0.3))
        if (d2[1] < 0.25) d2 = [d2[0], 0.45]
        const l2 = len * (0.3 + rand(seed + j * 23) * 0.15)
        const e2 = [clampX(qx + d2[0] * l2), bottom(qy + d2[1] * l2)]
        rootlets.push(ribbon([qx, qy], [qx + (qtx / ql) * l2 * 0.3, qy + (qty / ql) * l2 * 0.3], [qx + d2[0] * l2 * 0.7, qy + d2[1] * l2 * 0.7], e2, w * (1 - u) * 0.8, 0.1, 8))
      }
    })
  }
  // targets: card roots first (the two most substantial strands), then the rest by side
  const cards = [...cardPorts].sort((p, q) => (narrow ? p.y - q.y : p.x - q.x))
  const lead = strands.slice(0, Math.min(2, cards.length)).map((s, i) => [s, i])
  if (!narrow) lead.sort((p, q) => p[0].end[0] - q[0].end[0])
  const slots = narrow
    ? [[0.62, 0.62], [0.97, 0.38]]
    : [[0.03, 0.44], [0.78, 0.8], [0.97, 0.33]]
  const rest = strands.slice(lead.length).sort((p, q) => p.end[0] - q.end[0])
  const pickSlots = rest.map((_, i) => slots[Math.round((i * (slots.length - 1)) / Math.max(1, rest.length - 1))])
  function primary(s, E, cardId, seed) {
    const a = s.end
    const L = Math.hypot(E[0] - a[0], E[1] - a[1])
    const c1 = [a[0] + s.dir[0] * L * 0.38, a[1] + Math.max(0.5, s.dir[1]) * L * 0.38]
    const c2 = cardId
      ? [E[0] + Math.sign(a[0] - E[0] || 1) * Math.min(90, L * 0.4), E[1] + 4] // arrive level with the port
      : [E[0] - (E[0] - a[0]) * 0.42, E[1] - (E[1] - a[1]) * 0.32]
    const wf = profile(s.w, Math.max(s.w * 2.4, cardId ? 4.4 : 3.4), cardId ? 1 : 0.25)
    roots.push({ id: cardId, k: s.k, halo: s === strands[0] || s === strands[1], d: cubic(a, c1, c2, E), r: ribbonF(a, c1, c2, E, wf, 36) })
    forks(a, c1, c2, E, wf, cardId ? [0.5 + rand(seed) * 0.1, 0.82] : [0.3 + rand(seed) * 0.1, 0.58 + rand(seed + 1) * 0.12, 0.84], seed, Math.sign(E[0] - bx) || 1)
  }
  lead.forEach(([s], i) => primary(s, [cards[i].x, cards[i].y], cards[i].id, 100 + i * 9))
  rest.forEach((s, i) => {
    const [fx, fy] = pickSlots[i]
    primary(s, [clampX(W * fx + (rand(i + 140) - 0.5) * W * 0.04), bottom(zone.y + zone.h * fy)], null, 120 + i * 9)
  })
  // one more primary forking from the thickest root just below its split: the deep central root
  if (roots.length) {
    const s0 = strands[0]
    const a = [s0.end[0] + s0.dir[0] * 6, s0.end[1] + 14]
    const E = [clampX(bx + (narrow ? W * 0.12 : -W * 0.085)), zb]
    // a gentle S: out one way, then back under itself, so it never reads as a plumb line
    const c1 = [a[0] + (narrow ? 30 : 70), a[1] + (E[1] - a[1]) * 0.45]
    const c2 = [E[0] + (narrow ? -20 : 80), E[1] - (E[1] - a[1]) * 0.3]
    const wf = profile(s0.w * 0.9, s0.w * 2, 0.2)
    roots.push({ id: null, k: s0.k * 0.85, halo: false, d: cubic(a, c1, c2, E), r: ribbonF(a, c1, c2, E, wf, 36) })
    forks(a, c1, c2, E, wf, [0.4, 0.64, 0.86], 170, -1)
  }

  // ---- light: particles travelling out along a few project branches ----
  const sparks = pbranches.filter((_, k) => k % 2 === 0).slice(0, narrow ? 2 : 4)

  box.value = { W, H }
  geo.value = { strands, pbranches, kbranches, sbranches, roots, rootlets, sparks }
}

let raf = 0
const schedule = () => {
  if (!raf) raf = requestAnimationFrame(() => ((raf = 0), measure()))
}
let ro
let io
onMounted(() => {
  io = new IntersectionObserver(([e]) => e.isIntersecting && ((rootsLit.value = true), io.disconnect()), { threshold: 0.3 })
  io.observe(root.value.parentElement.querySelector('#beginnings') ?? root.value.parentElement.querySelector('[data-roots]'))
  ro = new ResizeObserver(schedule)
  ro.observe(root.value.parentElement) // any reflow that moves content also resizes the page
  document.fonts?.ready.then(schedule)
  schedule()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro.disconnect()
  io.disconnect()
})
watch(heroExit, schedule)
</script>

<template>
  <div ref="root" class="tree-layer" aria-hidden="true">

    <svg v-if="geo" class="tree-svg" :viewBox="`0 0 ${box.W} ${box.H}`" :width="box.W" :height="box.H">
      <g class="fx-back">
        <path v-for="(s, i) in geo.strands" :key="i" :d="s.back" :style="{ strokeWidth: s.w, opacity: s.k }" />
      </g>
      <g class="fx-halo">
        <template v-for="(s, i) in geo.strands.slice(0, 2)" :key="i">
          <path class="wide" :d="s.front" />
          <path class="near" :d="s.front" />
        </template>
      </g>
      <g class="fx-beam">
        <path v-for="(s, i) in geo.strands" :key="i" :d="s.front" :style="{ strokeWidth: s.w, opacity: s.k }" />
      </g>
      <g class="fx-glint">
        <path v-for="(s, i) in geo.strands.slice(0, 2)" :key="i" :d="s.front" />
      </g>

      <!-- Roots: each continues a strand at the strand's own opacity; the halo and glint of the two main
           strands fade out along the first stretch, so there is no seam at the split. -->
      <g class="roots" :class="{ 'roots-lit': rootsLit }">
        <path v-for="(d, i) in geo.rootlets" :key="`o${i}`" class="rootlet" :d="d" />
        <template v-for="(r, i) in geo.roots" :key="`r${i}`">
          <g class="root-g" :class="{ lit: r.id && (litProject === r.id || pulseIn === r.id) }" :data-root="r.id || null">
            <template v-if="r.halo">
              <path class="root-halo wide" :d="r.d" pathLength="1" />
              <path class="root-halo near" :d="r.d" pathLength="1" />
            </template>
            <path class="root" :d="r.r" :style="{ opacity: r.k }" />
            <path v-if="r.halo" class="root-glint" :d="r.d" pathLength="1" />
            <path class="root-pulse" :d="r.d" pathLength="1" :style="{ animationDelay: `${0.4 + i * 1.1}s` }" />
            <path v-if="r.id" class="root-hover" :d="r.d" pathLength="1" />
          </g>
        </template>
      </g>

      <g class="sec-branches">
        <g v-for="(b, i) in geo.sbranches" :key="i">
          <path class="sb" :d="b.r" />
          <path v-if="b.twig" class="sb-twig" :d="b.twig" />
        </g>
      </g>

      <!-- ClariFile: the apps branch out of the suite node; light grows along them once on entrance. -->
      <g
        v-for="b in geo.kbranches"
        :key="`k${b.id}`"
        class="branch"
        :class="{ lit: litProject === b.id || litProject === 'clarifile' || pulseIn === b.id, inbound: pulseIn === b.id, grow: exploreShown, kid: b.kid }"
        :data-branch="b.id"
      >
        <path class="b-halo" :d="b.d" />
        <path class="b-main" :d="b.r" />
        <path v-if="b.twig" class="b-twig" :d="b.twig" />
        <path class="b-grow" :d="b.d" pathLength="1" />
        <path class="b-pulse" :d="b.d" pathLength="1" />
      </g>

      <g
        v-for="b in geo.pbranches"
        :key="b.id"
        class="branch"
        :class="{ lit: litProject === b.id || pulseIn === b.id, inbound: pulseIn === b.id, quiet: b.quiet }"
        :data-branch="b.id"
      >
        <path class="b-halo" :d="b.d" />
        <path class="b-main" :d="b.r" />
        <path v-if="b.twig" class="b-twig" :d="b.twig" />
        <path class="b-pulse" :d="b.d" pathLength="1" />
      </g>
    </svg>

    <!-- Light rising along the main strands, continuing the hero's dash pattern and timing.
         Its own layer, so the moving dashes never repaint the rest of the tree. -->
    <svg v-if="geo" class="tree-svg flow-layer" :viewBox="`0 0 ${box.W} ${box.H}`" :width="box.W" :height="box.H">
      <path
        v-for="(s, k) in geo.strands.slice(0, 3)"
        :key="k"
        class="flow"
        :d="s.full"
        :style="{ '--o0': `${s.o0}px`, animationDuration: flowDuration(k) }"
      />
    </svg>

    <div class="sparks" :class="{ 'is-offscreen': !projectsVisible }">
      <span
        v-for="(b, k) in geo?.sparks ?? []"
        :key="b.id"
        class="travel anim"
        :style="{ offsetPath: `path('${b.d}')`, animationDelay: `${k * 2.3}s` }"
      ></span>
    </div>
  </div>
</template>

<style scoped>
/* Behind all page content (z-index -1 in the root stacking context, after the sky), never interactive. */
.tree-layer {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.tree-svg {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}
.flow-layer {
  will-change: transform;
}

.b-halo,
.b-pulse,
.root-pulse {
  fill: none;
  stroke-linecap: round;
}
/* Branches and roots are tapered filled shapes (ribbon()), so width carries the hierarchy. A primary
   root keeps its strand's cyan and opacity (set inline); forks and rootlets are the quieter green. */
.root {
  fill: var(--glow-trunk);
  transition: filter 0.4s var(--ease);
}
.rootlet {
  fill: var(--glow-branch);
  opacity: 0.38;
  transition: opacity 1.6s var(--ease);
}
.roots-lit .rootlet {
  opacity: 0.46;
}
.root-halo,
.root-glint {
  fill: none;
  stroke-linecap: round;
}
/* the strand halo and glint continue a short way into the two main roots, then stop */
.root-halo {
  stroke: var(--glow-trunk);
  stroke-dasharray: 0.3 1;
}
.root-halo.wide {
  stroke-width: 11px;
  opacity: 0.06;
}
.root-halo.near {
  stroke-width: 5px;
  opacity: 0.12;
}
.root-glint {
  stroke: var(--glow-pale);
  stroke-width: 0.8px;
  stroke-dasharray: 0.22 1;
}
.root-g.lit .root {
  filter: brightness(1.35);
}
/* Root light: one gentle pass from the trunk outward and down, fading toward the tip. The roots light
   one after another the first time they come into view (never all at once), and a root lights again
   when its earliest-project card is hovered or focused. */
.root-pulse {
  fill: none;
  stroke-linecap: round;
  stroke: var(--glow-spark);
  stroke-width: 2px;
  stroke-dasharray: 0.06 1.2;
  stroke-dashoffset: 0.06;
  opacity: 0;
}
.roots-lit .root-pulse {
  animation: root-pulse 2.8s ease-in-out both;
}
/* separate element, so hovering never replays the entrance pulse */
.root-hover {
  fill: none;
  stroke: var(--glow-spark);
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-dasharray: 0.06 1.2;
  stroke-dashoffset: 0.06;
  opacity: 0;
}
.root-g.lit .root-hover {
  animation: root-pulse 1.6s ease-in-out both;
}
@keyframes root-pulse {
  from {
    stroke-dashoffset: 0.06;
    opacity: 0.85;
  }
  to {
    stroke-dashoffset: -1.06;
    opacity: 0;
  }
}
/* ClariFile entrance: light grows from the suite node toward each app once, then settles. */
.b-grow {
  fill: none;
  stroke: var(--glow-pale);
  stroke-width: 1.6px;
  stroke-linecap: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  opacity: 0;
}
.grow .b-grow {
  animation: grow-in 1.6s 0.3s var(--ease) both;
}
@keyframes grow-in {
  0% {
    stroke-dashoffset: 1;
    opacity: 0.9;
  }
  70% {
    stroke-dashoffset: 0;
    opacity: 0.9;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

/* Section branches: larger limbs, quiet at rest. */
.sb {
  fill: var(--glow-branch);
  opacity: 0.55;
}
.sb-twig,
.b-twig {
  fill: var(--glow-branch);
  opacity: 0.4;
}

/* Project branches: dim at rest; hover/focus lights the whole path and sends one pulse to the card,
   then eases back. Earlier Work uses a thinner, calmer branch. */
.b-main,
.b-twig,
.b-halo {
  transition: opacity 0.3s var(--ease);
}
.b-main {
  fill: var(--glow-branch);
  opacity: 0.62;
}
.quiet .b-main {
  opacity: 0.42;
}
.quiet .b-twig {
  opacity: 0.28;
}
.b-halo {
  stroke: var(--glow-branch);
  stroke-width: 8px;
  opacity: 0;
}
.b-pulse {
  stroke: var(--glow-spark);
  stroke-width: 3px;
  stroke-dasharray: 0.08 1.2;
  stroke-dashoffset: 0.08;
  opacity: 0;
}
.lit .b-main {
  opacity: 1;
}
.lit .b-twig {
  opacity: 0.75;
}
.lit .b-halo {
  opacity: 0.16;
}
.lit .b-pulse {
  animation: branch-pulse 0.9s ease-in-out 1;
}
@keyframes branch-pulse {
  from {
    stroke-dashoffset: 0.08;
    opacity: 1;
  }
  to {
    stroke-dashoffset: -1.1;
    opacity: 1;
  }
}
/* Opening or leaving a project: the light runs back from the card to the trunk. */
.lit.inbound .b-pulse {
  animation: branch-pulse-in 0.75s ease-in-out 1;
}
@keyframes branch-pulse-in {
  from {
    stroke-dashoffset: -1.1;
    opacity: 1;
  }
  to {
    stroke-dashoffset: 0.08;
    opacity: 1;
  }
}

/* Particle that occasionally travels from the trunk out to a card. */
.travel {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--glow-spark);
  box-shadow: 0 0 8px 2px color-mix(in srgb, var(--glow-spark) 60%, transparent);
  offset-rotate: 0deg;
  opacity: 0;
  animation: travel 8s ease-in-out infinite;
}
@keyframes travel {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }
  6% {
    opacity: 0.9;
  }
  34% {
    offset-distance: 100%;
    opacity: 0.9;
  }
  40%,
  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}
</style>
