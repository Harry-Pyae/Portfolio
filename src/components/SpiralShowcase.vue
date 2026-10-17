<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { projects } from '../content/projects.js'
import { motion as cfg } from '../content/motion.js'
import { motionOn, prefersReduced, openProject, heroVisible, showProject } from '../state.js'
import { FIBRES, EXIT_ENV, TAU, heroExit, flowDuration, polyLength } from '../tree.js'
import { useWisps } from '../wisps.js'
import ProjectNode from './ProjectNode.vue'

/*
 * Model: cards ride a looping track measured in "slots". Slots [0, V) are the visible column
 * (top → bottom); the rest of the track is an off-screen queue, so a card only wraps back to
 * the top while it is invisible. Offset advances with elapsed *running* time only, so pauses,
 * hidden tabs and off-screen periods never make cards jump.
 */
const count = projects.length
const V = cfg.visibleSlots
const P = Math.max(count, V + cfg.hiddenSlots)
const spacing = P / count // spreads small project counts evenly instead of duplicating cards
const mod = (a, n) => ((a % n) + n) % n
const angle = (u) => (u - 0.5) * cfg.turnsPerDescent * TAU // u = 0.5 (mid-height) faces the viewer
const ease = (e) => e * e * (3 - 2 * e)
const rand = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Upper tree: a canopy splaying above a narrow glowing waist. Below the waist the fibres settle to
// the trunk radius (zero slope at the stage bottom), where the page-level trunk continues them.
const envelope = (u) => (u < 0.5 ? 0.28 + 0.72 * (1 - 2 * u) ** 1.7 : 0.28 + (EXIT_ENV - 0.28) * ease((u - 0.5) * 2))

// A few floating particles near the trunk (CSS-animated, compositor only).
const sparks = Array.from({ length: 12 }, (_, i) => ({
  left: `${36 + rand(i + 1) * 28}%`,
  top: `${10 + rand(i + 31) * 80}%`,
  '--s': `${1.4 + rand(i + 61) * 1.8}px`,
  '--d': `${10 + rand(i + 91) * 9}s`,
  '--delay': `${-rand(i + 121) * 18}s`,
  '--dx': `${(rand(i + 151) - 0.5) * 40}px`,
}))
const wisps = useWisps(['cyan', 'blue', 'green'])

const stage = ref(null)
const arrows = ref([])
const cards = []
const dims = [] // per-card depth-dimming overlay; cards stay opaque so light never shows through text
const sizes = projects.map(() => ({ w: 0, h: 0, portY: 0 }))
const pos = projects.map(() => ({ x: 0, y: 0, s: 1 })) // card centre + scale from the last render
const box = ref({ W: 1, H: 1 })
const trunk = ref({ fibres: [], forks: [], fade: { y: 0, h: 0 }, core: null })
const tendril = ref(null)
const hoverId = ref(null)
const focusId = ref(null)
const activeId = computed(() => hoverId.value ?? focusId.value)

// Per-frame state is plain JS, never reactive.
let offset = V / 2 // first project starts front and centre
let speed = 0
let nudge = 0
let raf = 0
let last = 0
let geo = null
const boost = projects.map(() => 0) // 0 → 1 while a card is hovered/focused (lifts opacity + z)
const written = projects.map(() => ({}))
const writtenDim = projects.map(() => ({}))

const running = () => motionOn.value && activeId.value == null && !openProject.value

function frame(now) {
  raf = 0
  const dt = last ? Math.min(now - last, 50) / 1000 : 0
  last = now
  let busy = false

  if (running()) {
    speed = Math.min(1, speed + dt / cfg.resumeRampSeconds)
    offset += (dt * speed * V) / cfg.traversalSeconds
    busy = true
  } else speed = 0 // freeze exactly where we are

  if (nudge) {
    const step = Math.abs(nudge) < 0.002 ? nudge : nudge * (1 - Math.exp(-dt * 6))
    offset += step
    nudge -= step
    busy = true
  }
  offset = mod(offset, P)

  const k = 1 - Math.exp(-dt / 0.09) // ≈300 ms settle, no overshoot
  for (let i = 0; i < count; i++) {
    const target = projects[i].id === activeId.value ? 1 : 0
    if (boost[i] === target) continue
    boost[i] += (target - boost[i]) * k
    if (Math.abs(target - boost[i]) < 0.004) boost[i] = target
    busy = true
  }

  render()
  if (busy) schedule()
}

function schedule() {
  if (!raf && heroVisible.value && !document.hidden) raf = requestAnimationFrame(frame)
}
function kick() {
  if (!raf) last = 0 // first frame after any idle period gets dt = 0: no time jump
  schedule()
}
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
}

function render() {
  if (!geo) return
  const { cx, top, span, R } = geo
  const { minScale, maxScale, minOpacity } = cfg.depth
  for (let i = 0; i < count; i++) {
    const el = cards[i]
    if (!el) continue
    const { w, h } = sizes[i]
    const u = mod(offset - i * spacing, P) / V // 0 top → 1 bottom; > 1 = waiting off-screen
    const t = Math.min(u, 1)
    const edge = u >= 1 ? 0 : Math.min(1, u / cfg.fadeEdge, (1 - u) / cfg.fadeEdge)
    const a = angle(t)
    const depth = Math.cos(a) // 1 = nearest the viewer, -1 = behind the trunk
    const near = (depth + 1) / 2
    const b = boost[i]
    const fade = ease(edge)
    const opacity = fade + (1 - fade) * b // translucent only while fading in/out at the ends
    const dim = (1 - near) * (1 - minOpacity) * (1 - b) // rear cards darken, but stay solid
    const scale = minScale + (maxScale - minScale) * near
    const x = cx + Math.sin(a) * R
    const y = top + t * span
    pos[i].x = x
    pos[i].y = y
    pos[i].s = scale
    apply(el, written[i], {
      transform: `translate3d(${(x - w / 2).toFixed(2)}px,${(y - h / 2).toFixed(2)}px,0) scale(${scale.toFixed(4)})`,
      opacity: opacity.toFixed(3),
      visibility: opacity > 0.01 ? 'visible' : 'hidden',
      // the light trunk sits at z 0, beneath every card; nearer cards stack above farther ones
      zIndex: b > 0.01 ? 40 : 1 + Math.round(near * 20),
    })
    if (dims[i]) apply(dims[i], writtenDim[i], { opacity: dim.toFixed(3) })
  }
}
function apply(el, prev, next) {
  for (const key in next) if (prev[key] !== next[key]) el.style[key] = prev[key] = next[key]
}

// Measurements are cached here and only refreshed by the ResizeObserver (stage + every card).
function measure() {
  const el = stage.value
  const W = el.clientWidth
  const H = el.clientHeight
  cards.forEach((c, i) => {
    if (!c) return
    const port = c.querySelector('.port')
    sizes[i] = { w: c.offsetWidth, h: c.offsetHeight, portY: port?.offsetTop ?? 24 }
    dims[i] = c.querySelector('.oc-dim')
  })
  const w = Math.max(...sizes.map((s) => s.w))
  const h = Math.max(...sizes.map((s) => s.h))
  const grow = cfg.depth.maxScale * cfg.hoverScale // leave room so a zoomed card is never clipped
  // ...and keep the whole moving/zoomed envelope clear of the side arrows
  const side = Math.max(0, ...arrows.value.map((a) => a?.offsetWidth ?? 0)) + 8
  const R = Math.max(0, Math.min(cfg.orbitWidth / 2, (W - w * grow) / 2 - 8 - side))
  const top = (h * grow) / 2 + 10
  geo = { cx: W / 2, top, span: Math.max(0, H - 2 * top), R }
  box.value = { W, H }
  buildTrunk(W, H, R)
  render()
}

// The light trunk: static fibres (front and back halves drawn at different strengths), a few
// canopy/root forks, and a soft core glow. Rebuilt only on resize.
function buildTrunk(W, H, R) {
  const r = W < 560 ? W * 0.36 : R * cfg.trunk.radius // tiny orbit on phones: size by the stage
  const y0 = 8
  const ySpan = H - y0 // fibres end exactly on the stage's bottom edge, where the page trunk begins
  const n = W < 560 ? Math.min(4, cfg.trunk.strands) : cfg.trunk.strands
  const rate = (cfg.trunk.turns * TAU) / ySpan // twist per px, continued below the hero
  const pt = (f, u) => {
    const a = (u - 0.5) * cfg.trunk.turns * f[1] * TAU + f[2]
    return [W / 2 + Math.sin(a) * r * f[0] * envelope(u), y0 + u * ySpan, Math.cos(a)]
  }
  const flowLen = []
  const fibres = FIBRES.slice(0, n).map((f, k) => {
    let front = ''
    let back = ''
    let flow = '' // light dashes from the waist area down to the exit (no masks or filters)
    const flowPts = []
    let prevSide = null
    for (let j = 0; j <= 120; j++) {
      const [x, y, depth] = pt(f, j / 120)
      const side = depth >= 0 ? 'f' : 'b'
      const xy = `${x.toFixed(1)} ${y.toFixed(1)}`
      if (j >= 18) {
        flow += `${j > 18 ? 'L' : 'M'}${xy}`
        flowPts.push([x, y])
      }
      // each half starts a new subpath where the fibre crosses to its side
      if (side === 'f') front += `${prevSide === 'f' ? 'L' : 'M'}${xy}`
      else back += `${prevSide === 'b' ? 'L' : 'M'}${xy}`
      prevSide = side
    }
    flowLen[k] = polyLength(flowPts)
    return { front, back, flow, w: f[3], k: f[4] }
  })
  heroExit.value = {
    x: W / 2,
    y: H,
    rho: r * EXIT_ENV,
    rate,
    n,
    thetas: FIBRES.slice(0, n).map((f) => 0.5 * cfg.trunk.turns * f[1] * TAU + f[2]),
    flowLen,
  }
  const forks = [] // canopy only: the bottom continues as the trunk
  FIBRES.slice(0, Math.min(4, n)).forEach((f, k) => {
    for (const [u, up] of [[0.17, -1]]) {
      const [x, y] = pt(f, u)
      const s = k % 2 ? -1 : 1
      const reach = r * (0.32 + k * 0.08)
      forks.push({
        d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${(x + s * reach * 0.3).toFixed(1)} ${(y + up * ySpan * 0.07).toFixed(1)} ${(x + s * reach).toFixed(1)} ${(y + up * ySpan * 0.13).toFixed(1)}`,
        w: f[3] * 0.6,
        k: f[4] * 0.7,
      })
    }
  })
  trunk.value = {
    fibres,
    forks,
    fade: { y: H * 0.1, h: H }, // fades in at the top only; the bottom flows on into the page
    core: { cx: W / 2, cy: H / 2, rx: Math.max(10, r * 0.4), ry: H * 0.26 },
  }
}

// Hover / keyboard focus: grow one light branch from the trunk to the card's connection point.
watch(activeId, (id) => {
  const i = projects.findIndex((p) => p.id === id)
  if (i < 0 || !geo) return (tendril.value = null)
  const { x, y, s } = pos[i]
  const { w, h, portY } = sizes[i]
  const side = x >= geo.cx ? 'left' : 'right'
  // the card zooms from its port, so only the orbit scale moves the port
  const px = x + ((side === 'left' ? 0 : w) - w / 2) * s
  const py = y + (portY - h / 2) * s
  const out = side === 'left' ? -1 : 1 // outward normal of the port's edge
  const tx = geo.cx
  // A front card covers the trunk, so its branch leaves the trunk just above the card instead.
  const covers = Math.abs(x - tx) < (w / 2) * s * cfg.hoverScale
  const ty = covers ? y - (h / 2) * s * cfg.hoverScale - 40 : py + 54
  tendril.value = {
    id,
    port: side,
    d: `M${tx.toFixed(1)} ${ty.toFixed(1)} C${(tx + out * 22).toFixed(1)} ${(ty + (py - ty) * 0.2).toFixed(1)} ${(px + out * 42).toFixed(1)} ${(py + 4).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}`,
  }
})

function step(dir) {
  if (prefersReduced.value) {
    offset = mod(offset + nudge + dir * spacing, P)
    nudge = 0
    render()
  } else {
    nudge += dir * spacing
    kick()
  }
}

// Hover only for real mice; touch taps open the project instead of leaving a sticky hover.
const onEnter = (e, id) => e.pointerType === 'mouse' && (hoverId.value = id)
const onLeave = (id) => hoverId.value === id && (hoverId.value = null)
// Mouse clicks focus the button too; only keyboard-style focus should hold the zoom.
const onFocusIn = (e, id) => e.target.matches(':focus-visible') && (focusId.value = id)
const onFocusOut = () => (focusId.value = null)

// Horizontal swipe = previous/next. touch-action: pan-y leaves vertical scrolling to the browser.
let sx = 0
let sy = 0
let swiped = false
function onDown(e) {
  sx = e.clientX
  sy = e.clientY
  swiped = false
}
function onUp(e) {
  if (e.pointerType === 'mouse') return
  const dx = e.clientX - sx
  const dy = e.clientY - sy
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    swiped = true
    step(dx < 0 ? 1 : -1)
  }
}
function onClickCapture(e) {
  if (!swiped) return
  swiped = false
  e.preventDefault()
  e.stopPropagation()
}

const onVisibility = () => (document.hidden ? stop() : kick())
let ro
onMounted(() => {
  ro = new ResizeObserver(measure)
  ro.observe(stage.value)
  cards.forEach((c) => c && ro.observe(c)) // card heights change when fonts load or text wraps
  document.addEventListener('visibilitychange', onVisibility)
  kick()
})
onBeforeUnmount(() => {
  stop()
  ro.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
})
watch(heroVisible, (v) => (v ? kick() : stop()))
watch([activeId, motionOn, openProject], kick)
</script>

<template>
  <section class="showcase" aria-labelledby="showcase-title">
    <h2 id="showcase-title" class="sr-only">Featured projects</h2>
    <div
      ref="stage"
      class="stage"
      :style="{ '--glow': cfg.glowIntensity, '--node-zoom': cfg.hoverScale }"
      @pointerdown="onDown"
      @pointerup="onUp"
      @click.capture="onClickCapture"
    >
      <!-- Atmosphere: textured wisps and floating particles. Decorative, never interactive. -->
      <div class="atmos" aria-hidden="true">
        <div v-for="(u, i) in wisps" :key="i" class="wisp anim" :class="`hw${i}`" :style="{ backgroundImage: `url(${u})` }"></div>
        <span v-for="(s, i) in sparks" :key="i" class="float anim" :style="s"></span>
      </div>

      <!-- Static light trunk (rasterised once per resize) and its branch to the active card. -->
      <svg class="trunk" :viewBox="`0 0 ${box.W} ${box.H}`" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="trunk-halo" x="-20%" y="-5%" width="140%" height="110%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="soft-36" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="36" />
          </filter>
          <filter id="core-glow" x="-100%" y="-50%" width="300%" height="200%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <mask id="trunk-fade" maskUnits="userSpaceOnUse" x="0" y="0" :width="box.W" :height="box.H">
            <rect x="0" :y="trunk.fade.y" :width="box.W" :height="trunk.fade.h" fill="#fff" filter="url(#soft-36)" />
          </mask>
        </defs>
        <ellipse v-if="trunk.core" class="core" v-bind="trunk.core" filter="url(#core-glow)" />
        <g mask="url(#trunk-fade)">
          <!-- Same stroke layers as the page trunk (style.css), so the join is invisible. -->
          <g class="fx-back">
            <path v-for="(f, i) in trunk.fibres" :key="i" :d="f.back" :style="{ strokeWidth: f.w, opacity: f.k }" />
          </g>
          <g class="fx-halo">
            <template v-for="(f, i) in trunk.fibres.slice(0, 2)" :key="i">
              <path class="wide" :d="f.front" />
              <path class="near" :d="f.front" />
            </template>
          </g>
          <g class="fx-beam">
            <path v-for="(f, i) in trunk.fibres" :key="i" :d="f.front" :style="{ strokeWidth: f.w, opacity: f.k }" />
            <path v-for="(f, i) in trunk.forks" :key="`f${i}`" class="fork" :d="f.d" :style="{ strokeWidth: f.w, opacity: f.k }" />
          </g>
          <g class="fx-glint">
            <path v-for="(f, i) in trunk.fibres.slice(0, 2)" :key="i" :d="f.front" />
          </g>
        </g>
        <Transition name="tendril">
          <g v-if="tendril" :key="tendril.id" class="tendril">
            <path class="t-halo" :d="tendril.d" filter="url(#trunk-halo)" />
            <path class="t-beam" :d="tendril.d" pathLength="1" />
            <path class="t-pulse" :d="tendril.d" pathLength="1" />
          </g>
        </Transition>
      </svg>
      <!-- Light slowly rising along the main fibres: its own layer with no filters or masks, so the
           per-frame repaint of the moving dashes never re-runs the blurs above. The page trunk
           continues the same dash pattern and timing below the hero. -->
      <svg class="trunk" :viewBox="`0 0 ${box.W} ${box.H}`" preserveAspectRatio="none" aria-hidden="true">
        <path
          v-for="(f, i) in trunk.fibres.slice(0, 3)"
          :key="i"
          class="flow"
          :d="f.flow"
          :style="{ '--o0': '0px', animationDuration: flowDuration(i) }"
        />
      </svg>

      <ul class="orbit">
        <li
          v-for="(p, i) in projects"
          :key="p.id"
          :ref="(el) => (cards[i] = el)"
          class="orbit-card"
          @pointerenter="onEnter($event, p.id)"
          @pointerleave="onLeave(p.id)"
          @focusin="onFocusIn($event, p.id)"
          @focusout="onFocusOut"
        >
          <ProjectNode
            :project="p"
            id-prefix="hero"
            :lit="activeId === p.id"
            :port="tendril?.id === p.id ? tendril.port : 'none'"
            @open="showProject(p)"
          >
            <span class="oc-dim" aria-hidden="true"></span>
          </ProjectNode>
        </li>
      </ul>
    </div>

    <!-- Previous / next on either side, outside the moving and zoomed card envelope. -->
    <button :ref="(el) => (arrows[0] = el)" class="side-arrow prev" type="button" aria-label="Previous project" @click="step(-1)">
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
    </button>
    <button :ref="(el) => (arrows[1] = el)" class="side-arrow next" type="button" aria-label="Next project" @click="step(1)">
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
    </button>
  </section>
</template>

<style scoped>
.showcase {
  position: relative;
  min-width: 0;
}
.stage {
  --card-w: 264px;
  position: relative;
  height: clamp(540px, calc(100svh - 100px), 800px);
  isolation: isolate;
  touch-action: pan-y;
}

/* ---------- atmosphere + light trunk (decorative, never intercepts pointers) ---------- */
.atmos,
.trunk {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.trunk {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.hw0 {
  left: 24%;
  top: 20%;
  width: 52%;
  height: 60%;
  opacity: 0.5;
}
.hw1 {
  left: 26%;
  top: 0;
  width: 48%;
  height: 40%;
  opacity: 0.38;
  --dx: -5%;
  --dur: 52s;
}
.hw2 {
  left: 28%;
  top: 60%;
  width: 46%;
  height: 40%;
  opacity: 0.32;
  --dx: 6%;
  --dur: 60s;
}
.core {
  fill: var(--glow-trunk);
  opacity: calc(0.16 * var(--glow));
}
.trunk path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.t-halo {
  stroke: var(--glow-branch);
  stroke-width: 7px;
  opacity: 0.35;
}
.t-beam {
  stroke: var(--glow-branch);
  stroke-width: 1.8px;
  stroke-dasharray: 1;
  animation: grow 0.35s var(--ease) both;
}
.t-pulse {
  stroke: var(--glow-spark);
  stroke-width: 3px;
  stroke-dasharray: 0.1 1.2;
  animation: pulse 0.9s 0.25s ease-in-out both;
}
@keyframes grow {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes pulse {
  from {
    stroke-dashoffset: 0.1;
  }
  to {
    stroke-dashoffset: -1.1;
  }
}
.tendril-leave-active {
  transition: opacity 0.25s var(--ease);
}
.tendril-leave-to {
  opacity: 0;
}

/* ---------- cards: outer <li> = orbit transform (JS), inner .node = hover zoom (CSS) ---------- */
.orbit {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.orbit-card {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--card-w);
  visibility: hidden;
  will-change: transform, opacity;
}
.oc-dim {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: var(--bg);
  opacity: 0;
  pointer-events: none;
  will-change: opacity;
}

.side-arrow {
  position: absolute;
  top: 50%;
  z-index: 50;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  border-radius: 50%;
  background: var(--surface);
  color: var(--accent);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    border-color 0.3s var(--ease),
    box-shadow 0.3s var(--ease),
    color 0.3s var(--ease);
}
.prev {
  left: 0;
}
.next {
  right: 0;
}
.side-arrow:hover,
.side-arrow:focus-visible {
  border-color: var(--accent);
  color: var(--glow-pale);
  box-shadow: 0 0 16px -2px color-mix(in srgb, var(--glow-trunk) 55%, transparent);
}
.side-arrow:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 50%;
}

@media (max-width: 860px) {
  .stage {
    --card-w: 220px;
    height: 500px;
  }
  .float:nth-of-type(n + 8),
  .hw2 {
    display: none;
  }
}
</style>
