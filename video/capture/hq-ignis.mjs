import { chromium } from 'playwright-core'
import { record } from './hq.mjs'
// IGNIS live site (public pages only, read-only): landing → Crew clothing preset → confirm → Evidence Map →
// matching experiments → validated Brief → Gap Radar. Then four 1280×800 gallery screenshots.
// Usage: node hq-ignis.mjs <video/public/hq> <public/projects/ignis>
const [out, shots] = process.argv.slice(2), base = 'https://ignis-nasa-2026.vercel.app'
const prep = async (ctx) => {
  await ctx.addInitScript(() => {
    try { localStorage.setItem('ignis-theme', 'dark'); localStorage.setItem('ignis-tour-offered', '1') } catch {}
  })
  await ctx.route('**/api/parse-scenario', (r) => r.abort()) // presets only, no LLM parse
  await ctx.route('**/curate**', (r) => r.abort())
}
const mapReady = (p) => p.locator('[id^="map-point-"]').first().waitFor({ state: 'attached', timeout: 30000 })
const briefReady = (p) => p.getByRole('button', { name: /^Evidence E\d+/ }).first().waitFor({ timeout: 30000 })
const top = (p, sel, offset = 110) => p.locator(sel).first().evaluate((e, o) => e.getBoundingClientRect().top + scrollY - o, offset)
const glideTo = async (p, r, sel, ms, offset) => r.glide((await top(p, sel, offset)) - (await p.evaluate(() => scrollY)), ms)
const confirmCrew = async (p) => {
  await p.getByRole('button', { name: /Crew clothing/ }).first().click()
  await p.waitForTimeout(900)
  await p.locator('#confirm-scenario').click()
}

if (out) await record(out + '/ignis', async (p, r) => {
  await prep(p.context())
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  await r.start(); r.mark('Describe a spacecraft fire scenario in mission terms'); await r.wait(1200)
  await r.hold(async () => { await p.goto(base + '/#console', { waitUntil: 'networkidle' }); await mapReady(p) })
  r.mark('Start from a preset, then confirm the scenario')
  await p.getByRole('button', { name: /Crew clothing/ }).first().hover(); await r.wait(300)
  await confirmCrew(p)
  await p.mouse.move(900, 420, { steps: 20 }) // wheel over the page, not the console's own scroller
  r.mark('Evidence Map: verified NASA runs by oxygen and airflow'); await r.wait(1600)
  r.mark('The closest experiments, and why each one matches')
  await glideTo(p, r, '#s3', 1000); await r.wait(1200)
  await r.hold(() => briefReady(p).catch(() => {}))
  r.mark('A Brief whose every claim is checked against its source card')
  await glideTo(p, r, '#s4', 1000); await r.wait(1500)
  r.mark('Gap Radar: where the catalog has no matching verified evidence')
  await glideTo(p, r, '#s5', 1000); await r.wait(1800)
})

if (shots) {
  const b = await chromium.launch({ channel: 'msedge' })
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } })
  await prep(ctx)
  const p = await ctx.newPage()
  const shot = async (n, sel, offset = 90) => {
    if (sel) await p.evaluate((y) => scrollTo(0, y), await top(p, sel, offset))
    await p.waitForTimeout(900)
    await p.screenshot({ path: `${shots}/${n}.jpg`, type: 'jpeg', quality: 88 })
  }
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await shot(1)
  await p.goto(base + '/#console', { waitUntil: 'networkidle' }); await mapReady(p)
  await confirmCrew(p); await p.waitForTimeout(2500); await shot(2, '#evidence-map', 130)
  await briefReady(p).catch(() => {}); await shot(3, '#s4')
  // 60-second case: claim GMT96-T8 ran at 10 cm/s (the record says 5), so the validator withholds it
  await p.goto(base + '/case', { waitUntil: 'networkidle' })
  const run = p.locator('section:has(#case-step2) select')
  await run.selectOption(await run.evaluate((s) => [...s.options].find((o) => o.textContent.includes('GMT96-T8'))?.value))
  await p.locator('section:has(#case-step2) input[type=number]').fill('10')
  await p.getByRole('button', { name: 'Check against the record' }).click()
  await p.locator('#case-result').waitFor({ timeout: 15000 })
  await shot(4, '#case-result', 200)
  await b.close()
  console.log('screenshots →', shots)
}
