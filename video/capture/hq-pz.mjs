import { record } from './hq.mjs'
const out = process.argv[2], base = 'http://127.0.0.1:8020'
// customer journey: menu → filter → pizza details → add to cart → cart → order
await record(out + '/pizza', async (p, r) => {
  await p.goto(base + '/loginPage', { waitUntil: 'networkidle' })
  await p.fill('input[name=email]', 'customer@pizza.test'); await p.fill('input[name=password]', 'local-demo-pass')
  await p.click('button[type=submit]'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800)
  console.log('home:', p.url())
  await r.start(); await r.wait(1200)
  await r.glide(380, 1200); await r.wait(500)
  const veg = p.locator('a, button').filter({ hasText: /^Veggie$/ }).first()
  if (await veg.count()) { await veg.hover(); await r.wait(300); await veg.click(); await r.hold(() => p.waitForLoadState('networkidle')); await r.wait(1500) }
  const all = p.locator('a, button').filter({ hasText: /^All$/ }).first()
  if (await all.count()) { await all.click(); await r.hold(() => p.waitForLoadState('networkidle')); await r.wait(1000) }
  const detail = p.locator('a[href*="/user/pizza/details"]').first()
  await detail.hover(); await r.wait(400); await detail.click()
  await r.hold(() => p.waitForLoadState('networkidle')); await r.wait(1400)
  const plus = p.locator('button').filter({ has: p.locator('.fa-plus') }).first()
  if (await plus.count()) { await plus.click(); await r.wait(500) }
  await p.locator('button', { hasText: /add to cart/i }).first().hover(); await r.wait(300)
  await p.locator('button', { hasText: /add to cart/i }).first().click()
  await r.hold(async () => { await p.waitForTimeout(1500); await p.goto(base + '/user/cart/list', { waitUntil: 'networkidle' }) })
  await r.wait(2000)
  await p.locator('button', { hasText: /checkout|order/i }).first().hover(); await r.wait(400)
  await p.locator('button', { hasText: /checkout|order/i }).first().click()
  await r.hold(() => p.waitForTimeout(2500))
  console.log('after order:', p.url())
  await r.wait(1000)
  await p.locator('a[href$="/history"]').first().hover(); await r.wait(300); await p.locator('a[href$="/history"]').first().click()
  await r.hold(() => p.waitForLoadState('networkidle')); await r.wait(2500)
  console.log('history:', p.url())
})
