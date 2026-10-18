<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { theme, motionOn } from '../state.js'

// Fixed sky behind the whole page: two star layers painted once per resize into canvases, which
// drift at different rates as the page scrolls (depth through parallax), plus a few twinkling stars
// and sparse dust. No clouds here: the only nebula sits behind the carousel.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const r1 = rng(7)
const twinkles = Array.from({ length: 7 }, () => ({
  left: `${(r1() * 100).toFixed(2)}%`,
  top: `${(r1() * 100).toFixed(2)}%`,
  '--s': `${(1.8 + r1() * 1.4).toFixed(1)}px`,
  '--d': `${(4 + r1() * 5).toFixed(1)}s`,
  '--delay': `${(-r1() * 9).toFixed(1)}s`,
}))
const r2 = rng(21)
const dust = Array.from({ length: 4 }, () => ({
  left: `${(r2() * 100).toFixed(2)}%`,
  top: `${(r2() * 100).toFixed(2)}%`,
  '--d': `${(70 + r2() * 30).toFixed(0)}s`,
  '--dx': `${((r2() - 0.5) * 140).toFixed(0)}px`,
  '--dy': `${(-40 - r2() * 90).toFixed(0)}px`,
}))

// Scroll parallax rates: distant stars barely move, nearer ones a little more.
const RATES = [0.025, 0.07]
const farLayer = ref(null)
const nearLayer = ref(null)
const far = ref(null)
const near = ref(null)
const heights = ref([0, 0])
// Subtle, and off for reduced motion / paused motion / small screens.
const parallaxOn = () => motionOn.value && innerWidth >= 720

function paint(c, w, h, seed, count, bright) {
  const dpr = 1 // stars are single-pixel dots: 1x canvases keep the two drifting layers light on the GPU
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  const ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  const rand = rng(seed)
  const warm = theme.value === 'ember'
  // Irregular density: a soft diagonal band of extra stars, sparse elsewhere; no tiling.
  for (let n = 0, tries = 0; n < count && tries < count * 6; tries++) {
    const x = rand() * w
    const y = rand() * h
    const band = Math.exp(-(((x / w - (y / h) * 0.7 - 0.2) / 0.22) ** 2))
    if (rand() > 0.35 + 0.65 * band) continue
    n++
    const big = bright && rand() < 0.25
    const r = big ? 0.9 + rand() * 0.7 : (bright ? 0.6 : 0.3) + rand() * 0.5
    const tone = rand()
    const rgb = warm ? (tone < 0.9 ? '255,255,255' : '255,244,194') : tone < 0.78 ? '220,236,255' : tone < 0.95 ? '140,226,240' : '245,215,140'
    ctx.fillStyle = `rgba(${rgb},${(big ? 0.75 : (bright ? 0.35 : 0.18) + rand() * 0.45).toFixed(2)})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    if (big) {
      ctx.fillStyle = `rgba(${rgb},0.08)`
      ctx.beginPath()
      ctx.arc(x, y, r * 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function draw() {
  if (!far.value || !near.value) return
  const w = innerWidth
  const h = innerHeight
  // each layer is taller than the viewport by exactly how far it will drift over the whole page
  const scrollable = Math.max(0, document.documentElement.scrollHeight - h)
  heights.value = RATES.map((r) => h + Math.ceil(scrollable * r))
  paint(far.value, w, heights.value[0], 1337, Math.round((w * heights.value[0]) / 7500), false)
  paint(near.value, w, heights.value[1], 4242, Math.round((w * heights.value[1]) / 30000), true)
  update()
}

// One rAF per scroll burst; only two compositor transforms are written.
let ticking = false
function update() {
  ticking = false
  const y = parallaxOn() ? scrollY : 0
  if (farLayer.value) farLayer.value.style.transform = `translate3d(0, ${(-y * RATES[0]).toFixed(1)}px, 0)`
  if (nearLayer.value) nearLayer.value.style.transform = `translate3d(0, ${(-y * RATES[1]).toFixed(1)}px, 0)`
}
const onScroll = () => {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}

let timer
const redraw = () => {
  clearTimeout(timer)
  timer = setTimeout(draw, 150)
}
let ro
onMounted(() => {
  draw()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', redraw)
  ro = new ResizeObserver(redraw) // page height changes (fonts, layout) change the drift range
  ro.observe(document.body)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', redraw)
  ro.disconnect()
})
watch(theme, draw)
watch(motionOn, update)
</script>

<template>
  <div class="sky" aria-hidden="true">
    <div ref="farLayer" class="layer" :style="{ height: `${heights[0]}px` }">
      <canvas ref="far" class="stars"></canvas>
    </div>
    <div ref="nearLayer" class="layer" :style="{ height: `${heights[1]}px` }">
      <canvas ref="near" class="stars"></canvas>
    </div>
    <span v-for="(t, i) in twinkles" :key="`t${i}`" class="twinkle anim" :style="t"></span>
    <i v-for="(d, i) in dust" :key="`d${i}`" class="dust anim" :style="d"></i>
  </div>
</template>

<style scoped>
/* Fixed behind everything: z-index -1 paints above the <html> background, below all content.
   (The page background lives on <html>; a body background would cover this layer.) */
.sky {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  will-change: transform;
}
.stars {
  display: block;
  width: 100%;
  height: 100%;
}
.twinkle {
  position: absolute;
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: var(--glow-pale);
  box-shadow: 0 0 4px 1px color-mix(in srgb, var(--glow-trunk) 45%, transparent);
  opacity: 0.3;
  will-change: opacity;
  animation: twinkle var(--d) ease-in-out var(--delay) infinite alternate;
}
@keyframes twinkle {
  to {
    opacity: 0.9;
  }
}
.dust {
  position: absolute;
  width: 2px;
  height: 1px;
  border-radius: 1px;
  background: var(--ink-2);
  opacity: 0.35;
  will-change: transform;
  animation: dust var(--d) ease-in-out infinite alternate;
}
@keyframes dust {
  to {
    transform: translate3d(var(--dx), var(--dy), 0) rotate(30deg);
  }
}
@media (max-width: 720px) {
  .twinkle:nth-of-type(n + 5),
  .dust:nth-of-type(n + 3) {
    display: none;
  }
}
</style>
