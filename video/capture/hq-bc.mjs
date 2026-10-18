import { record } from './hq.mjs'
const out = process.argv[2], base = 'http://127.0.0.1:5175'
const settle = (p) => p.waitForLoadState('networkidle').then(() => p.waitForTimeout(700))
await record(out + '/bloodcare', async (p, r) => {
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.getByText('Become a donor').first().waitFor(); await p.waitForTimeout(1200)
  await r.start(); await r.wait(1100); await r.glide(450, 1200); await r.wait(300)
  await r.hold(async () => {
    await p.goto(base + '/workspace/login', { waitUntil: 'networkidle' })
    await p.getByLabel('Staff email').fill('demo.admin@bloodcare.test')
    await p.getByLabel('Password', { exact: true }).fill('BloodCare!Demo2026')
    await p.getByRole('button', { name: /Sign in to workspace/ }).click()
    await p.waitForFunction(() => location.pathname === '/workspace'); await settle(p); await p.waitForTimeout(1200)
  })
  await r.wait(1100); await r.glide(380, 1100); await r.wait(300)
  for (const path of ['/workspace/inventory', '/workspace/cards', '/workspace/blood-requests', '/workspace/reports']) {
    const link = p.locator(`a[href="${path}"]:visible`).first()
    await link.hover(); await r.wait(200); await link.click()
    await r.hold(async () => { await p.waitForFunction((x) => location.pathname === x, path); await settle(p); await p.waitForFunction(() => !document.querySelector('.v-skeleton-loader'), null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400) })
    await r.wait(900); await r.glide(340, 1000); await r.wait(500)
  }
})
