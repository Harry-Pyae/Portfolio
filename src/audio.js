import { reactive } from 'vue'
import { tracks, cues, crossfadeSeconds, startFadeSeconds } from './content/audioCues.js'

/*
 * The one soundtrack controller. The main track is a looping media element (so its playback position
 * survives an inspection: it is faded out and paused, then resumed); project excerpts are cut from the
 * decoded inspection track and looped sample-accurately; switches use equal-power crossfades. Every fade cancels the one before
 * it, so rapid switching always ends on the current destination. Missing files only hide the controls.
 *
 * sound.state: 'idle' (not started) | 'blocked' (autoplay refused; starts on the first tap or key) |
 *              'playing' | 'paused' (the visitor turned it off) | 'unavailable' (no Web Audio or a missing file)
 */
export const sound = reactive({ state: 'idle' })

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
  master.connect(ctx.destination)
  mainEl = new Audio()
  mainEl.preload = 'auto'
  mainEl.src = `${url(tracks.main.src)}#t=${tracks.main.start}` // skip the near-silent opening
  mainEl.addEventListener('error', unavailable)
  // loops back to the start point, not to 0, so the quiet opening never comes round again
  mainEl.addEventListener('ended', () => {
    mainEl.currentTime = tracks.main.start
    mainEl.play().catch(() => {})
  })
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
  const fromSilence = !voices.length && mainGain.gain.value < 0.01 // nothing to crossfade with
  clearTimeout(pauseTimer)
  fadeOutVoices()
  const id = dest
  if (id && cues[id] && buffer) {
    startVoice(id, ctx.currentTime + 0.5) // a beat later, so the main track has begun to recede
    fade(mainGain.gain, 0, X)
    pauseTimer = setTimeout(() => dest && mainEl.pause(), X * 1000 + 80) // keeps its playback position
    return
  }
  // main portfolio (or an excerpt that isn't ready / failed): the main track plays
  if (mainEl.paused) mainEl.play().catch(() => {})
  fade(mainGain.gain, tracks.main.volume, fromSilence ? startFadeSeconds : X)
  if (id && cues[id] && buffer == null) loadBuffer().then(() => dest === id && buffer && apply())
}

// Called once on load: start the main track if the browser allows it and the visitor hasn't turned it off.
export async function initSound() {
  // A missing file only hides the controls (one small request to find out).
  const ok = await fetch(url(tracks.main.src), { method: 'HEAD' }).then((r) => r.ok, () => false)
  if (!ok) return unavailable()
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
    sound.state = 'blocked'
    // Browsers only allow sound after a gesture: the visitor's first tap or key starts it. A tap on the
    // music switch is left to the switch itself, which would otherwise start it and turn it straight off.
    const start = (e) => {
      if (sound.state !== 'blocked') return gestures.forEach((t) => removeEventListener(t, start, true))
      if (!e.target.closest?.('[data-sound-switch]')) playSound()
    }
    gestures.forEach((t) => addEventListener(t, start, true))
  }
}
// The events that count as a user gesture for autoplay (touch only from pointerup, mouse from pointerdown).
const gestures = ['pointerdown', 'pointerup', 'keydown']
const idle = (fn) => (window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1500)))(fn)

// Visitor action (a click): start or resume.
export async function playSound() {
  if (!setup() || sound.state === 'unavailable') return
  try {
    await ctx.resume()
    await mainEl.play()
  } catch (e) {
    if (e?.name === 'NotSupportedError') return unavailable()
  }
  if (sound.state === 'unavailable' || mainEl.paused) return // not a gesture the browser accepts
  sound.state = 'playing'
  if (dest && cues[dest] && buffer == null) await loadBuffer()
  apply()
  idle(loadBuffer)
}

export function pauseSound() {
  if (sound.state !== 'playing') return
  sound.state = 'paused'
  const X = 0.35
  fadeOutVoices(X)
  fade(mainGain.gain, 0, X)
  clearTimeout(pauseTimer)
  pauseTimer = setTimeout(() => sound.state === 'paused' && mainEl.pause(), X * 1000 + 60)
}

export const toggleSound = () => (sound.state === 'playing' ? pauseSound() : playSound())

// Silent while the visitor is away (tab hidden, window minimised or another window focused); on return it
// picks up where it left off. The visitor's own on/off choice is untouched.
let held = null // set while away: { main } = whether the main track was sounding
function onPresence() {
  const away = document.hidden || !document.hasFocus()
  if (away && !held && sound.state === 'playing') {
    held = { main: false }
    fade(master.gain, 0, 0.3)
    setTimeout(() => {
      if (!held) return
      held.main = !mainEl.paused
      mainEl.pause()
      ctx.suspend()
    }, 350)
  } else if (!away && held) {
    if (held.main) mainEl.play().catch(() => {})
    held = null
    ctx.resume().then(() => fade(master.gain, 1, 0.6))
  }
}
document.addEventListener('visibilitychange', onPresence)
addEventListener('blur', onPresence)
addEventListener('focus', onPresence)

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
  away: !!held,
  mainTime: mainEl?.currentTime ?? 0,
  mainPaused: mainEl?.paused ?? true,
  mainGain: mainGain?.gain.value ?? 0,
  voices: voices.length,
  buffer: buffer === false ? 'failed' : buffer ? 'ready' : 'not loaded',
})

window.__sound = soundDebug // read-only hook for the browser checks
