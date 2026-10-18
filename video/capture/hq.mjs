// High-quality walkthrough recorder: CDP screencast frames (1280x720 viewport at 1.5x = 1920x1080,
// JPEG q92) with timestamps, instead of Playwright's low-bitrate recordVideo.
// Pauses (`hold`) drop loading time: frames during a hold are discarded and the timeline is closed up.
// Output: <dir>/f00001.jpg… + <dir>/index.json [{ f, t }] (t = seconds on the edited timeline).
import { chromium } from 'playwright-core'
import fs from 'node:fs'

export async function record(dir, fn, opts = {}) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const b = await chromium.launch({ channel: 'msedge' })
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, ...opts })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 160)))
  const cdp = await ctx.newCDPSession(p)
  const index = []
  const marks = [] // caption cues: { t, text } on the edited timeline
  let paused = true
  let skipped = 0 // seconds removed from the timeline so far
  let pausedAt = 0
  let t0 = null
  let n = 0
  const save = (data, t) => {
    if (t0 == null) t0 = t
    const at = t - t0 - skipped
    if (index.length && at - index[index.length - 1].t < 1 / 60) return // cap at ~60 fps
    const f = `f${String(++n).padStart(5, '0')}.jpg`
    fs.writeFileSync(`${dir}/${f}`, Buffer.from(data, 'base64'))
    index.push({ f, t: +at.toFixed(4) })
  }
  const now = () => Date.now() / 1000
  cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    if (!paused) save(data, now())
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
  // Grab the current state as a frame (the screencast only emits on change).
  const still = async () => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
    save(data, now())
  }
  const rec = {
    async start() {
      if (t0 == null) t0 = now()
      else skipped += now() - pausedAt
      paused = false
      await still()
    },
    stop() {
      pausedAt = now()
      paused = true
    },
    // run fn (navigation, waiting for data) off the record
    async hold(fn2) {
      rec.stop()
      await fn2()
      await p.waitForTimeout(300)
      await rec.start()
    },
    // caption for what happens next (shown as a lower third in the Walkthrough video)
    mark(text) {
      marks.push({ t: +(t0 == null ? 0 : now() - t0 - skipped).toFixed(3), text })
    },
    wait: (ms) => p.waitForTimeout(ms),
    // smooth, human-paced scroll
    async glide(dy, ms = 1400) {
      const steps = Math.round(ms / 16)
      for (let i = 0; i < steps; i++) {
        await p.mouse.wheel(0, dy / steps)
        await p.waitForTimeout(16)
      }
    },
    // type like a person
    async type(locator, text, delay = 45) {
      await locator.click()
      await locator.pressSequentially(text, { delay })
    },
  }
  try {
    await fn(p, rec)
  } finally {
    if (!paused) {
      await still() // closing frame, so the last state lasts until the end time
      rec.stop()
    }
    await cdp.send('Page.stopScreencast').catch(() => {})
    const end = index.length ? index[index.length - 1].t : 0
    fs.writeFileSync(`${dir}/index.json`, JSON.stringify({ duration: +(end + 0.5).toFixed(3), frames: index, marks }))
    console.log(`recorded ${index.length} frames, ${end.toFixed(1)} s → ${dir}`)
    await ctx.close()
    await b.close()
  }
}
