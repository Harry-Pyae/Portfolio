<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { openProject, showProject, closeProject, motionOn, prefersReduced, toggleMotion } from '../state.js'
import { litProject, pulseIn } from '../tree.js'
import { profile } from '../content/profile.js'
import { suites, appsOf, story, caseStudyOf, kindOf, highlightsOf, inspectable, branches, branchOf } from '../content/projects.js'
import { explorerLayout, ringCard, pageSize, pageOf, alignSlots, turning, MAX_PAGE, TAU, linkAt, connectTo, fadeOut } from '../orbit.js'
import { soundTo } from '../audio.js'
import { useWisps } from '../wisps.js'
import ProjectArt from './ProjectArt.vue'
import MusicPill from './MusicPill.vue'

/*
 * Project inspection: a scene over the portfolio, which stays mounted (and keeps its scroll, carousel
 * phase and tree) underneath. A native modal <dialog> gives the focus trap and Escape. Around the
 * readable case study, an explorer in two levels: the branches (groups of projects) stand as labels on
 * an outer spiral, and the active branch's projects travel one slow clockwise ring around the selected
 * project at the centre (geometry in orbit.js). Below 1000×520 there is no room for the spiral: a row of
 * branches and a row of that branch's projects sit above the case study, which scrolls as one page.
 * Each project is a history entry (#/project/<id>), so Back/Forward and direct links work.
 */
const ENTER = 900 // ms; light runs to the trunk, the card pushes in, the orbit unfolds from a column
const LEAVE = 420 // ms; the scene recedes, then the portfolio finishes settling on its own
const SWAP = 700 // ms; Previous/Next: one card returns to its place on the ring, the next comes forward
const REV = 70 // seconds per revolution of the inner ring
const CARD_H = 50 // fixed orbit card height (two-line names), as checked by scripts/check-orbit.mjs

// Everything inspectable, in page order (the suite sits before its apps). Same objects as the page.
const all = inspectable
const byId = (id) => all.find((x) => x.id === id)
// the centre card's context line: a status where there is one, else the kind of project
const labelOf = (p) => p.status ?? kindOf(p)

// Compact layout (tablets, phones, short windows): the project selector replaces the orbit.
// (any desktop window shows the explorer, scaled down a little if its column is small)
const compactMq = matchMedia('(max-width: 999px), (max-height: 519px)')
const compact = ref(compactMq.matches)
compactMq.addEventListener('change', (e) => (compact.value = e.matches))

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
const picker = ref(null)
const accent = ref(null) // project whose branch to the centre is briefly accented after selection
const titled = ref(false) // the large title has scrolled under the header: show the compact one
let opener = null
let ghost = null
let timer = 0

// ---------- case study content (unchanged from the former details dialog) ----------
const canPreview = () => motionOn.value && !prefersReduced.value && matchMedia('(hover: hover) and (pointer: fine)').matches
const apps = computed(() => (shown.value?.apps ? appsOf(shown.value) : null))
const parentSuite = computed(() => suites.find((x) => x.id === shown.value?.suite))
const storyHere = computed(() => story.published && story.project && story.project === shown.value?.id)
const highlights = computed(() => (shown.value ? highlightsOf(shown.value) : []))
const shotIndex = computed(() => shown.value?.gallery?.indexOf(media.value) ?? -1)
function load(p) {
  if (viewer.value?.open) viewer.value.close()
  shown.value = p
  media.value = p.video ? 'video' : (p.gallery?.[0] ?? null)
  autoplay.value = canPreview()
  titled.value = false
}

// ---------- screenshot viewer: a nested modal dialog (Escape closes it, focus returns to the trigger) ----------
const viewer = ref(null)
const zoomBtn = ref(null)
const openViewer = () => viewer.value?.showModal()
function stepShot(dir) {
  const g = shown.value?.gallery
  if (!g?.length) return
  media.value = g[(shotIndex.value + dir + g.length) % g.length]
}
function onViewerKey(e) {
  e.stopPropagation() // the scene's own arrow keys switch projects; here they switch screenshots
  if (e.key === 'ArrowRight') stepShot(1)
  else if (e.key === 'ArrowLeft') stepShot(-1)
  else return
  e.preventDefault()
}
const onViewerClose = () => zoomBtn.value?.focus({ preventScroll: true })

// ---------- scrolling rows (compact project rows, media thumbnails) ----------
// The active item is brought into view within its row (sideways only, never scrolling the page), and a
// row fades at whichever edge has more items beyond it, so it reads as scrollable.
function intoRow(el) {
  const row = el?.closest('ul, .thumbs')
  if (!row) return
  const left = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2
  row.scrollTo({ left: Math.max(0, left), behavior: simple.value ? 'auto' : 'smooth' })
  setTimeout(() => edgeCue(row), 450) // once the smooth scroll has settled
}
function edgeCue(e) {
  const row = e.target ?? e
  row.classList.toggle('cue-l', row.scrollLeft > 2)
  row.classList.toggle('cue-r', row.scrollLeft + row.clientWidth < row.scrollWidth - 2)
}
const cueRows = () => nextTick(() => dlg.value?.querySelectorAll('.picker ul, .thumbs').forEach(edgeCue))
watch(media, () => nextTick(() => intoRow(dlg.value?.querySelector('.thumbs [aria-pressed="true"]'))))
watch([shown, compact], cueRows)
addEventListener('resize', cueRows)
// the rows grow a little once the web font has loaded: measure again then
document.fonts?.ready.then(() => {
  dlg.value?.querySelectorAll('.picker [aria-current="true"]').forEach(intoRow)
  cueRows()
})

// ---------- the compact title in the sticky header ----------
const bar = ref(null)
function onScroll() {
  const h = dlg.value?.querySelector('#modal-title')
  titled.value = !!h && !!bar.value && h.getBoundingClientRect().bottom < bar.value.getBoundingClientRect().bottom
}
// Changing project starts its case study from the top (switching gallery media never does).
function toTop() {
  if (sheet.value) sheet.value.scrollTop = 0
  if (dlg.value) dlg.value.scrollTop = 0
  titled.value = false
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
  // focus returns here on close: what had focus, else the project's card (Safari never focuses a clicked button)
  if (!wasLeaving) opener = (document.activeElement !== document.body ? document.activeElement : null) ?? cardFor(p.id) ?? [...document.querySelectorAll(`.page .node[aria-describedby$="-${p.id}-desc"]`)].find((el) => el.checkVisibility?.({ visibilityProperty: true }) ?? true)
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
  // initial focus on the title (not a control), so no focus ring shows until the visitor uses the keyboard
  dlg.value.querySelector('#modal-title')?.focus({ preventScroll: true })
  toTop()
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
  nextTick(toTop)
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

// ---------- the explorer: branches → projects ----------
// The branch of the shown project is the active one. Each branch remembers the last project seen in it
// during this visit; opening a branch for the first time shows its first project in page order.
const activeBranch = computed(() => (shown.value ? branchOf(shown.value) : null))
const membersOf = (name) => branches.find((b) => b.name === name)?.items ?? []
const lastIn = {}
watch(shown, (p) => p && (lastIn[branchOf(p)] = p.id))
function openBranch(name) {
  if (name === activeBranch.value) return
  showProject(byId(lastIn[name]) ?? membersOf(name)[0])
}
// The ring shows the branch's other projects a page at a time (as many as fit, see orbit.js).
const pageSz = ref(MAX_PAGE)
const pageAt = reactive({}) // branch → page index
const ringPage = computed(() => {
  if (!shown.value) return null
  const ids = membersOf(activeBranch.value).map((p) => p.id)
  return pageOf(ids, shown.value.id, pageSz.value, pageAt[activeBranch.value] ?? 0)
})
const turnPage = (dir) => (pageAt[activeBranch.value] = ringPage.value.page + dir)

// ---------- the ring: plain JS per frame, transforms and opacity only ----------
const cards = []
let lay = null // explorerLayout() for the stage
const spiral = ref(null) // the static outer spiral and label positions, for the template
let phi = 0 // rotation, in turns
let speed = 0
// The mouse over the ring's area, or keyboard focus inside the selector, holds the ring while it lasts (so
// a card can be read and clicked); an explicit pause (motionOn) is separate and always wins.
const hold = { hover: false, focus: false }
let m = 0 // 0 = the hero's vertical column, 1 = the explorer
let mFrom = 0
let mTo = 0
let mStart = 0
let mDur = 0
const n = all.length
const centre = all.map(() => 0) // per card: 0 = its place on the ring, 1 = the centre
let cFrom = centre.slice()
const cTo = centre.slice()
const off = all.map(() => 0) // per card: its slot on the ring, a fraction of a turn added to phi
let oFrom = off.slice()
const oTo = off.slice()
let cStart = 0
let cDur = 0
const vis = all.map(() => 0) // per card: 0 = not shown … 1 = on the ring or at the centre (fades)
const visTo = all.map(() => 0)
let arranged = '' // the ring last arranged, so watchers don't restart a transition already under way
let raf = 0
let last = 0
const written = new Map()
const ease = (e) => e * e * (3 - 2 * e)
// The ring's own tree: a bough around it and a branch out to each card, drawn in two SVG layers
// (behind the core / in front of it) from the same phi and card positions as the cards.
const world = ref(null)
let k = 1 // the explorer's scale in its column
const MIN = [515, 620] // its smallest design size (checked by scripts/check-orbit.mjs)
const boughLayers = {} // 'rear' | 'front' → svg element
let bough = null // cached path elements per layer, gathered in measure()
const CENTRE_H = 72 // room kept for the centre card's height (title, two lines, and its context)

// Card sizes, read once per layout change rather than every frame (the centre card is wider and taller).
const heights = []
const widths = []
const measureHeights = () =>
  cards.forEach((el, i) => {
    heights[i] = el?.offsetHeight ?? CARD_H
    widths[i] = el?.offsetWidth ?? 0
  })

function measure() {
  const el = stage.value
  if (!el || !cards[0] || !el.clientWidth) return // compact layout: the stage is hidden
  const ringW = cards.find((c) => c && !c.classList.contains('current'))?.offsetWidth ?? 144
  const centreW = cards.find((c) => c?.classList.contains('current'))?.offsetWidth ?? 188
  // a column smaller than the design size gets the same composition, scaled down to fit
  k = Math.min(1, el.clientWidth / MIN[0], el.clientHeight / MIN[1])
  const W = el.clientWidth / k
  const H = el.clientHeight / k
  Object.assign(world.value.style, { width: `${W}px`, height: `${H}px`, transform: k < 1 ? `scale(${k.toFixed(4)})` : '' })
  lay = explorerLayout(W, H, [ringW, CARD_H], [centreW, CENTRE_H], branches.length)
  lay.colH = Math.max(0, H - CARD_H - 12)
  pageSz.value = pageSize(lay.ring)
  // the spiral is static: label positions and paths for the template, recomputed only on resize
  const nodes = [...lay.spiral.nodes].reverse() // the spiral grows from the last branch (the roots) up
  spiral.value = { d: lay.spiral.d, nodes, cx: lay.cx, cy: lay.cy, ring: lay.ring, captionY: lay.captionY }
  world.value.style.setProperty('--cy', `${lay.cy}px`)
  measureHeights()
  bough = {}
  for (const k of ['rear', 'front']) {
    const svg = boughLayers[k]
    if (!svg) continue
    const q = (s) => [...svg.querySelectorAll(s)]
    bough[k] = { svg, strands: q('.strand'), base: q('.b-base'), line: q('.b-line') }
  }
  render()
}
// The active branch's connection into the ring: from its label's node to the bough, nearest side.
function linkD(i) {
  const s = spiral.value
  if (!s || i < 0) return ''
  const nd = s.nodes[i]
  const tx = s.cx + s.ring.rx * 0.8 * Math.cos(nd.t)
  const ty = s.cy + s.ring.ry * 0.8 * Math.sin(nd.t)
  return `M${nd.x.toFixed(1)} ${nd.y.toFixed(1)}C${(nd.x + (tx - nd.x) * 0.2).toFixed(1)} ${((nd.y + ty) / 2).toFixed(1)} ${(tx + (nd.x - tx) * 0.35).toFixed(1)} ${ty.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`
}
// A branch change: the new connection draws from its node in to the ring behind a bright leading edge,
// which settles into the usual line as it arrives, while the previous one fades (timings and the
// interruption rule in orbit.js). Nothing waits for it. Written per frame in renderLink().
const EDGE = 0.09 // the leading edge's length, as a fraction of the connection (.sp-edge dash)
const links = [] // two <g>: [incoming, outgoing]
let link = { in: { i: -1, t0: -Infinity }, out: null }
const stillMotion = () => !motionOn.value || prefersReduced.value
watch(activeBranch, (b, prev) => {
  link = connectTo(link, branches.findIndex((x) => x.name === b), performance.now(), !prev || !b || stillMotion())
  kick()
})
const setS = (el, key, v) => (el.__s ??= {})[key] !== v && (el.style[key] = el.__s[key] = v)
function paintLink(g, i, drawn, edge, flow, o) {
  const [line, fl, ed] = g.children
  const d = linkD(i)
  for (const el of [line, fl, ed]) setD(el, d)
  setS(line, 'strokeDashoffset', (1 - drawn).toFixed(3))
  setS(ed, 'strokeDashoffset', (EDGE - drawn).toFixed(3))
  setS(ed, 'opacity', (0.95 * edge).toFixed(2))
  setS(fl, 'opacity', (0.85 * flow).toFixed(2))
  setS(g, 'opacity', o.toFixed(2))
}
function renderLink() {
  if (!links[0] || !links[1]) return false
  const t = performance.now()
  if (stillMotion()) link = connectTo(link, link.in.i, t, true) // paused midway: settle at once
  const a = linkAt(link.in, t)
  paintLink(links[0], link.in.i, a.drawn, a.edge, a.flow, 1)
  const o = fadeOut(link.out, t)
  if (!o) link.out = null
  const out = link.out
  paintLink(links[1], out?.i ?? -1, out?.drawn ?? 0, 0, out?.flow ?? 0, o)
  return a.busy || !!out
}

function morphTo(target, ms) {
  mFrom = m
  mTo = target
  mStart = performance.now()
  mDur = ms
  if (!ms) m = target
  kick()
}
let accentTimer = 0
// Bring the cards in line with the shown project: it rests at the centre, its branch's page of other
// projects shares the ring, every other card fades out where it is. Cards that weren't showing appear in
// place; nothing flies across the stage. On a branch change the former centre card is one of those that
// fades where it is, keeping its centre look (`leaving`) while the new one fades in over it.
const leaving = reactive(new Set())
function centreOn(id, ms) {
  const page = ringPage.value
  if (!page) return
  arranged = `${id}|${page.ids.join()}`
  const sel = all.findIndex((p) => p.id === id)
  // a quicker change drops the card still fading from an earlier one: at most two share the centre
  for (const lid of [...leaving]) if (lid !== id) ((vis[all.findIndex((p) => p.id === lid)] = 0), leaving.delete(lid))
  const current = {}
  all.forEach((p, i) => vis[i] > 0.5 && centre[i] < 0.5 && (current[p.id] = off[i])) // on the ring now
  const slots = alignSlots(current, page.ids)
  cFrom = centre.slice()
  oFrom = off.slice()
  all.forEach((p, i) => {
    const onRing = slots[p.id] != null
    visTo[i] = onRing || i === sel ? 1 : 0
    if (visTo[i]) {
      leaving.delete(p.id)
      cTo[i] = i === sel ? 1 : 0
      if (onRing) oTo[i] = slots[p.id]
    }
    else {
      // fades out where it is
      if (vis[i] > 0 && centre[i] > 0.5) leaving.add(p.id)
      cTo[i] = centre[i]
      oTo[i] = off[i]
    }
    if (vis[i] < 0.05) {
      // not showing yet: take its place directly, then fade in
      centre[i] = cFrom[i] = cTo[i]
      if (onRing) off[i] = oFrom[i] = oTo[i]
    }
  })
  cStart = performance.now()
  cDur = ms
  if (!ms) all.forEach((_, i) => ((centre[i] = cTo[i]), (off[i] = oTo[i])))
  // its branch to the centre is accented briefly
  accent.value = id
  clearTimeout(accentTimer)
  accentTimer = setTimeout(() => (accent.value = null), 1400)
  kick()
  nextTick(measureHeights) // the new centre card is wider, with its context line
  if (compact.value) nextTick(() => picker.value?.querySelectorAll('[aria-current="true"]').forEach(intoRow))
}
// A new page of a large branch: rearrange around the same centre.
watch(
  () => ringPage.value && `${shown.value?.id}|${ringPage.value.ids.join()}`,
  (key) => key && key !== arranged && phase.value !== 'closed' && centreOn(shown.value.id, simple.value ? 0 : SWAP),
)

function frame(t) {
  raf = 0
  const dt = last ? Math.min(t - last, 50) / 1000 : 0
  last = t
  let busy = false
  const turns = turning({ open: phase.value !== 'closed', motionOn: motionOn.value, reduced: prefersReduced.value, ...hold })
  // settles quickly when held or paused (a card about to be clicked stops under the pointer), eases back
  // in gently afterwards; slows down while the scene recedes
  const target = turns ? (phase.value === 'leave' ? 0.3 : 1) : 0
  speed += (target - speed) * Math.min(1, dt * (target < speed ? 9 : 3))
  if (Math.abs(target - speed) < 0.01) speed = target
  if (speed) {
    phi += (dt * speed) / REV
    busy = true
  }
  if (target !== speed) busy = true
  if (m !== mTo) {
    const k = mDur ? Math.min(1, (t - mStart) / mDur) : 1
    m = mFrom + (mTo - mFrom) * ease(k)
    if (k >= 1) m = mTo
    busy = true
  }
  if (centre.some((v, i) => v !== cTo[i]) || off.some((v, i) => v !== oTo[i])) {
    const k = cDur ? Math.min(1, (t - cStart) / cDur) : 1
    for (let i = 0; i < n; i++) {
      centre[i] = k >= 1 ? cTo[i] : cFrom[i] + (cTo[i] - cFrom[i]) * ease(k)
      off[i] = k >= 1 ? oTo[i] : oFrom[i] + (oTo[i] - oFrom[i]) * ease(k)
    }
    busy = true
  }
  // fades: a branch's cards appear (~250 ms) and leave a little quicker (~170 ms), in place, so a
  // crossfade at the centre barely doubles the two names; instant with reduced motion
  for (let i = 0; i < n; i++) {
    if (vis[i] === visTo[i]) continue
    vis[i] = simple.value ? visTo[i] : vis[i] + (visTo[i] - vis[i]) * Math.min(1, dt * (visTo[i] ? 12 : 18))
    if (Math.abs(vis[i] - visTo[i]) < 0.01) vis[i] = visTo[i]
    if (!vis[i]) leaving.delete(all[i].id)
    busy = true
  }
  if (render() || busy) schedule()
}
// Wake the loop from outside. Only a loop that was idle restarts its clock (first frame dt = 0, no time
// jump); the loop itself reschedules with schedule(), so a stopped ring can always speed up again.
function kick() {
  if (!raf && !speed && m === mTo && centre.every((v, i) => v === cTo[i]) && vis.every((v, i) => v === visTo[i])) last = 0
  schedule()
}
function schedule() {
  if (!raf && phase.value !== 'closed' && !document.hidden && !compact.value) raf = requestAnimationFrame(frame)
}
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
  last = 0
}
function render() {
  if (!lay) return false
  const { cx, cy, colH } = lay
  const ring = lay.ring
  const e = ease(Math.max(0, Math.min(1, m)))
  const st = []
  const still = !speed && m === mTo && centre.every((v, i) => v === cTo[i]) // nothing moving
  const px = (v, rest) => (rest || still ? Math.round(v) : v).toFixed(1)
  const shownIdx = all.map((_, i) => i).filter((i) => visTo[i] || vis[i] > 0)
  for (let i = 0; i < n; i++) {
    const el = cards[i]
    if (!el) continue
    const prev = written.get(el) ?? {}
    // a card that is no longer in the active set takes no clicks or focus while it fades
    if (prev.inert !== !visTo[i]) el.inert = prev.inert = !visTo[i]
    if (!vis[i] && !visTo[i]) {
      if (prev.visibility !== 'hidden') el.style.visibility = prev.visibility = 'hidden'
      written.set(el, prev)
      continue
    }
    const c = ringCard(ring, phi + off[i])
    const { a, z } = c
    // the hero's vertical spiral (narrow column) unfolds into the explorer
    const k = shownIdx.indexOf(i)
    const colX = cx + ring.rx * 0.22 * Math.cos(a)
    const colY = cy - colH / 2 + (colH * k) / Math.max(1, shownIdx.length - 1)
    // the selected card rests at the centre; the others keep to the ring
    const w = ease(centre[i])
    const ox = c.x + (cx - c.x) * w
    const oy = c.y + (cy - c.y) * w
    const x = colX + (ox - colX) * e
    const y = colY + (oy - colY) * e
    const s = (c.s + (1 - c.s) * w) * (0.8 + 0.2 * e) * (0.96 + 0.04 * vis[i])
    const o = (c.o + (1 - c.o) * w) * Math.min(1, m * 1.4) * vis[i]
    const ch = heights[i] || CARD_H
    const cw = widths[i] || ring.cw
    const next = {
      // a card at rest (the centred one, or all while the ring is stopped) sits on whole pixels
      transform: `translate3d(${px(x - cw / 2, w >= 1)}px,${px(y - ch / 2, w >= 1)}px,0) scale(${s.toFixed(3)})`,
      opacity: o.toFixed(3),
      // the centre card is never covered; the glow (20) sits between the far and near sides of the ring
      zIndex: w > 0.5 ? 45 : z > 0 ? 30 + Math.round(z * 9) : 10 + Math.round((z + 1) * 9),
      visibility: o > 0.02 ? 'visible' : 'hidden',
    }
    for (const key in next) if (prev[key] !== next[key]) el.style[key] = prev[key] = next[key]
    written.set(el, prev)
    st[i] = { a, x, y, z, w, v: vis[i] }
  }
  renderBoughs(st, Math.min(1, m * 1.4) * e)
  return renderLink()
}

// ---------- the ring's tree ----------
const f1 = (v) => v.toFixed(1)
const setD = (el, d) => el && el.__d !== d && el.setAttribute('d', (el.__d = d))
// A point on the bough: inside the cards' ring, gently irregular, its bumps travelling with phi so they
// keep their place relative to the cards. depth > 0 = in front of the core.
function ringPt(t, fine) {
  const { cx, cy, rx, ry } = lay.ring
  const u = t - phi * TAU
  const k = 0.8 + 0.04 * Math.sin(3 * u + 1.3) + 0.025 * Math.sin(5 * u + 0.4) + (fine ? 0.03 * Math.sin(2 * u + 2.1) : 0)
  return [cx + rx * k * Math.cos(t), cy + ry * k * Math.sin(t), Math.sin(t)]
}
// One strand of the bough, split into the halves behind and in front of the core.
function strandPaths(fine) {
  const out = { rear: '', front: '' }
  let prev = null
  for (let j = 0; j <= 96; j++) {
    const [x, y, z] = ringPt((j / 96) * TAU, fine)
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
  for (const k of ['rear', 'front']) {
    const v = ((k === 'rear' ? 0.6 : 1) * fade).toFixed(3)
    if (bough[k].svg.__o !== v) bough[k].svg.style.opacity = bough[k].svg.__o = v
  }
  const main = strandPaths(false)
  const fine = strandPaths(true)
  for (const k of ['rear', 'front']) {
    setD(bough[k].strands[0], main[k])
    setD(bough[k].strands[1], fine[k])
  }
  for (let i = 0; i < n; i++) {
    const c = st[i]
    if (!c || c.v < 0.3) {
      for (const k of ['rear', 'front']) for (const part of ['base', 'line']) setD(bough[k][part][i], '')
      continue
    }
    // leaves the bough a little behind its card; the selected card's branch swings round to the front
    // of the ring, so it stays short while the card rests at the centre
    const home = Math.PI / 2 + TAU * Math.round((c.a - Math.PI / 2) / TAU)
    const ts = (c.a - 0.3) * (1 - c.w) + home * c.w
    const [sx, sy] = ringPt(ts, false)
    const [qx, qy] = ringPt(ts + 0.01, false) // the bough's direction there
    const tl = Math.hypot(qx - sx, qy - sy) || 1
    const L = Math.hypot(c.x - sx, c.y - sy) || 1
    const bend = (i % 2 ? 1 : -1) * L * 0.12 // gentle asymmetry, never a straight spoke
    const c1x = sx + ((qx - sx) / tl) * L * 0.35
    const c1y = sy + ((qy - sy) / tl) * L * 0.35
    const c2x = c.x + (sx - c.x) * 0.4 + ((sy - c.y) / L) * bend
    const c2y = c.y + (sy - c.y) * 0.4 - ((sx - c.x) / L) * bend
    const d = `M${f1(sx)} ${f1(sy)}C${f1(c1x)} ${f1(c1y)} ${f1(c2x)} ${f1(c2y)} ${f1(c.x)} ${f1(c.y)}`
    // drawn in its card's layer: behind the core when the card is, in front when it is
    const on = c.w > 0.5 || c.z > 0 ? 'front' : 'rear'
    const other = on === 'front' ? 'rear' : 'front'
    for (const part of ['base', 'line']) {
      setD(bough[on][part][i], d)
      setD(bough[other][part][i], '')
    }
  }
}
// The ring holds while a mouse is over its area (touch taps select straight away); the branch labels
// around it never stop it, and stay where they are.
function onStageMove(e) {
  if (e.pointerType !== 'mouse' || !lay) return
  const r = stage.value.getBoundingClientRect()
  const { cx, cy, rx, ry, cw, ch } = lay.ring
  const over = Math.abs((e.clientX - r.left) / k - cx) < rx + cw / 2 + 8 && Math.abs((e.clientY - r.top) / k - cy) < ry + ch / 2 + 8
  if (over !== hold.hover) ((hold.hover = over), kick())
}
const onStageLeave = () => hold.hover && ((hold.hover = false), kick())
const onFocusIn = (e) => ((hold.focus = e.target.matches(':focus-visible')), kick())
const onFocusOut = () => ((hold.focus = false), kick())

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
  clearTimeout(accentTimer)
  ro.disconnect()
  removeEventListener('popstate', fromLocation)
  removeEventListener('resize', cueRows)
  document.removeEventListener('visibilitychange', onVisibility)
})
watch([motionOn, prefersReduced], kick)
// back to the full layout: the orbit measures its stage again and resumes
watch(compact, (c) => !c && nextTick(() => (measure(), kick())))
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
    <!-- The explorer: branches as labels on an outer spiral, the active branch's projects on a ring around
         the selected one. Decorative motion; every label and card is a real button. The mouse over the
         ring, or keyboard focus inside the explorer, holds the ring while it lasts. -->
    <section
      ref="stage"
      class="stage"
      aria-labelledby="orbit-title"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
      @pointermove="onStageMove"
      @pointerleave="onStageLeave"
    >
      <h2 id="orbit-title" class="sr-only">Explore projects by branch</h2>
      <!-- the explorer at its design size, scaled down to fit a smaller column (measure()) -->
      <div ref="world" class="world">
      <!-- the outer spiral: one strand from the roots up, light travelling along it, into the ring -->
      <svg v-if="spiral" class="spiral" aria-hidden="true">
        <path class="sp-strand" :d="spiral.d" />
        <path class="sp-strand fine" :d="spiral.d" transform="translate(3 5)" />
        <path class="sp-flow" :d="spiral.d" />
        <!-- the active branch's connection, and the previous one while it fades (renderLink) -->
        <g v-for="s in 2" :key="s" :ref="(el) => (links[s - 1] = el)">
          <path class="sp-link" pathLength="1" />
          <path class="sp-flow link" />
          <path class="sp-edge" pathLength="1" />
        </g>
        <circle
          v-for="(nd, i) in spiral.nodes"
          :key="i"
          class="sp-node"
          :class="{ on: branches[i].name === activeBranch }"
          :cx="nd.x"
          :cy="nd.y"
          r="4.5"
        />
      </svg>
      <!-- the branches, in page order, each at its node on the spiral -->
      <ul v-if="spiral" class="branches" aria-label="Branches">
        <li v-for="(b, i) in branches" :key="b.name">
          <button
            type="button"
            class="br"
            :class="[`side-${spiral.nodes[i].side}`, { on: b.name === activeBranch }]"
            :style="{ left: `${spiral.nodes[i].x}px`, top: `${spiral.nodes[i].y}px` }"
            :aria-current="b.name === activeBranch ? 'true' : null"
            @click="openBranch(b.name)"
          >
            {{ b.name }}<span class="br-n" aria-hidden="true">{{ b.items.length }}</span><span class="sr-only">, {{ b.items.length }} {{ b.items.length === 1 ? 'project' : 'projects' }}</span>
          </button>
        </li>
      </ul>
      <div class="core" aria-hidden="true">
        <div v-for="(u, i) in wisps" :key="i" class="wisp anim" :class="`cw${i}`" :style="{ backgroundImage: `url(${u})` }"></div>
        <span class="glow"></span>
      </div>
      <!-- The ring's own tree, behind the core and in front of it; its geometry is written per frame. -->
      <svg v-for="k in ['rear', 'front']" :key="k" :ref="(el) => (boughLayers[k] = el)" class="boughs" :class="k" aria-hidden="true">
        <path class="strand" />
        <path class="strand fine" />
        <!-- a data attribute, not a class: Vue patches these <g> without the SVG namespace -->
        <g v-for="p in all" :key="p.id" :data-accent="accent === p.id || null">
          <path class="b-base" pathLength="1" />
          <path class="b-line" />
        </g>
      </svg>
      <ul class="ring" :aria-label="`${activeBranch} projects`">
        <li v-for="(p, i) in all" :key="p.id" :ref="(el) => (cards[i] = el)" class="o-card" :class="{ current: shown?.id === p.id || leaving.has(p.id) }">
          <button
            type="button"
            class="o-node"
            :class="{ current: shown?.id === p.id || leaving.has(p.id) }"
            :aria-current="shown?.id === p.id ? 'true' : null"
            :aria-label="`Inspect ${p.title}`"
            @click="showProject(p)"
          >
            <ProjectArt :project="p" glyph class="o-sym" />
            <span class="o-text">
              <span class="o-title">{{ p.title }}</span>
              <!-- context only for the selected project at the centre -->
              <span v-if="shown?.id === p.id || leaving.has(p.id)" class="o-label">{{ labelOf(p) }}</span>
            </span>
          </button>
        </li>
      </ul>
      <!-- under it all: paging for a branch larger than the ring, and the motion control -->
      <div v-if="spiral" class="o-head" :style="{ top: `${spiral.captionY}px` }">
        <div v-if="ringPage && ringPage.pages > 1" class="pager" role="group" :aria-label="`${activeBranch}: more projects`">
          <button type="button" class="step" aria-label="Previous group of projects" @click="turnPage(-1)">
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
          <span class="pg" aria-live="polite">{{ ringPage.from }}–{{ ringPage.to }} of {{ ringPage.total }}</span>
          <button type="button" class="step" aria-label="Next group of projects" @click="turnPage(1)">
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
        </div>
        <button type="button" class="o-pause" :aria-pressed="!motionOn" @click="toggleMotion">
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path v-if="motionOn" d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor" />
            <path v-else d="M6 4l10 6-10 6z" fill="currentColor" />
          </svg>
          {{ motionOn ? 'Pause motion' : 'Resume motion' }}
        </button>
      </div>
      </div>
    </section>

    <!-- The case study: the visual focus, solid and readable, never under the orbit. -->
    <article ref="sheet" class="sheet" @scroll.passive="onScroll">
      <header ref="bar" class="bar">
        <button class="close back" type="button" @click="requestClose">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
          </svg>
          Return to portfolio
        </button>
        <!-- the project's name, once its large title has scrolled under the header -->
        <span class="bar-title" :class="{ on: titled }" aria-hidden="true">{{ shown?.title }}</span>
        <div class="nav-btns">
          <button type="button" class="step" aria-label="Previous project" @click="step(-1)">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
          <button type="button" class="step" aria-label="Next project" @click="step(1)">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
          <!-- a modal dialog makes the page inert, so the scene carries its own music button, here in
               the header, where it can never cover the media or the text -->
          <MusicPill inline />
        </div>
      </header>

      <!-- Compact layout: the same two levels as rows above the case study, the branches, then the
           active branch's projects. -->
      <nav v-if="compact" ref="picker" class="picker" aria-label="Projects">
        <ul class="pk-branches" aria-label="Branches" @scroll.passive="edgeCue" @scrollend="edgeCue">
          <li v-for="b in branches" :key="b.name">
            <button type="button" :aria-current="b.name === activeBranch ? 'true' : null" @click="openBranch(b.name)">
              {{ b.name }}<span class="br-n" aria-hidden="true">{{ b.items.length }}</span><span class="sr-only">, {{ b.items.length }} {{ b.items.length === 1 ? 'project' : 'projects' }}</span>
            </button>
          </li>
        </ul>
        <ul class="pk-projects" :aria-label="`${activeBranch} projects`" @scroll.passive="edgeCue" @scrollend="edgeCue">
          <li v-for="p in membersOf(activeBranch)" :key="p.id">
            <button type="button" :aria-current="shown?.id === p.id ? 'true' : null" @click="showProject(p)">
              <ProjectArt :project="p" glyph class="p-sym" />
              {{ p.short ?? p.title }}
            </button>
          </li>
        </ul>
      </nav>

      <Transition name="swap" mode="out-in" @after-enter="keepFocus(), cueRows()">
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
            <!-- a screenshot opens larger in the viewer -->
            <button v-else ref="zoomBtn" type="button" class="zoom" :aria-label="`Enlarge screenshot ${shotIndex + 1} of ${shown.gallery.length}`" @click="openViewer">
              <img :src="media" :alt="`${shown.title} screenshot ${shotIndex + 1}`" />
              <span class="zoom-hint" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" /></svg>
              </span>
            </button>
          </div>
          <ProjectArt v-else :project="shown" :alt="`${shown.title} preview`" class="banner" />
          <p v-if="media" class="caption">
            {{ media === 'video' ? 'Walkthrough video' : `Screenshot ${shotIndex + 1} of ${shown.gallery.length}` }}<template
              v-if="shown.videoNote"
            > · <span class="media-note">{{ shown.videoNote }}</span></template>
          </p>
          <div v-if="media && (shown.gallery?.length ?? 0) + (shown.video ? 1 : 0) > 1" class="thumbs" role="group" aria-label="Project media" @scroll.passive="edgeCue" @scrollend="edgeCue">
            <button v-if="shown.video" type="button" class="is-video" :aria-pressed="media === 'video'" @click="media = 'video'">
              <img :src="shown.image" alt="" />
              <span class="play" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="12" height="12"><path d="M5 3.5l8 4.5-8 4.5z" fill="currentColor" /></svg>
                Video
              </span>
              <span class="sr-only">Walkthrough video</span>
            </button>
            <button v-for="(g, i) in shown.gallery" :key="g" type="button" :aria-pressed="media === g" @click="media = g">
              <img :src="g" alt="" loading="lazy" />
              <span class="sr-only">Screenshot {{ i + 1 }}</span>
            </button>
          </div>

          <div class="body">
            <p class="meta">
              <img v-if="shown.icon" class="logo" :src="shown.icon" alt="" />
              <span>{{ kindOf(shown) }}<template v-if="shown.year"> · {{ shown.year }}</template></span>
              <span v-if="shown.status" class="status">{{ shown.status }}</span>
            </p>
            <h2 id="modal-title" tabindex="-1">{{ shown.title }}</h2>
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

            <!-- right after the problem and solution: what Harry did -->
            <section v-if="shown.contribution" class="contribution" aria-labelledby="contribution-title">
              <h3 id="contribution-title" class="sub">{{ profile.name }}’s contribution</h3>
              <p>{{ shown.contribution }}</p>
            </section>

            <template v-if="highlights.length">
              <h3 class="sub">Highlights</h3>
              <ul class="highlights">
                <li v-for="h in highlights" :key="h.text">
                  <strong v-if="h.lead">{{ h.lead }}:</strong> {{ h.text }}
                </li>
              </ul>
            </template>

            <section v-if="storyHere" class="story" aria-labelledby="story-title">
              <h3 id="story-title" class="sub">{{ story.title }}</h3>
              <template v-for="[head, text] in story.parts" :key="head">
                <h4>{{ head }}</h4>
                <p>{{ text }}</p>
              </template>
            </section>

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
            <!-- the case study is where the deeper material lives; demo and code are secondary -->
            <div v-if="shown.links?.demo || shown.links?.github || caseStudyOf(shown)" class="links">
              <a v-if="caseStudyOf(shown)" class="btn btn--primary" :href="caseStudyOf(shown)" target="_blank" rel="noopener noreferrer">
                Full case study<span class="sr-only"> on the project showcase (opens in a new tab)</span>
              </a>
              <a v-if="shown.links.demo" class="btn" :href="shown.links.demo" target="_blank" rel="noopener noreferrer">
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

    <!-- Screenshot viewer: Escape or Close returns focus to the screenshot; arrows step through the gallery. -->
    <dialog ref="viewer" class="viewer" aria-labelledby="viewer-caption" @keydown="onViewerKey" @close="onViewerClose">
      <figure v-if="shown && media && media !== 'video'">
        <img :src="media" :alt="`${shown.title} screenshot ${shotIndex + 1}`" />
        <figcaption id="viewer-caption">{{ shown.title }} · Screenshot {{ shotIndex + 1 }} of {{ shown.gallery.length }}</figcaption>
      </figure>
      <div class="v-controls">
        <template v-if="(shown?.gallery?.length ?? 0) > 1">
          <button type="button" class="step" aria-label="Previous screenshot" @click="stepShot(-1)">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
          <button type="button" class="step" aria-label="Next screenshot" @click="stepShot(1)">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
          </button>
        </template>
        <button type="button" class="back" autofocus @click="viewer.close()">Close</button>
      </div>
    </dialog>
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
/* the orbit's tree: two flowing strands around the ring and a branch out to each card, all quieter
   than the labels */
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
  opacity: 0.42;
}
.boughs .b-base {
  stroke: var(--glow-branch);
  stroke-width: 2.6px;
  stroke-dasharray: 0.32 1; /* thicker where it leaves the bough: a tapering branch */
  opacity: 0.3;
}
/* a new selection: its branch to the centre lights briefly, then settles */
.boughs [data-accent] .b-line {
  animation: accent 1.4s ease-out;
}
@keyframes accent {
  from {
    stroke: var(--glow-pale);
    stroke-width: 1.8px;
    opacity: 0.95;
  }
}
.stage {
  position: relative;
  grid-column: 1;
  grid-row: 1;
  min-height: 0;
  overflow: clip;
}
.world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
/* ---------- the outer spiral and its branch labels (static; positions from orbit.js) ---------- */
.spiral {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.spiral path {
  fill: none;
  stroke-linecap: round;
}
.sp-strand {
  stroke: var(--glow-trunk);
  stroke-width: 1.5px;
  opacity: 0.45;
}
.sp-strand.fine {
  stroke-width: 0.8px;
  opacity: 0.28;
}
/* light travelling along the strand, from the roots up into the ring: the tree growing */
.sp-flow {
  stroke: var(--glow-pale);
  stroke-width: 1.6px;
  stroke-dasharray: 3 37;
  opacity: 0.8;
  animation: sp-flow 3.6s linear infinite;
}
@keyframes sp-flow {
  to {
    stroke-dashoffset: -40px;
  }
}
/* the active branch's connection into the ring; drawn as a stroke reveal (dash offset per frame) */
.sp-link {
  stroke: var(--glow-branch);
  stroke-width: 1.4px;
  stroke-dasharray: 1 2;
  opacity: 0.7;
}
.sp-flow.link {
  stroke: var(--accent);
  opacity: 0.85;
  animation-duration: 2.2s;
}
/* the bright leading edge while a new connection draws */
.sp-edge {
  stroke: var(--glow-pale);
  stroke-width: 2px;
  stroke-dasharray: 0.09 2;
  opacity: 0;
}
:global(.motion-off) .sp-flow {
  animation-play-state: paused;
}
.sp-node {
  fill: var(--bg);
  stroke: var(--glow-trunk);
  stroke-width: 1.5px;
  transition:
    fill 0.2s ease,
    stroke 0.2s ease;
}
.sp-node.on {
  fill: var(--accent);
  stroke: var(--accent);
}
.branches {
  margin: 0;
  padding: 0;
  list-style: none;
}
/* a branch: quiet text beside its node on the spiral; the active one brightens, its count in gold */
.br {
  position: absolute;
  z-index: 48;
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  min-height: 32px;
  padding: 7px 6px;
  border: 0;
  border-radius: var(--r-ctl);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  color: var(--ink-2);
  font: 600 13.5px/1.3 var(--font-body);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease;
}
.br.side-right {
  transform: translate(8px, -50%);
}
.br.side-left {
  transform: translate(calc(-100% - 8px), -50%);
}
.br.side-top {
  transform: translate(-50%, calc(-100% - 6px));
}
.br-n {
  color: var(--ink-3);
  font: 500 12px/1 var(--font-mono);
}
.br:hover {
  color: var(--ink);
}
.br.on {
  color: var(--ink);
}
.br.on .br-n {
  color: var(--accent);
}
/* under it all: paging for a large branch, and the motion control */
.o-head {
  position: absolute;
  left: 50%;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
  transform: translate(-50%, -50%);
}
.pager {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pager .step {
  width: 36px;
  min-width: 36px;
  height: 36px;
}
.pg {
  min-width: 64px;
  color: var(--ink-2);
  font: 500 12.5px/1 var(--font-mono);
  text-align: center;
}
.o-pause {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-ctl);
  background: color-mix(in srgb, var(--bg) 55%, var(--surface));
  color: var(--ink-2);
  font: 500 13px/1 var(--font-body);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.16s var(--ease);
}
.o-pause:hover {
  color: var(--ink);
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.o-pause:active {
  transform: scale(0.97);
}
.o-pause[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
  color: var(--accent);
}
.ring {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  pointer-events: none; /* the list spans the stage; only its cards take the pointer */
}
/* Horizontal cards like the page's own: the symbol beside the name, which takes up to two lines.
   144 × 50 on the ring, as checked by scripts/check-orbit.mjs; the centre card is wider, with its context. */
.o-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 144px;
  visibility: hidden;
  pointer-events: auto;
  will-change: transform, opacity;
}
.o-card.current {
  width: 188px;
}
/* narrower below 1366px; the text column keeps 94px, room for the longest single word (CineMagicHub, 92px) */
@media (max-width: 1365px) {
  .o-card {
    width: 136px;
  }
  .o-card.current {
    width: 168px;
  }
  .o-node:not(.current) {
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 6px;
    padding: 0 6px;
  }
  .o-node:not(.current) .o-sym {
    width: 22px;
    height: 22px;
  }
  /* the centre card's title column keeps 110px (CineMagicHub at 15px needs 106px) */
  .o-card .o-node.current {
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 8px;
    padding: 10px;
  }
  .o-node.current .o-sym {
    width: 28px;
    height: 28px;
  }
}
/* On standard-density screens the hint above makes the browser scale each card's text as a bitmap, so
   cards shown smaller or larger than 1:1 look soft. Without it the cards stay on their own layers (3D
   translate) and are re-rasterised at their true scale. High-density screens keep the hint: the bitmap
   scaling is invisible there and phones need the cheaper path. */
@media (max-resolution: 1.49dppx) {
  .o-card {
    will-change: auto;
  }
}
.o-node {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 50px;
  padding: 0 10px 0 8px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-card);
  background: var(--surface);
  box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.9);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.o-node:hover,
.o-node:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
}
.o-node.current {
  /* the selected project: wider, the gold edge with a restrained halo */
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  height: auto;
  min-height: 64px;
  padding: 10px 12px;
  border-color: var(--accent);
  box-shadow:
    0 10px 24px -18px rgba(0, 0, 0, 0.9),
    0 0 18px -8px color-mix(in srgb, var(--accent) 45%, transparent);
  cursor: default;
}
.o-sym {
  width: 26px;
  height: 26px;
}
.current .o-sym {
  width: 32px;
  height: 32px;
}
.o-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
/* up to two lines, broken only between words */
.o-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font: 600 13px/1.22 var(--font-head);
  letter-spacing: -0.005em;
}
.current .o-title {
  font-size: 15px;
}
.o-label {
  color: var(--ink-3);
  font: 500 11px/1.3 var(--font-mono);
}
.core {
  position: absolute;
  left: 50%;
  top: var(--cy, 50%); /* the ring's centre */
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
    0 0 24px 10px color-mix(in srgb, var(--glow-pale) 40%, transparent),
    0 0 70px 34px color-mix(in srgb, var(--glow-trunk) 22%, transparent);
  transform: scale(0.18);
  opacity: 0.85;
}
/* soft atmosphere around the ring, the same wisps as the page's tree, kept under the labels */
.core .wisp {
  position: absolute;
  opacity: 0.22;
}
.cw0 {
  left: -260px;
  top: -170px;
  width: 520px;
  height: 340px;
}
.cw1 {
  left: -190px;
  top: -200px;
  width: 380px;
  height: 280px;
  --dx: -6%;
  --dur: 50s;
}
.cw2 {
  left: -170px;
  top: -30px;
  width: 340px;
  height: 220px;
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px clamp(14px, 3vw, 24px);
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 96%, transparent);
}
.nav-btns {
  display: flex;
  flex: none;
  gap: 6px;
}
/* the project's name in the header, once its large title has scrolled away */
.bar-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font: 600 15px/1.2 var(--font-head);
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.18s ease,
    transform 0.18s var(--ease);
}
.bar-title.on {
  opacity: 1;
  transform: none;
}
.back {
  flex: none;
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
.back:active,
.step:active {
  transform: scale(0.97);
}
/* the title takes initial focus so the scene is announced; it is not a control, so no ring */
h2:focus {
  outline: none;
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

/* ---------- compact layout: tablets, phones and short windows (no room for the ring) ----------
   The orbit gives way to a row of project buttons above the case study, and the scene scrolls as one
   page instead of a nested panel. Must match `compact` in the script. */
.picker {
  border-bottom: 1px solid var(--line);
}
.picker ul {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 10px clamp(14px, 3vw, 24px);
  overflow-x: auto;
  list-style: none;
  scrollbar-width: thin;
}
/* the branches: plain text tabs with their counts, the active one underlined in gold */
.pk-branches {
  padding-bottom: 0 !important;
}
.picker .pk-branches button {
  position: relative;
  height: 40px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-ctl);
  background: none;
  gap: 6px;
}
.picker .pk-branches button[aria-current='true']::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 4px;
  height: 2px;
  border-radius: 1px;
  background: var(--accent);
}
.picker .pk-branches button[aria-current='true'] {
  border: 0;
}
.picker button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px 0 6px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg) 55%, var(--surface));
  color: var(--ink-2);
  font: 500 13.5px/1 var(--font-body);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.picker button:hover {
  color: var(--ink);
}
.picker button[aria-current='true'] {
  border-color: var(--accent);
  color: var(--ink);
}
.p-sym {
  width: 28px;
  height: 28px;
}
@media (max-width: 999px), (max-height: 519px) {
  .inspect {
    display: block;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px;
  }
  .stage {
    display: none;
  }
  .sheet {
    width: min(100%, 820px);
    margin: 0 auto;
    overflow: visible;
  }
  .bar {
    border-radius: var(--r-card) var(--r-card) 0 0;
  }
}
@media (max-width: 600px) {
  .inspect {
    padding: 0;
  }
  .sheet {
    border-width: 0;
    border-radius: 0;
  }
  .back {
    padding: 0 10px;
  }
}

/* ---------- case study content ---------- */
.caption {
  margin: 8px clamp(20px, 4vw, 40px) 0;
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.5;
}
.media-note {
  color: var(--ink-3);
}
.zoom {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}
.zoom-hint {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--r-ctl);
  background: rgba(3, 7, 18, 0.72);
  color: var(--ink);
  opacity: 0.8;
  transition: opacity 0.2s ease;
}
.zoom:hover .zoom-hint,
.zoom:focus-visible .zoom-hint {
  opacity: 1;
}
.zoom:focus-visible {
  outline-offset: -3px;
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
/* scrolling rows fade at the edge with more items beyond it (edgeCue) */
.cue-r {
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
}
.cue-l {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 40px);
  mask-image: linear-gradient(to right, transparent, #000 40px);
}
.cue-l.cue-r {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 40px, #000 calc(100% - 40px), transparent);
  mask-image: linear-gradient(to right, transparent, #000 40px, #000 calc(100% - 40px), transparent);
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
/* the video thumbnail: a play badge with its own label, unlike the screenshots */
.play {
  position: absolute;
  left: 5px;
  bottom: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 5px;
  border-radius: 4px;
  background: rgba(3, 7, 18, 0.8);
  color: #fff;
  font: 600 11px/1 var(--font-body);
}
.body {
  padding: 24px clamp(20px, 4vw, 40px) 48px;
}
/* Short desktop windows (a laptop at 150% scaling is about 1280 × 580): a lower preview, the whole
   image letterboxed rather than cropped, so the project's name and summary start on the first screen;
   the name also stays in the header. Taller windows keep the 16:9 preview. */
@media (min-width: 1000px) and (min-height: 520px) and (max-height: 760px) {
  .media {
    aspect-ratio: auto;
    height: clamp(200px, 40dvh, 300px);
  }
  .thumbs button {
    width: 80px;
  }
  .bar-title {
    opacity: 1;
    transform: none;
  }
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin: 0 0 12px;
  color: var(--ink-3);
  font: 500 13px/1.6 var(--font-mono);
}
.logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
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
  font: 600 13.5px/1.3 var(--font-body);
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
  gap: 8px;
  margin: 0;
  padding-left: 1.2em;
  color: var(--ink-2);
  font-size: 15px;
}
.highlights li::marker {
  color: var(--accent-muted);
}
.highlights strong {
  color: var(--ink);
  font-weight: 600;
}
/* what Harry did, straight after the problem and solution: set apart by a gold rule, not a card */
.contribution {
  margin-top: 22px;
  padding: 2px 0 2px 16px;
  border-left: 2px solid var(--accent-muted);
}
.contribution .sub {
  margin: 0 0 6px;
}
.contribution p {
  margin: 0;
  color: var(--ink);
  font-size: 15.5px;
}
.status {
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
.chips {
  overflow-wrap: anywhere;
}

/* ---------- screenshot viewer ---------- */
.viewer {
  width: min(96vw, 1400px);
  max-width: none;
  max-height: 96dvh;
  padding: 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-card);
  background: var(--bg);
  color: var(--ink);
}
.viewer::backdrop {
  background: rgba(3, 7, 18, 0.86);
}
.viewer figure {
  margin: 0;
}
.viewer img {
  display: block;
  width: 100%;
  max-height: calc(96dvh - 110px);
  object-fit: contain;
}
.viewer figcaption {
  margin-top: 10px;
  color: var(--ink-2);
  font-size: 13.5px;
}
.v-controls {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 10px;
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
