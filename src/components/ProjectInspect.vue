<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { openProject, showProject, closeProject, motionOn, prefersReduced } from '../state.js'
import { litProject, pulseIn } from '../tree.js'
import { profile } from '../content/profile.js'
import { projects, suites, categories, appsOf, story } from '../content/projects.js'
import { soundTo } from '../audio.js'
import { useWisps } from '../wisps.js'
import ProjectArt from './ProjectArt.vue'
import SoundControls from './SoundControls.vue'

/*
 * Project inspection: a scene over the portfolio, which stays mounted (and keeps its scroll, carousel
 * phase and tree) underneath. A native modal <dialog> gives the focus trap and Escape. Around the
 * readable case study, the inspected project's card rests glowing at the centre while every other
 * project travels one slow circular orbit around it: right foreground → across the front to the left
 * → behind the centre → back to the right. Each card keeps its own place on the ring.
 * Each project is a history entry (#/project/<id>), so Back/Forward and direct links work.
 */
const ENTER = 900 // ms; light runs to the trunk, the card pushes in, the orbit unfolds from a column
const LEAVE = 420 // ms; the scene recedes, then the portfolio finishes settling on its own
const SWAP = 700 // ms; Previous/Next: one card returns to its place on the ring, the next comes forward
const REV = 80 // seconds per orbit revolution

// Everything inspectable, in page order (the suite sits before its apps). Same objects as the page.
const all = categories.flatMap((c) => [...suites.filter((x) => x.category === c.name), ...projects.filter((p) => p.category === c.name)])
const byId = (id) => all.find((x) => x.id === id)
const labelOf = (p) => p.status ?? categories.find((c) => c.name === p.category)?.label ?? ''

const dlg = ref(null)
const sheet = ref(null)
const stage = ref(null)
const shown = ref(null) // stays set while the scene recedes
const phase = ref('closed') // 'enter' | 'open' | 'leave' | 'closed'
const simple = ref(false) // reduced motion or paused motion: plain fades, no travel
const media = ref(null)
const vid = ref(null)
const autoplay = ref(false)
const wisps = useWisps(['cyan', 'blue', 'green'])
let opener = null
let ghost = null
let timer = 0

// ---------- case study content (unchanged from the former details dialog) ----------
const canPreview = () => motionOn.value && !prefersReduced.value && matchMedia('(hover: hover) and (pointer: fine)').matches
const apps = computed(() => (shown.value?.apps ? appsOf(shown.value) : null))
const parentSuite = computed(() => suites.find((x) => x.id === shown.value?.suite))
const storyHere = computed(() => story.published && story.project && story.project === shown.value?.id)
function load(p) {
  shown.value = p
  media.value = p.video ? 'video' : (p.gallery?.[0] ?? null)
  autoplay.value = canPreview()
}

// ---------- history: one entry per inspected project ----------
const ROUTE = /^#\/project\/([\w-]+)$/
let fromHistory = false
let goingBack = false // a history step back is under way (ignore repeated Escape)
const depth = () => (history.state?.inspect ? (history.state.depth ?? 0) : 0)
function fromLocation() {
  goingBack = false
  const m = location.hash.match(ROUTE)
  const p = m ? byId(m[1]) : null
  if ((p?.id ?? null) === (openProject.value?.id ?? null)) return
  fromHistory = true
  openProject.value = p
}
// Close: step back to the page entry the visitor came from (keeps Back/Forward truthful).
function requestClose() {
  const d = depth()
  if (goingBack) return
  if (d > 0) {
    goingBack = true
    history.go(-d)
  }
  else {
    history.replaceState(null, '', location.pathname + location.search)
    closeProject()
  }
}
const step = (dir) => {
  const i = all.findIndex((x) => x.id === shown.value?.id)
  showProject(all[(i + dir + all.length) % all.length])
}

watch(openProject, (p, prev) => {
  if (p && !fromHistory) history.pushState({ inspect: p.id, depth: depth() + 1 }, '', `#/project/${p.id}`)
  fromHistory = false
  soundTo(p?.id ?? null)
  if (p && (phase.value === 'closed' || phase.value === 'leave')) enter(p)
  else if (p) swap(p)
  else if (prev) leave()
})

// ---------- transitions ----------
const visible = (el) => {
  if (!el?.isConnected || el.checkVisibility?.({ checkVisibilityCSS: true, visibilityProperty: true }) === false) return null
  const r = el.getBoundingClientRect()
  return r.width && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null
}
// The card the visitor chose: the focused one, else any visible card for that project.
function cardFor(id) {
  const a = document.activeElement?.closest?.('.node')
  if (a && a.getAttribute('aria-describedby')?.endsWith(`-${id}-desc`)) return a
  return [...document.querySelectorAll(`.page .node[aria-describedby$="-${id}-desc"]`)].find(visible) ?? null
}

async function enter(p) {
  clearTimeout(timer)
  ghost?.cancel()
  const wasLeaving = phase.value === 'leave'
  load(p)
  if (!wasLeaving) opener = document.activeElement !== document.body ? document.activeElement : null
  simple.value = prefersReduced.value || !motionOn.value
  phase.value = 'enter'
  const from = simple.value ? null : visible(cardFor(p.id)) && cardFor(p.id)
  litProject.value = p.id
  pulseIn.value = p.id // light runs from the card back to the trunk
  const html = document.documentElement
  html.classList.toggle('inspect-simple', simple.value)
  if (from) {
    // the portfolio pushes toward the chosen card as it fades away
    const r = from.getBoundingClientRect()
    const pg = document.querySelector('.page').getBoundingClientRect()
    html.style.setProperty('--push-origin', `${r.left + r.width / 2 - pg.left}px ${r.top + r.height / 2 - pg.top}px`)
  }
  html.classList.add('inspecting')
  await nextTick()
  if (!dlg.value.open) dlg.value.showModal()
  sheet.value.scrollTop = 0
  measure()
  centreOn(p.id, wasLeaving && !simple.value ? SWAP : 0)
  morphTo(1, simple.value || wasLeaving ? 0 : ENTER)
  if (from && !wasLeaving) flyGhost(from, false)
  timer = setTimeout(settle, simple.value ? 250 : ENTER)
}
// End of the entrance, or the visitor skipped it (click, key).
function settle() {
  if (phase.value !== 'enter') return
  clearTimeout(timer)
  ghost?.finish()
  morphTo(1, 0)
  phase.value = 'open'
  pulseIn.value = null
}
function swap(p) {
  settle()
  // a button inside the outgoing case study is about to disappear: continue from Return
  if (document.activeElement?.closest?.('.inner')) dlg.value.querySelector('.back')?.focus()
  load(p)
  litProject.value = p.id
  centreOn(p.id, simple.value ? 0 : SWAP)
  nextTick(() => sheet.value && (sheet.value.scrollTop = 0))
}
function leave() {
  settle()
  clearTimeout(timer)
  phase.value = 'leave'
  vid.value?.pause()
  const id = shown.value?.id
  pulseIn.value = id ?? null // light travels back toward the trunk
  litProject.value = id ?? null
  document.documentElement.classList.remove('inspecting')
  morphTo(0, simple.value ? 0 : LEAVE)
  const back = !simple.value && visible(cardFor(id))
  if (back) flyGhost(cardFor(id), true)
  timer = setTimeout(done, simple.value ? 200 : LEAVE)
}
function done() {
  clearTimeout(timer)
  ghost?.finish()
  phase.value = 'closed'
  if (dlg.value?.open) dlg.value.close()
  stop()
  shown.value = null
  setTimeout(() => {
    pulseIn.value = null
    if (!openProject.value) litProject.value = null
  }, 600)
  opener?.focus?.({ preventScroll: true })
  opener = null
}

// A copy of the chosen card flies toward the viewer (and back, on return).
function flyGhost(el, back) {
  const r = el.getBoundingClientRect()
  const g = el.cloneNode(true)
  g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
  g.removeAttribute('aria-describedby')
  g.setAttribute('aria-hidden', 'true')
  g.inert = true
  g.classList.add('ghost')
  Object.assign(g.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: '0', zIndex: '90' })
  dlg.value.append(g)
  const tx = innerWidth / 2 - (r.left + r.width / 2)
  const ty = innerHeight / 2 - (r.top + r.height / 2)
  const kf = [
    { transform: 'none', opacity: 1 },
    { transform: `translate(${tx * 0.6}px, ${ty * 0.6}px) scale(1.35)`, opacity: 0.9, offset: 0.55 },
    { transform: `translate(${tx}px, ${ty}px) scale(1.8)`, opacity: 0 },
  ]
  ghost?.cancel()
  // on return the copy fades as it lands, so it never doubles the real card
  if (back) kf.reverse().splice(2, 1, { transform: 'none', opacity: 0 })
  ghost = g.animate(kf, { duration: back ? LEAVE : 700, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'both' })
  const a = ghost
  a.finished.catch(() => {}).finally(() => g.remove())
}

// ---------- the orbit: plain JS per frame, transforms and opacity only ----------
const cards = []
let geo = null
let phi = 0
let speed = 0
let hold = false // hover / focus inside the orbit
let m = 0 // 0 = the hero's vertical column, 1 = the orbit
let mFrom = 0
let mTo = 0
let mStart = 0
let mDur = 0
const centre = all.map(() => 0) // per card: 0 = its place on the ring, 1 = the centre
let cFrom = centre.slice()
const cTo = centre.slice()
let cStart = 0
let cDur = 0
let raf = 0
let last = 0
const written = new Map()
const ease = (e) => e * e * (3 - 2 * e)
// The orbit's own tree: a parent bough around the ring and a branch out to every card, drawn in two
// SVG layers (behind the core / in front of it) from the same phi and card positions as the cards.
const boughLayers = {} // 'rear' | 'front' → svg element
let bough = null // cached path elements per layer, gathered in measure()

function measure() {
  const el = stage.value
  if (!el || !cards[0]) return
  const W = el.clientWidth
  const H = el.clientHeight
  const cw = cards[0].offsetWidth
  const ch = cards[0].offsetHeight
  const rx = Math.max(40, W / 2 - (cw / 2) * 1.02 - 6)
  // a narrow stage tilts the orbit more open (taller), so the ring still shows between the cards
  const tilt = Math.min(1.5, Math.max(0.66, 0.66 + (580 - W) / 160))
  const ry = Math.max(10, Math.min(H / 2 - ch / 2 - 6, rx * tilt))
  geo = { W, H, cx: W / 2, cy: H / 2, rx, ry, cw, ch, colH: Math.max(0, H - ch - 12) }
  bough = {}
  for (const k of ['rear', 'front']) {
    const svg = boughLayers[k]
    if (!svg) continue
    const q = (sel) => [...svg.querySelectorAll(sel)]
    bough[k] = { svg, strands: q('.strand'), base: q('.b-base'), line: q('.b-line'), twig: q('.o-twig') }
  }
  render()
}
function morphTo(target, ms) {
  mFrom = m
  mTo = target
  mStart = performance.now()
  mDur = ms
  if (!ms) m = target
  kick()
}
function centreOn(id, ms) {
  cFrom = centre.slice()
  all.forEach((p, i) => (cTo[i] = p.id === id ? 1 : 0))
  cStart = performance.now()
  cDur = ms
  if (!ms) cTo.forEach((v, i) => (centre[i] = v))
  kick()
}
function frame(t) {
  raf = 0
  const dt = last ? Math.min(t - last, 50) / 1000 : 0
  last = t
  let busy = false
  const turning = phase.value !== 'closed' && !hold && motionOn.value && !prefersReduced.value
  // eases out when held or paused, back in afterwards; slows down while the scene recedes
  const target = turning ? (phase.value === 'leave' ? 0.3 : 1) : 0
  speed += (target - speed) * Math.min(1, dt * 3)
  if (Math.abs(target - speed) < 0.002) speed = target
  if (speed) {
    phi += (dt * speed * Math.PI * 2) / REV
    busy = true
  }
  if (target !== speed) busy = true
  if (m !== mTo) {
    const k = mDur ? Math.min(1, (t - mStart) / mDur) : 1
    m = mFrom + (mTo - mFrom) * ease(k)
    if (k >= 1) m = mTo
    busy = true
  }
  if (centre.some((v, i) => v !== cTo[i])) {
    const k = cDur ? Math.min(1, (t - cStart) / cDur) : 1
    for (let i = 0; i < centre.length; i++) centre[i] = k >= 1 ? cTo[i] : cFrom[i] + (cTo[i] - cFrom[i]) * ease(k)
    busy = true
  }
  render()
  if (busy) kick()
}
function kick() {
  if (!raf && phase.value !== 'closed' && !document.hidden) {
    if (!speed && m === mTo && centre.every((v, i) => v === cTo[i])) last = 0
    raf = requestAnimationFrame(frame)
  }
}
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
  last = 0
}
function render() {
  if (!geo) return
  const { cx, cy, rx, ry, cw, ch, colH } = geo
  const n = all.length
  const e = ease(Math.max(0, Math.min(1, m)))
  const st = []
  for (let i = 0; i < n; i++) {
    const el = cards[i]
    if (!el) continue
    const a = phi + Math.PI / 4 + (i * Math.PI * 2) / n
    const z = Math.sin(a) // 1 = nearest the viewer, -1 = behind the core
    // the hero's vertical spiral (narrow column) unfolds into the orbit
    const colX = cx + rx * 0.22 * Math.cos(a)
    const colY = cy - colH / 2 + (colH * i) / Math.max(1, n - 1)
    // the inspected card rests at the centre; the others keep to the ring
    const w = ease(centre[i])
    const near = (z + 1) / 2
    const ox = cx + rx * Math.cos(a) * (1 - w)
    const oy = cy + ry * z * (1 - w)
    const x = colX + (ox - colX) * e
    const y = colY + (oy - colY) * e
    const s = (0.56 + 0.44 * near + (1.1 - 0.56 - 0.44 * near) * w) * (0.8 + 0.2 * e)
    const o = (0.28 + 0.72 * near + (1 - 0.28 - 0.72 * near) * w) * Math.min(1, m * 1.4)
    const next = {
      transform: `translate3d(${(x - cw / 2).toFixed(1)}px,${(y - ch / 2).toFixed(1)}px,0) scale(${s.toFixed(3)})`,
      opacity: o.toFixed(3),
      // the centre card is never covered; the glow (20) sits between the far and near sides of the ring
      zIndex: w > 0.5 ? 45 : z > 0 ? 30 + Math.round(z * 9) : 10 + Math.round((z + 1) * 9),
      visibility: o > 0.02 ? 'visible' : 'hidden',
    }
    const prev = written.get(el) ?? {}
    for (const k in next) if (prev[k] !== next[k]) el.style[k] = prev[k] = next[k]
    written.set(el, prev)
    st[i] = { a, x, y, z, w }
  }
  renderBoughs(st, Math.min(1, m * 1.4) * e)
}

// ---------- the orbit's tree ----------
const TAU = Math.PI * 2
const f1 = (v) => v.toFixed(1)
const setD = (el, d) => el && el.__d !== d && el.setAttribute('d', (el.__d = d))
// A point on the parent bough: inside the cards' ring, gently irregular, its bumps travelling with phi
// so they keep their place relative to the cards. depth > 0 = in front of the core.
function ringPt(t, fine) {
  const { cx, cy, rx, ry } = geo
  const u = t - phi
  const k = 0.8 + 0.05 * Math.sin(3 * u + 1.3) + 0.03 * Math.sin(5 * u + 0.4) + (fine ? 0.035 * Math.sin(2 * u + 2.1) : 0)
  return [cx + rx * k * Math.cos(t), cy + ry * k * Math.sin(t), Math.sin(t)]
}
// One strand of the parent bough, split into the halves behind and in front of the core.
function strandPaths(fine) {
  const out = { rear: '', front: '' }
  let prev = null
  for (let j = 0; j <= 72; j++) {
    const [x, y, z] = ringPt((j / 72) * TAU, fine)
    const side = z >= 0 ? 'front' : 'rear'
    // where the strand changes side, the half it leaves runs on to this point, so the halves meet
    if (prev && prev !== side) out[prev] += `L${f1(x)} ${f1(y)}`
    out[side] += `${prev === side ? 'L' : 'M'}${f1(x)} ${f1(y)}`
    prev = side
  }
  return out
}
function renderBoughs(st, fade) {
  if (!bough?.rear || !bough?.front) return
  const narrow = geo.W < 480 // phones: no fine strand or twigs
  for (const k of ['rear', 'front']) {
    const v = ((k === 'rear' ? 0.6 : 1) * fade).toFixed(3)
    if (bough[k].svg.__o !== v) bough[k].svg.style.opacity = bough[k].svg.__o = v
  }
  const main = strandPaths(false)
  const fine = narrow ? { rear: '', front: '' } : strandPaths(true)
  for (const k of ['rear', 'front']) {
    setD(bough[k].strands[0], main[k])
    setD(bough[k].strands[1], fine[k])
  }
  for (let i = 0; i < st.length; i++) {
    const c = st[i]
    if (!c) continue
    // leaves the bough a little behind its card; the inspected card's branch swings round to the
    // front of the ring, so it stays short while the card rests at the centre
    const home = Math.PI / 2 + TAU * Math.round((c.a - Math.PI / 2) / TAU)
    const ts = (c.a - 0.42) * (1 - c.w) + home * c.w
    const [sx, sy] = ringPt(ts, false)
    const tx = -geo.rx * Math.sin(ts)
    const ty = geo.ry * Math.cos(ts)
    const tl = Math.hypot(tx, ty) || 1
    const L = Math.hypot(c.x - sx, c.y - sy) || 1
    const bend = (i % 2 ? 1 : -1) * L * 0.12 // gentle asymmetry, never a straight spoke
    const c1x = sx + (tx / tl) * L * 0.45
    const c1y = sy + (ty / tl) * L * 0.45
    const c2x = c.x + (sx - c.x) * 0.4 + ((sy - c.y) / L) * bend
    const c2y = c.y + (sy - c.y) * 0.4 - ((sx - c.x) / L) * bend
    const d = `M${f1(sx)} ${f1(sy)}C${f1(c1x)} ${f1(c1y)} ${f1(c2x)} ${f1(c2y)} ${f1(c.x)} ${f1(c.y)}`
    // a small tapering twig off the middle of some branches
    let twig = ''
    if (!narrow && i % 3 !== 1 && L > 40) {
      const t = 0.55
      const mt = 1 - t
      const bx = mt * mt * mt * sx + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * c.x
      const by = mt * mt * mt * sy + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * c.y
      const nx = -(c.y - sy) / L
      const ny = (c.x - sx) / L
      const sg = i % 2 ? 1 : -1
      const len = 10 + (i % 4) * 3
      twig = `M${f1(bx)} ${f1(by)}q${f1(sg * nx * len * 0.6)} ${f1(sg * ny * len * 0.6 - 4)} ${f1(sg * nx * len)} ${f1(sg * ny * len - 9)}`
    }
    // drawn in its card's layer: behind the core when the card is, in front when it is
    const on = c.w > 0.5 || c.z > 0 ? 'front' : 'rear'
    const off = on === 'front' ? 'rear' : 'front'
    for (const part of ['base', 'line']) {
      setD(bough[on][part][i], d)
      setD(bough[off][part][i], '')
    }
    setD(bough[on].twig[i], twig)
    setD(bough[off].twig[i], '')
  }
}
const holdOn = () => ((hold = true), kick())
const holdOff = () => ((hold = false), kick())

// ---------- input ----------
function onCancel(e) {
  e.preventDefault() // Escape: animate out (or finish an exit already under way)
  phase.value === 'leave' ? done() : requestClose()
}
function onKey(e) {
  if (phase.value === 'enter') settle()
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('video, input, textarea, select')) return
  if (e.key === 'ArrowRight') step(1)
  else if (e.key === 'ArrowLeft') step(-1)
  else return
  e.preventDefault()
}
const onPointer = () => phase.value === 'enter' && settle()
// A button that started a switch is replaced with the content: focus continues from Return.
const keepFocus = () => dlg.value?.open && !dlg.value.contains(document.activeElement) && dlg.value.querySelector('.back')?.focus()
// The dialog closed by other means (e.g. the browser): keep state in step.
const onClose = () => phase.value !== 'closed' && phase.value !== 'leave' && openProject.value && requestClose()

let ro
const onVisibility = () => (document.hidden ? stop() : kick())
onMounted(() => {
  ro = new ResizeObserver(() => phase.value !== 'closed' && measure())
  ro.observe(stage.value)
  addEventListener('popstate', fromLocation)
  document.addEventListener('visibilitychange', onVisibility)
  // Direct link to a project: a portfolio entry underneath, so closing (or Back) lands on the page.
  const m0 = location.hash.match(ROUTE)
  if (m0 && byId(m0[1])) {
    history.replaceState(null, '', location.pathname + location.search)
    showProject(byId(m0[1]))
  }
})
onBeforeUnmount(() => {
  stop()
  ro.disconnect()
  removeEventListener('popstate', fromLocation)
  document.removeEventListener('visibilitychange', onVisibility)
})
watch([motionOn, prefersReduced], kick)
</script>

<template>
  <dialog
    ref="dlg"
    class="inspect"
    :class="[`is-${phase}`, { simple }]"
    aria-labelledby="modal-title"
    @cancel="onCancel"
    @close="onClose"
    @keydown="onKey"
    @pointerdown="onPointer"
  >
    <!-- The orbit: every project around a nebula core. Decorative motion; each card is a real button. -->
    <section ref="stage" class="stage" aria-label="Other projects" @pointerenter="holdOn" @pointerleave="holdOff" @focusin="holdOn" @focusout="holdOff">
      <div class="core" aria-hidden="true">
        <div v-for="(u, i) in wisps" :key="i" class="wisp anim" :class="`cw${i}`" :style="{ backgroundImage: `url(${u})` }"></div>
        <span class="glow"></span>
      </div>
      <!-- The orbit's own tree, behind the core and in front of it; its geometry is written per frame. -->
      <svg v-for="k in ['rear', 'front']" :key="k" :ref="(el) => (boughLayers[k] = el)" class="boughs" :class="k" aria-hidden="true">
        <path class="strand" />
        <path class="strand fine" />
        <g v-for="p in all" :key="p.id">
          <path class="b-base" pathLength="1" />
          <path class="b-line" />
          <path class="o-twig" pathLength="1" />
        </g>
      </svg>
      <ul class="ring">
        <li v-for="(p, i) in all" :key="p.id" :ref="(el) => (cards[i] = el)" class="o-card">
          <button
            type="button"
            class="o-node"
            :class="{ current: shown?.id === p.id }"
            :aria-current="shown?.id === p.id ? 'true' : null"
            :aria-label="`Inspect ${p.title}`"
            @click="showProject(p)"
          >
            <ProjectArt :project="p" glyph class="o-sym" />
            <span class="o-text">
              <span class="o-title">{{ p.title }}</span>
              <span class="o-label">{{ labelOf(p) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <!-- The case study: the visual focus, solid and readable, never under the orbit. -->
    <article ref="sheet" class="sheet">
      <header class="bar">
        <button class="close back" type="button" autofocus @click="requestClose">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
          </svg>
          Return to portfolio
        </button>
        <div class="nav-btns">
          <button type="button" class="step" aria-label="Previous project" @click="step(-1)">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
          <button type="button" class="step" aria-label="Next project" @click="step(1)">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
          <SoundControls />
        </div>
      </header>

      <Transition name="swap" mode="out-in" @after-enter="keepFocus">
        <div v-if="shown" :key="shown.id" class="inner">
          <div v-if="media" class="media">
            <video
              v-if="media === 'video'"
              ref="vid"
              :key="shown.id"
              :src="shown.video"
              :poster="shown.image"
              :autoplay="autoplay"
              muted
              playsinline
              controls
              preload="none"
              :aria-label="`${shown.title} walkthrough video`"
            ></video>
            <img v-else :src="media" :alt="`${shown.title} screenshot ${shown.gallery.indexOf(media) + 1}`" />
          </div>
          <ProjectArt v-else :project="shown" :alt="`${shown.title} preview`" class="banner" />
          <p v-if="shown.videoNote" class="media-note">{{ shown.videoNote }}</p>
          <div v-if="media && (shown.gallery?.length ?? 0) + (shown.video ? 1 : 0) > 1" class="thumbs" role="group" aria-label="Project media">
            <button v-if="shown.video" type="button" :aria-pressed="media === 'video'" @click="media = 'video'">
              <img :src="shown.image" alt="" />
              <span class="play" aria-hidden="true">▶</span>
              <span class="sr-only">Walkthrough video</span>
            </button>
            <button v-for="(g, i) in shown.gallery" :key="g" type="button" :aria-pressed="media === g" @click="media = g">
              <img :src="g" alt="" loading="lazy" />
              <span class="sr-only">Screenshot {{ i + 1 }}</span>
            </button>
          </div>

          <div class="body">
            <p class="meta">
              {{ apps ? 'Suite' : shown.category }}<template v-if="shown.year"> · {{ shown.year }}</template>
              <span v-if="shown.status" class="status">{{ shown.status }}</span>
            </p>
            <h2 id="modal-title">{{ shown.title }}</h2>
            <p class="lead">{{ shown.tagline }}</p>
            <p v-if="shown.context" class="context">{{ shown.context }}</p>
            <button v-if="parentSuite" type="button" class="suite-link" @click="showProject(parentSuite)">Part of the {{ parentSuite.title }} suite</button>

            <template v-if="apps">
              <h3 class="sub">Applications</h3>
              <ul class="apps">
                <li v-for="a in apps" :key="a.id">
                  <button type="button" class="app" @click="showProject(a)">
                    <span class="app-title">{{ a.title }}</span>
                    <span class="app-line">{{ a.tagline }}</span>
                    <span class="app-status">{{ a.status }}</span>
                  </button>
                </li>
              </ul>
              <div v-if="shown.integration" class="integration">
                <h3 class="sub">{{ shown.integration.label }}</h3>
                <p>{{ shown.integration.text }}</p>
              </div>
            </template>

            <dl v-if="shown.problem || shown.solution" class="details">
              <div v-if="shown.problem">
                <dt>Problem</dt>
                <dd>{{ shown.problem }}</dd>
              </div>
              <div v-if="shown.solution">
                <dt>Solution</dt>
                <dd>{{ shown.solution }}</dd>
              </div>
            </dl>

            <template v-if="shown.highlights?.length">
              <h3 class="sub">Highlights</h3>
              <ul class="highlights">
                <li v-for="h in shown.highlights" :key="h">{{ h }}</li>
              </ul>
            </template>

            <section v-if="storyHere" class="story" aria-labelledby="story-title">
              <h3 id="story-title" class="sub">{{ story.title }}</h3>
              <template v-for="[head, text] in story.parts" :key="head">
                <h4>{{ head }}</h4>
                <p>{{ text }}</p>
              </template>
            </section>

            <template v-if="shown.contribution">
              <h3 class="sub">{{ profile.name }}’s contribution</h3>
              <p class="contribution">{{ shown.contribution }}</p>
            </template>

            <template v-if="shown.stack?.length">
              <h3 class="sub">Technologies</h3>
              <ul class="chips" aria-label="Technologies">
                <li v-for="t in shown.stack" :key="t">{{ t }}</li>
              </ul>
            </template>

            <p v-if="shown.limitation" class="limit">
              <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3" />
                <path d="M8 7.2v4M8 4.9v.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <span>{{ shown.limitation }}</span>
            </p>
            <div v-if="shown.links?.demo || shown.links?.github" class="links">
              <a v-if="shown.links.demo" class="btn btn--primary" :href="shown.links.demo" target="_blank" rel="noopener noreferrer">
                Live demo<span class="sr-only"> (opens in a new tab)</span>
              </a>
              <a v-if="shown.links.github" class="btn" :href="shown.links.github" target="_blank" rel="noopener noreferrer">
                Repository<span class="sr-only"> on GitHub (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </article>
  </dialog>
</template>

<style scoped>
/* Full-viewport, transparent: the sky (stars) shows through; the portfolio itself fades away beneath. */
.inspect {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  overflow: hidden;
  display: grid;
  /* the case study never takes more than 56% of the width, so the orbit keeps room for its ring */
  grid-template-columns: minmax(0, 1fr) minmax(0, min(780px, 56%));
  gap: clamp(8px, 2vw, 32px);
  padding: 16px clamp(12px, 2vw, 32px);
}
.inspect:not([open]) {
  display: none;
}
.inspect::backdrop {
  background: transparent;
}

/* ---------- orbit stage ---------- */
/* The orbit's tree: restrained strokes in the trunk colour, under the cards they connect. */
.boughs {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  opacity: 0;
}
.boughs.rear {
  z-index: 9; /* under every card behind the core, and under the core's light */
}
.boughs.front {
  z-index: 29; /* over the core's light, under every card in front of it */
}
.boughs path {
  fill: none;
  stroke: var(--glow-trunk);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.boughs .strand {
  stroke-width: 1.5px;
  opacity: 0.42;
}
.boughs .strand.fine {
  stroke-width: 0.8px;
  opacity: 0.28;
}
.boughs .b-line {
  stroke: var(--glow-branch);
  stroke-width: 1.1px;
  opacity: 0.5;
}
.boughs .b-base {
  stroke: var(--glow-branch);
  stroke-width: 2.6px;
  stroke-dasharray: 0.32 1; /* thicker where it leaves the bough: a tapering branch */
  opacity: 0.35;
}
.boughs .o-twig {
  stroke: var(--glow-branch);
  stroke-width: 0.9px;
  opacity: 0.38;
}
.stage {
  position: relative;
  grid-column: 1;
  grid-row: 1;
  min-height: 0;
  overflow: clip;
}
.ring {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.o-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 172px;
  visibility: hidden;
  will-change: transform, opacity;
}
.o-node {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-card);
  background: var(--surface);
  box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.9);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.25s var(--ease);
}
.o-node:hover,
.o-node:focus-visible,
.o-node.current {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.o-node.current {
  /* the focus of the scene: an amber edge with a faint halo in the orbit's own colour */
  box-shadow:
    0 10px 24px -18px rgba(0, 0, 0, 0.9),
    0 0 22px -6px color-mix(in srgb, var(--glow-trunk) 30%, transparent);
  cursor: default;
}
.o-sym {
  width: 30px;
  height: 30px;
}
.o-text {
  display: grid;
  min-width: 0;
}
.o-title {
  overflow: hidden;
  font: 600 15px/1.25 var(--font-head);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.o-label {
  overflow: hidden;
  color: var(--ink-3);
  font: 500 10.5px/1.4 var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.core {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 20; /* cards behind it (z < 0) pass under the light */
  width: 0;
  height: 0;
  pointer-events: none;
}
.core .glow {
  position: absolute;
  left: -90px;
  top: -90px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  /* a small bright centre with a wide, soft halo (box shadows, no gradient or blur filter) */
  background: color-mix(in srgb, var(--glow-pale) 70%, transparent);
  box-shadow:
    0 0 24px 10px color-mix(in srgb, var(--glow-pale) 45%, transparent),
    0 0 70px 34px color-mix(in srgb, var(--glow-trunk) 26%, transparent);
  transform: scale(0.18);
  opacity: 0.9;
}
.core .wisp {
  position: absolute;
  opacity: 0.4;
}
.cw0 {
  left: -230px;
  top: -170px;
  width: 460px;
  height: 340px;
}
.cw1 {
  left: -170px;
  top: -210px;
  width: 340px;
  height: 300px;
  --dx: -6%;
  --dur: 50s;
}
.cw2 {
  left: -150px;
  top: -40px;
  width: 300px;
  height: 230px;
  --dx: 5%;
  --dur: 58s;
}

/* ---------- case study ---------- */
.sheet {
  grid-column: 2;
  grid-row: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-card);
  background: var(--surface);
  box-shadow: 0 40px 120px -30px rgba(0, 0, 0, 0.9);
}
.bar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px clamp(14px, 3vw, 24px);
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 96%, transparent);
}
.nav-btns {
  display: flex;
  gap: 6px;
}
.back,
.step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 44px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-ctl);
  background: color-mix(in srgb, var(--bg) 55%, var(--surface));
  color: var(--ink-2);
  font: 600 14px/1 var(--font-body);
  cursor: pointer;
  transition: border-color 0.25s var(--ease);
}
.step {
  padding: 0;
}
.back:hover,
.step:hover {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
  color: var(--ink);
}

/* ---------- entering / leaving ---------- */
.is-enter .sheet {
  animation: unfold 0.55s 0.3s var(--ease) both;
}
.is-leave .sheet {
  animation: fold 0.22s ease-in both;
}
.is-enter .core,
.is-open .core {
  animation: core-in 0.9s var(--ease) both;
}
.is-leave .core {
  transition: opacity 0.35s ease-in;
  opacity: 0;
}
.simple.is-enter .sheet {
  animation: fade 0.25s both;
}
.simple.is-enter .core {
  animation: fade 0.25s both;
}
@keyframes unfold {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
}
@keyframes fold {
  to {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
}
@keyframes core-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.18s var(--ease);
}
.swap-enter-from,
.swap-leave-to {
  opacity: 0;
}
.ghost {
  pointer-events: none;
  will-change: transform, opacity;
}

/* ---------- tablets and phones: the orbit becomes a band above the case study ----------
   (below 1000px a side-by-side orbit would be too narrow to show its ring) */
@media (max-width: 999px) {
  .inspect {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 210px minmax(0, 1fr);
    gap: 8px;
    padding: 8px;
  }
  .stage {
    grid-row: 1;
  }
  .sheet {
    grid-column: 1;
    grid-row: 2;
    justify-self: center;
    width: min(100%, 820px);
  }
}
/* compact orbit cards wherever the stage is narrow or short */
@media (max-width: 1279px) {
  .o-card {
    width: 150px;
  }
  .o-node {
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 8px;
    padding: 7px 9px;
  }
  .o-sym {
    width: 24px;
    height: 24px;
  }
  .o-label {
    display: none;
  }
  .core .glow {
    left: -60px;
    top: -60px;
    width: 120px;
    height: 120px;
  }
}
@media (max-width: 600px) {
  .back {
    padding: 0 10px;
  }
  /* phones: a taller band and narrower cards leave the ring room to show between them */
  .inspect {
    grid-template-rows: 250px minmax(0, 1fr);
  }
  .o-card {
    width: 124px;
  }
  .o-node {
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 6px;
    padding: 6px 8px;
  }
  .o-sym {
    width: 20px;
    height: 20px;
  }
  .o-title {
    font-size: 13.5px;
  }
}

/* ---------- case study content ---------- */
.media-note {
  margin: 8px clamp(20px, 4vw, 40px) 0;
  color: var(--ink-3);
  font-size: 13px;
  line-height: 1.5;
}
.limit {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 24px 0 -12px;
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.5;
}
.limit svg {
  flex: none;
  margin-top: 3px;
  color: var(--glow-spark);
}
.banner {
  height: 170px;
}
.media {
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid var(--line);
  background: #000;
}
.media video,
.media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
/* No time readout in the video's own controls: the reels are short. */
.media video::-webkit-media-controls-current-time-display,
.media video::-webkit-media-controls-time-remaining-display {
  display: none;
}
.thumbs {
  display: flex;
  gap: 8px;
  padding: 12px clamp(20px, 4vw, 40px) 0;
  overflow-x: auto;
}
.thumbs button {
  position: relative;
  flex: none;
  width: 96px;
  aspect-ratio: 16 / 10;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-2);
  cursor: pointer;
  opacity: 0.7;
  transition:
    opacity 0.25s var(--ease),
    border-color 0.25s var(--ease);
}
.thumbs button:hover,
.thumbs button[aria-pressed='true'] {
  border-color: var(--accent);
  opacity: 1;
}
.thumbs img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
}
.body {
  padding: 24px clamp(20px, 4vw, 40px) 36px;
}
.meta {
  margin: 0 0 12px;
  color: var(--ink-3);
  font: 500 12px/1.6 var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h2 {
  font-size: clamp(30px, 5vw, 40px);
}
.lead {
  margin: 10px 0 0;
  color: var(--ink);
  font-size: 18px;
  line-height: 1.5;
}
.context {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 14.5px;
}
.details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 14px;
  margin: 22px 0 0;
}
.details div {
  padding: 16px 18px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-card);
  background: var(--surface-2);
}
dt {
  margin-bottom: 8px;
  color: var(--accent-muted);
  font: 500 11.5px/1.3 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
dd {
  margin: 0;
  color: var(--ink-2);
  font-size: 15px;
}
.sub {
  margin: 28px 0 10px;
  color: var(--ink);
  font-size: 16px;
}
.highlights {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 1.2em;
  color: var(--ink-2);
  font-size: 15px;
}
.highlights li::marker {
  color: var(--accent-muted);
}
.contribution {
  margin: 0;
  color: var(--ink-2);
  font-size: 15px;
}
.status {
  margin-left: 10px;
  padding: 0.3em 0.6em;
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 4px;
  color: var(--accent);
  font-size: 11px;
  white-space: nowrap;
}
.suite-link,
.app {
  border: 1px solid var(--line-strong);
  background: var(--surface-2);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.25s var(--ease);
}
.suite-link {
  margin-top: 12px;
  padding: 7px 14px;
  border-radius: var(--r-ctl);
  font-size: 14px;
}
.suite-link:hover,
.app:hover {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.apps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.app {
  display: grid;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 14px 16px;
  border-radius: var(--r-card);
}
.app-title {
  font: 600 17px/1.3 var(--font-head);
}
.app-line {
  color: var(--ink-2);
  font-size: 14.5px;
}
.app-status {
  margin-top: 4px;
  color: var(--ink-3);
  font-size: 13px;
}
.integration p,
.story p {
  margin: 0 0 10px;
  color: var(--ink-2);
  font-size: 15px;
}
.integration {
  margin-top: 6px;
  padding: 2px 16px 6px;
  border-left: 2px dashed var(--line-strong);
}
.story h4 {
  margin: 14px 0 4px;
  font-size: 15px;
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}
@media (prefers-reduced-motion: reduce) {
  .is-enter .sheet,
  .is-enter .core,
  .is-open .core,
  .is-leave .sheet {
    animation: fade 0.2s both;
  }
}
</style>
