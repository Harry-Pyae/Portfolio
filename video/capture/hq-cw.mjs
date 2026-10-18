import { record } from './hq.mjs'
const out = process.argv[2], base = 'https://ai-detection-project-nine.vercel.app'
const TEXT = 'Furthermore, it is important to note that artificial intelligence offers unprecedented opportunities for personalized learning. In conclusion, educators must embrace these innovations while remaining mindful of their ethical implications.'
const settle = (p) => p.waitForLoadState('networkidle').then(() => p.waitForTimeout(400))
// live site: hub → masking (rule-based rewrite, runs locally) → quiz (answer a question) → leaderboard.
// Live text detection was failing (unavailable model), so it isn't shown here.
await record(out + '/clickwise', async (p, r) => {
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); r.mark('One hub: detection, masking, humanising and a quiz'); await r.wait(1600)
  await r.glide(300, 1100); await r.wait(700); await r.glide(-300, 700)
  const nav = p.locator('a, button').filter({ hasText: /^AI Masking$/ }).first()
  await nav.hover(); await r.wait(300); await nav.click()
  await r.hold(() => settle(p)); await r.wait(900)
  r.mark('Masking: rule-based rewriting that runs locally')
  await p.locator('button', { hasText: /^Strong/ }).first().click(); await r.wait(500)
  await p.locator('textarea').first().scrollIntoViewIfNeeded()
  await r.hold(() => p.waitForTimeout(300))
  await r.type(p.locator('textarea').first(), TEXT.slice(0, 60), 26); await p.locator('textarea').first().fill(TEXT); await r.wait(600)
  await p.locator('button', { hasText: /^Mask Text$/ }).hover(); await r.wait(300)
  await p.locator('button', { hasText: /^Mask Text$/ }).click(); await r.wait(1200)
  await r.glide(-260, 1200); await r.wait(3200)
  const quiz = p.locator('a, button').filter({ hasText: /^Quiz$/ }).first()
  await quiz.click(); await r.hold(() => settle(p)); await r.wait(1200)
  r.mark('Quiz: spot the signs of AI-generated writing')
  const ready = p.locator('button').filter({ hasText: /^I am ready$/ }).first()
  if (await ready.count()) { await ready.hover(); await r.wait(300); await ready.click(); await r.hold(() => p.waitForTimeout(1000)); await r.wait(1500) }
  const click = async (loc, after = 900) => {
    if (!(await loc.count())) return console.log('missing', loc)
    await loc.hover({ timeout: 3000 }).catch(() => {}); await r.wait(300)
    await loc.click({ timeout: 3000 }).catch((e) => console.log('click failed', e.message.slice(0, 80))); await r.wait(after)
  }
  await click(p.locator('button').filter({ hasText: 'Repeated formal transition phrases' }).first())
  await click(p.locator('button').filter({ hasText: /^Check answer/ }).first(), 3200) // answer checked, explanation shown
  await click(p.locator('button').filter({ hasText: /^Next/ }).first(), 1200)
  await click(p.locator('button').filter({ hasText: /AI-generated\s*$/ }).first())
  await click(p.locator('button').filter({ hasText: /^Check answer/ }).first(), 3000)
  const board = p.locator('a, button').filter({ hasText: /^Leaderboard$/ }).first()
  if (await board.count()) { r.mark('Leaderboard'); await board.click(); await r.hold(async () => { await settle(p); await p.waitForFunction(() => !/Loading leaderboard/i.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {}) }); await r.wait(2600) }
})
