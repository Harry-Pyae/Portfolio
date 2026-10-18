import { reactive } from 'vue'
import { tracks, cues, crossfadeSeconds } from './content/audioCues.js'

/*
 * The one soundtrack controller. The main track is a looping media element (so its playback position
 * survives an inspection: it is faded out and paused, then resumed); project excerpts are cut from the
 * decoded inspection track and looped sample-accurately; switches use equal-power crossfades. Every fade cancels the one before
 * it, so rapid switching always ends on the current destination. Missing files only hide the controls.
 *
 * sound.state: 'idle' (not started) | 'blocked' (autoplay refused; waits for a click) | 'playing' |
 *              'paused' (the visitor turned it off) | 'unavailable' (no Web Audio or a missing file)
 */
export const sound = reactive({ state: 'idle', muted: read('portfolio-muted') === '1' })

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* not remembered: the control still works for this visit */
  }
}

const url = (src) => import.meta.env.BASE_URL + src
let ctx = null
let master = null
let mainGain = null
let excerptBus = null
let mainEl = null
let buffer = null // decoded inspection track, or false once it failed
let bufferP = null
let voices = [] // excerpt sources currently sounding: { src, gain }
let dest = null // current destination: null = main portfolio, or a project / suite id
let pauseTimer = 0

function setup() {
  if (ctx) return true
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) {
    sound.state = 'unavailable'
    return false
  }
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = sound.muted ? 0 : 1
  master.connect(ctx.destination)
  mainEl = new Audio()
  mainEl.loop = true
  mainEl.preload = 'auto'
  mainEl.src = url(tracks.main.src)
  mainEl.addEventListener('error', unavailable)
  mainGain = ctx.createGain()
  mainGain.gain.value = 0
  ctx.createMediaElementSource(mainEl).connect(mainGain).connect(master)
  excerptBus = ctx.createGain()
  excerptBus.gain.value = tracks.inspect.volume
  excerptBus.connect(master)
  return true
}

function unavailable() {
  sound.state = 'unavailable'
  voices.forEach((v) => v.src.stop())
  voices = []
  mainEl?.pause()
}

// Equal-power fade of a gain from wherever it is now; any fade already running on it is replaced.
function fade(param, to, seconds, at = ctx.currentTime) {
  const from = param.value
  param.cancelScheduledValues(at)
  param.setValueAtTime(from, at)
  const steps = 24
  for (let k = 1; k <= steps; k++) {
    const x = k / steps
    const w = to > from ? Math.sin((x * Math.PI) / 2) : 1 - Math.cos((x * Math.PI) / 2)
    param.linearRampToValueAtTime(from + (to - from) * w, at + Math.max(0.01, seconds) * x)
  }
}

function loadBuffer() {
  bufferP ??= fetch(url(tracks.inspect.src))
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
    .then((data) => ctx.decodeAudioData(data))
    .then((b) => (buffer = b))
    .catch(() => (buffer = false)) // excerpts are skipped; the main track keeps playing
  return bufferP
}

// An excerpt loops sample-accurately between its start and end (the cue boundaries sit on the beat grid
// at zero crossings, where the music after `end` matches the music after `start`).
function startVoice(id, when) {
  const cue = cues[id]
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.loopStart = cue.start
  src.loopEnd = Math.min(cue.end, buffer.duration)
  const gain = ctx.createGain()
  gain.gain.value = 0
  src.connect(gain).connect(excerptBus)
  const v = { src, gain, out: cue.fadeOut ?? crossfadeSeconds }
  voices.push(v)
  src.onended = () => (voices = voices.filter((x) => x !== v))
  src.start(when, cue.start)
  fade(gain.gain, cue.volume ?? 1, cue.fadeIn ?? crossfadeSeconds, when)
}

// Each excerpt leaves with its own fade-out, unless a quicker one is asked for (pausing).
function fadeOutVoices(seconds) {
  const t = ctx.currentTime
  for (const v of voices) {
    const d = seconds ?? v.out
    fade(v.gain.gain, 0, d, t)
    try {
      v.src.stop(t + d + 0.05)
    } catch {
      /* already stopped */
    }
  }
}

// Bring the sound in line with the current destination.
function apply() {
  if (sound.state !== 'playing') return
  const X = crossfadeSeconds
  clearTimeout(pauseTimer)
  fadeOutVoices()
  const id = dest
  if (id && cues[id] && buffer) {
    startVoice(id, ctx.currentTime + 0.02)
    fade(mainGain.gain, 0, X)
    pauseTimer = setTimeout(() => dest && mainEl.pause(), X * 1000 + 80) // keeps its playback position
    return
  }
  // main portfolio (or an excerpt that isn't ready / failed): the main track plays
  if (mainEl.paused) mainEl.play().catch(() => {})
  fade(mainGain.gain, tracks.main.volume, X)
  if (id && cues[id] && buffer == null) loadBuffer().then(() => dest === id && buffer && apply())
}

// Called once on load: start the main track if the browser allows it and the visitor hasn't turned it off.
export async function initSound() {
  // A missing file only hides the controls (one small request to find out).
  const ok = await fetch(url(tracks.main.src), { method: 'HEAD' }).then((r) => r.ok, () => false)
  if (!ok) return unavailable()
  if (read('portfolio-sound') === 'off') {
    sound.state = 'paused'
    return
  }
  if (!setup()) return
  try {
    await mainEl.play()
    await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 400))])
  } catch (e) {
    if (e?.name === 'NotSupportedError') return unavailable()
  }
  if (sound.state === 'unavailable') return
  if (ctx.state === 'running' && !mainEl.paused) {
    sound.state = 'playing'
    apply()
    idle(loadBuffer)
  } else {
    mainEl.pause()
    mainEl.removeAttribute('src') // no download until the visitor asks for the music
    mainEl.load()
    sound.state = 'blocked' // one discreet "Enable soundtrack" control; never retried on our own
  }
}
const idle = (fn) => (window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1500)))(fn)

// Visitor action (a click): start or resume.
export async function playSound() {
  if (!setup() || sound.state === 'unavailable') return
  write('portfolio-sound', 'on')
  if (!mainEl.getAttribute('src')) mainEl.src = url(tracks.main.src)
  try {
    await ctx.resume()
    await mainEl.play()
  } catch (e) {
    if (e?.name === 'NotSupportedError') return unavailable()
  }
  if (sound.state === 'unavailable') return
  sound.state = 'playing'
  if (dest && cues[dest] && buffer == null) await loadBuffer()
  apply()
  idle(loadBuffer)
}

export function pauseSound() {
  if (sound.state !== 'playing') return
  write('portfolio-sound', 'off')
  sound.state = 'paused'
  const X = 0.35
  fadeOutVoices(X)
  fade(mainGain.gain, 0, X)
  clearTimeout(pauseTimer)
  pauseTimer = setTimeout(() => sound.state === 'paused' && mainEl.pause(), X * 1000 + 60)
}

export const toggleSound = () => (sound.state === 'playing' ? pauseSound() : playSound())

export function toggleMute() {
  sound.muted = !sound.muted
  write('portfolio-muted', sound.muted ? '1' : '0')
  if (ctx) fade(master.gain, sound.muted ? 0 : 1, 0.25)
}

// Where the visitor is: null = the portfolio, otherwise the inspected project or suite id.
export function soundTo(id) {
  dest = id ?? null
  apply()
}

// For tests and the cue file: what is meant to be audible right now.
export const soundDebug = () => ({
  state: sound.state,
  dest,
  ctx: ctx?.state ?? null,
  mainTime: mainEl?.currentTime ?? 0,
  mainPaused: mainEl?.paused ?? true,
  mainGain: mainGain?.gain.value ?? 0,
  voices: voices.length,
  buffer: buffer === false ? 'failed' : buffer ? 'ready' : 'not loaded',
})

window.__sound = soundDebug // read-only hook for the browser checks
