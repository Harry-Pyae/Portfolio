import { ref, watch, onMounted } from 'vue'
import { theme } from './state.js'

// Nebula wisps behind the hero carousel: fractal noise shaped by two overlapping blurred ellipses (irregular, never a smooth
// blob), rendered ONCE per tint into a small canvas and upscaled by CSS. Only their transform and
// opacity ever animate. Textures are cached per theme.
const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || matchMedia('(max-width: 640px)').matches
const SIZE = lowPower ? 128 : 200

// theme → tint name → [rgb, noise seed]. Components ask for roles; each theme supplies its colours.
const TINTS = {
  nebula: {
    // one cyan family, so the nebula reads as a single atmosphere rather than a colour blend
    cyan: [[80, 217, 232], 3],
    blue: [[46, 160, 190], 10],
    green: [[64, 186, 196], 24],
  },
  ember: {
    cyan: [[255, 216, 77], 3], // yellow
    blue: [[255, 232, 160], 10], // pale gold
    green: [[255, 232, 160], 24],
  },
}

const cache = new Map()
const texture = (name) => {
  const key = `${theme.value}:${name}`
  if (!cache.has(key)) cache.set(key, render(...TINTS[theme.value][name]))
  return cache.get(key)
}

// Components ask for the tints they need; generation happens during idle time, never on first paint.
export function useWisps(names) {
  const urls = ref([])
  const load = () => Promise.all(names.map(texture)).then((list) => (urls.value = list))
  onMounted(() => {
    const later = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 300))
    later(load, { timeout: 1500 })
  })
  watch(theme, load) // retint on theme switch (each theme's textures are cached after first use)
  return urls
}

async function render([r, g, b], seed) {
  const w = SIZE
  const h = Math.round(SIZE * 1.3)
  const [R, G, B] = [r, g, b].map((v) => (v / 255).toFixed(3))
  const k = seed % 7 // vary the second lobe so each tint has its own silhouette
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>` +
    `<filter id="n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${(0.022 * 200) / w} ${(0.05 * 200) / w}" numOctaves="${lowPower ? 3 : 4}" seed="${seed}"/>` +
    `<feColorMatrix values="0 0 0 0 ${R} 0 0 0 0 ${G} 0 0 0 0 ${B} 2.6 0 0 0 -1.15"/></filter>` +
    `<filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${w * 0.1}"/></filter>` +
    `<mask id="m"><g fill="#fff" filter="url(#s)">` +
    `<ellipse cx="${44 + k}%" cy="52%" rx="28%" ry="32%"/>` +
    `<ellipse cx="${60 - k}%" cy="${36 + k}%" rx="${18 + k}%" ry="22%"/></g></mask></defs>` +
    `<rect width="100%" height="100%" filter="url(#n)" mask="url(#m)"/></svg>`
  const src = 'data:image/svg+xml,' + encodeURIComponent(svg)
  try {
    const img = new Image()
    img.src = src
    await img.decode()
    const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h })
    canvas.getContext('2d').drawImage(img, 0, 0)
    const blob = await new Promise((res) => canvas.toBlob(res))
    return blob ? URL.createObjectURL(blob) : src
  } catch {
    return src // canvas unavailable or tainted: let the browser rasterise the SVG itself
  }
}
