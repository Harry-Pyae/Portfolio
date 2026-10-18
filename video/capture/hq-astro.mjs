import { record } from './hq.mjs'
const out = process.argv[2], base = 'https://astro-care-ai.vercel.app'
// crew list → Alex Chen's brief → scroll the brief → crew badge
await record(out + '/astrocare', async (p, r) => {
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
  await r.start(); await r.wait(1000)
  await p.mouse.move(640, 430, { steps: 25 }); await r.wait(500)
  await p.locator('text=Alex Chen').first().hover(); await r.wait(400)
  await p.locator('text=Alex Chen').first().click()
  await r.hold(async () => { await p.waitForLoadState('networkidle'); await p.locator('text=/Today.s overview/').first().waitFor(); await p.locator('text=Heart rate variability').first().waitFor(); await p.waitForTimeout(500) })
  await r.wait(1600)
  await r.glide(650, 2000); await r.wait(1300)
  await r.glide(600, 1800); await r.wait(1300)
  await r.glide(-1250, 1400); await r.wait(600)
  await p.locator('button', { hasText: 'Crew badge' }).hover(); await r.wait(300)
  await p.locator('button', { hasText: 'Crew badge' }).click(); await r.wait(2600)
})
