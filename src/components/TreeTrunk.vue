<script setup>
import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import { FIBRES, heroExit, litProject, projectsVisible, ease, flowDuration } from '../tree.js'

/*
 * The one continuous tree below the hero. It starts exactly where the hero's fibres leave the stage
 * (same positions, twist phase, rate, radius and flow phase), then follows a smooth centreline
 * through waypoints measured from real layout anchors:
 *   Projects trunk line → About lane → Skills lane → Contact beacon → footer roots.
 * Waypoints are joined by cubic curves with vertical tangents (C1 continuous), the strands twist
 * around that centreline, and every branch starts on the main strand and ends on a content port.
 * Geometry is rebuilt only when the page resizes, the hero changes or fonts load.
 */
const root = ref(null)
const box = ref({ W: 1, H: 1 })
const geo = shallowRef(null)

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
    x += e.offsetLeft
    y += e.offsetTop
  }
  return [x, y]
}
function at(page, sel) {
  const el = page.querySelector(sel)
  if (!el || !el.offsetParent) return null // missing or display:none at this breakpoint
  const [x, y] = off(el, page)
  return { x, y, w: el.offsetWidth, h: el.offsetHeight, el }
}

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
    return { id: li.dataset.project, x, y }
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
  } else push(Math.max(ax, headRight + 40 + rhoMid), head.y + head.h)
  if (labels.length) push(ax, labels[0].y)
  if (ports.length) push(ax, Math.max(...ports.map((p) => p.y)) + 70)
  for (const name of ['about', 'skills']) {
    const lane = at(page, `[data-lane="${name}"]`)
    if (lane) {
      push(lane.x + lane.w / 2, lane.y)
      push(lane.x + lane.w / 2, lane.y + lane.h)
    }
  }
  const node = at(page, '[data-node="contact"]')
  const contactPort = port('contact')
  if (node) push(node.x, node.y, 20)
  else if (contactPort) push(ax, contactPort.y + 60)
  const rootX = narrow ? W * 0.32 : W / 2
  push(rootX, zone.y + 30, narrow ? 12 : 30)

  const cl = centreline(wps)

  // ---- strands: the hero's fibres, continued around the centreline ----
  const strands = FIBRES.slice(0, hx.n).map((f, k) => {
    let front = ''
    let back = ''
    let full = ''
    let prev = null
    const pts = []
    for (const c of cl) {
      const th = hx.thetas[k] + hx.rate * f[1] * c.s
      const len = Math.hypot(c.dx, c.dy) || 1
      const breathe = 1 + 0.08 * (1 - Math.cos(c.s / 380)) // gently changing width, zero slope at the join
      const o = Math.sin(th) * c.rho * breathe * f[0]
      const x = c.x + (c.dy / len) * o
      const y = c.y - (c.dx / len) * o
      const side = Math.cos(th) >= 0 ? 'f' : 'b'
      const xy = `${f1(x)} ${f1(y)}`
      full += `${pts.length ? 'L' : 'M'}${xy}`
      if (side === 'f') front += `${prev === 'f' ? 'L' : 'M'}${xy}`
      else back += `${prev === 'b' ? 'L' : 'M'}${xy}`
      prev = side
      pts.push([x, y])
    }
    return { front, back, full, pts, w: f[3], k: f[4], o0: hx.flowLen[k] ?? 0 }
  })

  // ---- branches: start on the main strand, end on a content port ----
  const main = strands[0].pts
  const onTrunk = (y) => main.reduce((b, p) => (Math.abs(p[1] - y) < Math.abs(b[1] - y) ? p : b))
  const branch = (P, drop = 34, seed = 0) => {
    const S = onTrunk(P.y + drop)
    const dx = P.x - S[0]
    const v = 0.8 + rand(seed + 7) * 0.4 // organic variation, deterministic per branch
    const mx = S[0] + dx * 0.5
    const my = (S[1] + P.y) / 2 + 3
    return {
      d: `M${f1(S[0])} ${f1(S[1])} C${f1(S[0] + dx * 0.25 * v)} ${f1(S[1] - 4)} ${f1(P.x - dx * 0.45)} ${f1(P.y + 10 * v)} ${f1(P.x)} ${f1(P.y)}`,
      fil: `M${f1(S[0])} ${f1(S[1] + 9)} C${f1(S[0] + dx * 0.4)} ${f1(S[1] + 6)} ${f1(P.x - dx * 0.3)} ${f1(P.y + 14)} ${f1(P.x)} ${f1(P.y)}`,
      twig: `M${f1(mx)} ${f1(my)} q${Math.sign(dx) * 5} -9 ${Math.sign(dx) * 14} -17`,
    }
  }
  const pbranches = ports.map((p, k) => ({ id: p.id, ...branch(p, 34, k) }))
  const sbranches = ['about-identity', 'about-story', 'skills-core', 'skills-general', 'contact']
    .map(port)
    .filter(Boolean)
    .map((p, k) => branch(p, 30, k + 20))

  // ---- roots: every fibre opens into a root spreading toward the page edges ----
  const ends = strands.map((s) => s.pts[s.pts.length - 1])
  const order = ends.map((p, k) => [p[0], k]).sort((a, b) => a[0] - b[0]).map((e) => e[1])
  const roots = []
  const offshoots = []
  order.forEach((k, idx) => {
    const t = order.length === 1 ? 0.5 : idx / (order.length - 1)
    const [sx, sy] = ends[k]
    const ex = Math.min(W - 4, Math.max(4, W * (0.01 + 0.98 * t) + (rand(k + 3) - 0.5) * W * 0.05))
    const ey = zone.y + zone.h * (0.42 + 0.45 * rand(k + 11))
    const c1 = [sx, sy + (ey - sy) * 0.55]
    const c2 = [ex - (ex - sx) * 0.38, ey - 24]
    roots.push({ d: `M${f1(sx)} ${f1(sy)} C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(ex)} ${f1(ey)}`, w: FIBRES[k][3] * 1.1 })
    // two offshoots per root, curling outward and down, shorter toward the tips
    for (const [u, len] of [[0.5, 70], [0.78, 42]]) {
      const m = 1 - u
      const px = m * m * m * sx + 3 * m * m * u * c1[0] + 3 * m * u * u * c2[0] + u * u * u * ex
      const py = m * m * m * sy + 3 * m * m * u * c1[1] + 3 * m * u * u * c2[1] + u * u * u * ey
      const dir = ex >= sx ? 1 : -1
      const l = len * (0.7 + rand(k * 5 + u * 10) * 0.6)
      offshoots.push(`M${f1(px)} ${f1(py)} q${f1(dir * l * 0.3)} ${f1(l * 0.45)} ${f1(dir * l * 0.85)} ${f1(l * 0.5)}`)
    }
  })

  // ---- light: particles travelling out along a few project branches ----
  const sparks = pbranches.filter((_, k) => k % 2 === 0).slice(0, narrow ? 2 : 4)

  box.value = { W, H }
  geo.value = { strands, pbranches, sbranches, roots, offshoots, sparks }
}

let raf = 0
const schedule = () => {
  if (!raf) raf = requestAnimationFrame(() => ((raf = 0), measure()))
}
let ro
onMounted(() => {
  ro = new ResizeObserver(schedule)
  ro.observe(root.value.parentElement) // any reflow that moves content also resizes the page
  document.fonts?.ready.then(schedule)
  schedule()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro.disconnect()
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

      <g class="roots">
        <path v-for="(r, i) in geo.roots" :key="`b${i}`" class="root-base" :d="r.d" pathLength="1" :style="{ strokeWidth: r.w * 1.8 }" />
        <path v-for="(r, i) in geo.roots" :key="`r${i}`" class="root" :d="r.d" :style="{ strokeWidth: r.w }" />
        <path v-for="(d, i) in geo.offshoots" :key="`o${i}`" class="offshoot" :d="d" />
      </g>

      <g class="sec-branches">
        <g v-for="(b, i) in geo.sbranches" :key="i">
          <path class="sb-fil" :d="b.fil" />
          <path class="sb" :d="b.d" />
          <path class="sb-twig" :d="b.twig" />
        </g>
      </g>

      <g
        v-for="(b, k) in geo.pbranches"
        :key="b.id"
        class="branch"
        :class="{ lit: litProject === b.id }"
        :data-branch="b.id"
      >
        <path class="b-halo" :d="b.d" />
        <path class="b-fil" :d="b.fil" />
        <path class="b-main" :d="b.d" />
        <path class="b-twig" :d="b.twig" />
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

.roots path,
.sec-branches path,
.branch path {
  fill: none;
  stroke-linecap: round;
}
.root-base {
  stroke: var(--glow-trunk);
  stroke-dasharray: 0.35 1; /* thicker near the trunk only: a tapering root */
  opacity: 0.55;
}
.root {
  stroke: var(--glow-trunk);
  opacity: 0.6;
}
.offshoot {
  stroke: var(--glow-branch);
  stroke-width: 0.7px;
  opacity: 0.45;
}

/* Section branches: thinner than the trunk, quiet at rest. */
.sb {
  stroke: var(--glow-branch);
  stroke-width: 1.2px;
  opacity: 0.6;
}
.sb-fil {
  stroke: var(--glow-branch);
  stroke-width: 0.6px;
  opacity: 0.3;
}
.sb-twig {
  stroke: var(--glow-branch);
  stroke-width: 0.7px;
  opacity: 0.35;
}

/* Project branches: dim at rest; hover/focus lights the whole path and sends one pulse to the card. */
.b-main,
.b-fil,
.b-twig,
.b-halo {
  stroke: var(--glow-branch);
  transition:
    opacity 0.3s var(--ease),
    stroke-width 0.3s var(--ease);
}
.b-main {
  stroke-width: 1.4px;
  opacity: 0.65;
}
.b-fil {
  stroke-width: 0.7px;
  opacity: 0.32;
}
.b-twig {
  stroke-width: 0.8px;
  opacity: 0.35;
}
.b-halo {
  stroke-width: 7px;
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
  stroke-width: 2px;
  opacity: 1;
}
.lit .b-fil,
.lit .b-twig {
  opacity: 0.7;
}
.lit .b-halo {
  opacity: 0.18;
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
