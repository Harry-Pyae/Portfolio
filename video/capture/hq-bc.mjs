import { record } from './hq.mjs'
const out = process.argv[2], base = 'http://127.0.0.1:5175'
const settle = async (p) => {
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(500)
  await p.waitForFunction(() => !document.querySelector('.v-skeleton-loader'), null, { timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(300)
}
const tryClick = async (loc) => { if (!(await loc.count())) return false; await loc.first().click({ timeout: 4000 }).catch(() => {}); return true }
// local demo data (the app's own demo-data reset): public site → staff workspace tour → Myanmar + dark theme
await record(out + '/bloodcare', async (p, r) => {
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await p.getByText('Become a donor').first().waitFor(); await p.waitForTimeout(1000)
  await r.start(); r.mark('Public donor site: become a donor, book a donation'); await r.wait(1400); await r.glide(500, 1400); await r.wait(500)
  if (await tryClick(p.locator('header a, nav a').filter({ hasText: /^Lookup$/ }))) {
    await r.hold(() => settle(p)); r.mark('Donors look up their card status'); await r.wait(2000)
  }
  await r.hold(async () => {
    await p.goto(base + '/workspace/login', { waitUntil: 'networkidle' })
    await p.getByLabel('Staff email').fill('demo.admin@bloodcare.test')
    await p.getByLabel('Password', { exact: true }).fill('BloodCare!Demo2026')
    await p.getByRole('button', { name: /Sign in to workspace/ }).click()
    await p.waitForFunction(() => location.pathname === '/workspace', null, { timeout: 20000 }).catch(async (e) => { console.log('login stuck at', p.url(), (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300)); throw e })
    await settle(p); await p.waitForTimeout(800)
  })
  r.mark('Staff workspace: role-based sign-in, live operations overview'); await r.wait(1500); await r.glide(380, 1100); await r.wait(300)
  const go = async (path, caption, extra) => {
    const link = p.locator(`a[href="${path}"]:visible`).first()
    if (!(await link.count())) return console.log('no link', path)
    await link.hover(); await r.wait(200); await link.click()
    await r.hold(async () => {
      const ok = await p.waitForFunction((x) => location.pathname === x, path, { timeout: 4000 }).then(() => true, () => false)
      if (!ok) { console.log('click did not navigate, loading', path); await p.goto(base + path, { waitUntil: 'networkidle' }) }
      await settle(p)
    })
    r.mark(caption); await r.wait(1000)
    if (extra) await extra()
    await r.glide(340, 1000); await r.wait(600)
  }
  await go('/workspace/inventory', 'Live blood inventory by group, against target stock')
  await go('/workspace/cards', 'Donation cards: issue, print, renew; each carries a QR code to its live record', async () => {
    const row = p.locator('tbody tr').first()
    if (await row.count()) { await row.hover(); await r.wait(400); await row.click({ timeout: 3000 }).catch(() => {}); await r.hold(() => p.waitForTimeout(900)); await r.wait(2200); await p.keyboard.press('Escape'); await r.wait(500) }
  })
  await go('/workspace/blood-requests', 'Hospital requests, allocated first-expiry-first-out')
  await go('/workspace/haemovigilance', 'Haemovigilance: reporting what happened to transfused blood')
  await go('/workspace/reports', 'Reports with CSV export and a full audit history', async () => {
    for (const tab of ['Donations & stock', 'Donors & appointments']) { if (await tryClick(p.locator('button, a, [role=tab]').filter({ hasText: tab }))) { await r.hold(() => settle(p)); await r.wait(1300) } }
  })
  await r.glide(-1200, 900)
  // theme first: once the page is in Myanmar the button labels are translated
  const theme = p.getByRole('button', { name: /Switch theme/ })
  if (await theme.count()) { r.mark('Light and dark themes'); await theme.hover(); await r.wait(300); await theme.click(); await r.wait(2200) }
  const lang = p.getByRole('button', { name: 'Language' })
  if (await lang.count()) {
    await lang.hover(); await r.wait(300); await lang.click(); await r.wait(700)
    const mm = p.getByText('မြန်မာ', { exact: true }).last()
    if (await mm.count()) { await mm.click(); await r.hold(() => settle(p)); r.mark('English and Myanmar'); await r.wait(2200) }
  }
})
