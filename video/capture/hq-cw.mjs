import { record } from './hq.mjs'
const out = process.argv[2], base = 'https://ai-detection-project-nine.vercel.app'
const TEXT = 'Furthermore, it is important to note that artificial intelligence offers unprecedented opportunities for personalized learning. In conclusion, educators must embrace these innovations while remaining mindful of their ethical implications.'
// live site: hub → masking (real rule-based rewrite) → quiz
await record(out + '/clickwise', async (p, r) => {
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); await r.wait(1400)
  await r.glide(300, 1100); await r.wait(500); await r.glide(-300, 700)
  const nav = p.locator('a, button').filter({ hasText: /^AI Masking$/ }).first()
  await nav.hover(); await r.wait(300); await nav.click()
  await r.hold(() => p.waitForLoadState('networkidle')); await r.wait(900)
  await p.locator('button', { hasText: /^Strong/ }).first().click(); await r.wait(500)
  await p.locator('textarea').first().scrollIntoViewIfNeeded()
  await r.hold(() => p.waitForTimeout(300))
  await r.type(p.locator('textarea').first(), TEXT.slice(0, 60), 26); await p.locator('textarea').first().fill(TEXT); await r.wait(600)
  await p.locator('button', { hasText: /^Mask Text$/ }).hover(); await r.wait(300)
  await p.locator('button', { hasText: /^Mask Text$/ }).click(); await r.wait(1200)
  await r.glide(-260, 1200); await r.wait(3000)
  const quiz = p.locator('a, button').filter({ hasText: /^Quiz$/ }).first()
  await quiz.click()
  await r.hold(() => p.waitForLoadState('networkidle')); await r.wait(1500)
  const start = p.locator('button').filter({ hasText: /^I am ready$/ }).first()
  if (await start.count()) { await start.hover(); await r.wait(300); await start.click(); await r.hold(() => p.waitForTimeout(1200)); await r.wait(2500) }
})
