import { record } from './hq.mjs'
const out = process.argv[2], base = 'http://127.0.0.1:8020'
const settle = (p) => p.waitForLoadState('networkidle')
const login = async (p, email, pass) => {
  await p.goto(base + '/loginPage', { waitUntil: 'networkidle' })
  await p.fill('input[name=email]', email); await p.fill('input[name=password]', pass)
  await p.click('button[type=submit]'); await settle(p); await p.waitForTimeout(600)
}
// customer: menu → filter → pizza details → add to cart → cart → order → history; then the admin accepts it
await record(out + '/pizza', async (p, r) => {
  await login(p, 'customer@pizza.test', 'local-demo-pass')
  await r.start(); r.mark('Customer menu with category filters'); await r.wait(1200)
  await r.glide(380, 1200); await r.wait(500)
  const veg = p.locator('a, button').filter({ hasText: /^Veggie$/ }).first()
  await veg.hover(); await r.wait(300); await veg.click(); await r.hold(() => settle(p)); await r.wait(1500)
  await p.locator('a, button').filter({ hasText: /^All$/ }).first().click(); await r.hold(() => settle(p)); await r.wait(900)
  const detail = p.locator('a[href*="/user/pizza/details"]').first()
  await detail.hover(); await r.wait(400); await detail.click()
  await r.hold(() => settle(p))
  r.mark('Pizza details with a view count'); await r.wait(1400)
  const plus = p.locator('button').filter({ has: p.locator('.fa-plus') }).first()
  if (await plus.count()) { await plus.click(); await r.wait(500) }
  r.mark('Add to cart and order without full page reloads (AJAX)')
  await p.locator('button', { hasText: /add to cart/i }).first().hover(); await r.wait(300)
  await p.locator('button', { hasText: /add to cart/i }).first().click()
  await r.hold(async () => { await p.waitForTimeout(1500); await p.goto(base + '/user/cart/list', { waitUntil: 'networkidle' }) })
  await r.wait(2000)
  await p.locator('button', { hasText: /checkout|order/i }).first().hover(); await r.wait(400)
  await p.locator('button', { hasText: /checkout|order/i }).first().click()
  await r.hold(() => p.waitForTimeout(2500)); await r.wait(800)
  await p.locator('a[href$="/history"]').first().hover(); await r.wait(300); await p.locator('a[href$="/history"]').first().click()
  await r.hold(() => settle(p))
  r.mark('Order history with status'); await r.wait(2400)
  // admin side
  await r.hold(async () => { await p.context().clearCookies(); await login(p, 'admin@gmail.com', 'admin123'); await p.goto(base + '/order/list', { waitUntil: 'networkidle' }) })
  r.mark('Admin: orders, pizzas, categories, users and messages'); await r.wait(1800)
  const st = p.locator('select.statusChange').first()
  if (await st.count()) { await st.hover(); await r.wait(400); await st.selectOption('1'); await r.wait(2200) }
  await p.goto(base + '/products/list'); await r.hold(() => settle(p))
  await r.wait(1500); await r.glide(300, 1200); await r.wait(1500)
})
