import { record } from './hq.mjs'
const out = process.argv[2], base = 'https://astro-care-ai.vercel.app'
const settle = (p) => p.waitForLoadState('networkidle').then(() => p.waitForTimeout(500))
// live demo (synthetic crew data): crew list → a brief against the personal baseline → trend metric →
// crew badge → daily check-in → Myanmar → dark theme
await record(out + '/astrocare', async (p, r) => {
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000)
  await r.start(); r.mark('Crew list: each member measured against their own baseline'); await r.wait(1600)
  await p.mouse.move(640, 430, { steps: 25 }); await r.wait(400)
  await p.locator('text=Alex Chen').first().hover(); await r.wait(400)
  await p.locator('text=Alex Chen').first().click()
  await r.hold(async () => { await settle(p); await p.locator('text=/Today.s overview/').first().waitFor(); await p.locator('text=Heart rate variability').first().waitFor(); await p.waitForTimeout(500) })
  r.mark('Changes worth reviewing at ±15% from the personal baseline'); await r.wait(1800)
  await r.glide(650, 2000); await r.wait(1200)
  r.mark('Trend chart with the baseline period shaded')
  await r.glide(600, 1800); await r.wait(1200)
  const metric = p.locator('select').first()
  if (await metric.count()) {
    const opts = await metric.locator('option').allTextContents()
    if (opts.length > 1) { await metric.selectOption({ index: 1 }); await r.wait(1800) }
    console.log('metrics:', opts.join(' | '))
  }
  await r.glide(600, 1800); await r.wait(900)
  r.mark('NASA solar-flare feed for space-weather context')
  await r.glide(500, 1500); await r.wait(1500)
  await r.glide(-2400, 1600); await r.wait(500)
  const badge = p.locator('button', { hasText: 'Crew badge' })
  r.mark('QR crew badge opens this member’s brief on another device')
  await badge.hover(); await r.wait(300); await badge.click(); await r.wait(2600)
  await p.keyboard.press('Escape'); await r.wait(600)
  const checkin = p.locator('a, button').filter({ hasText: /^Check-in$/ }).first()
  if (await checkin.count()) {
    r.mark('Daily check-in: sleep, fatigue and notes')
    await checkin.click(); await r.hold(() => settle(p)); await r.wait(1500)
    await r.glide(400, 1400); await r.wait(1200); await r.glide(-400, 900)
  }
  const mm = p.locator('button', { hasText: /မြန်/ }).first()
  if (await mm.count()) { r.mark('English and Myanmar'); await mm.click(); await r.wait(2200) }
  const dark = p.locator('button', { hasText: /Dark theme|အမှောင်/ }).first()
  if (await dark.count()) { r.mark('Light and dark themes'); await dark.click(); await r.wait(2200) }
})
