import { record } from './hq.mjs'
const out = process.argv[2], base = 'http://localhost:5174'
const ready = async (p) => {
  await p.waitForLoadState('networkidle')
  await p.waitForFunction(() => !/Loading|Checking your session/i.test(document.body.innerText), null, { timeout: 20000 }).catch(() => console.log('still loading?'))
  await p.waitForTimeout(500)
}
const login = async (p, email) => {
  await p.context().clearCookies()
  await p.goto(base + '/auth/login', { waitUntil: 'networkidle' })
  await p.locator('input[type=email], input[name=email], input[autocomplete=email], input[autocomplete=username]').first().fill(email)
  await p.locator('input[type=password]').first().fill('Practice-77x')
  await p.locator('button[type=submit]').click()
  await p.waitForFunction(() => !location.pathname.startsWith('/auth'), null, { timeout: 20000 }); await ready(p)
}
// local demo data (the app's own seeder): student search and certificates → admin verifies a certificate → Myanmar
await record(out + '/internshipjp', async (p, r) => {
  const go = async (path) => {
    const link = p.locator(`a[href="${path}"]:visible`).first()
    if (await link.count()) { await link.hover(); await r.wait(250); await link.click() } else await p.goto(base + path)
    await r.hold(() => ready(p)); await r.wait(900)
  }
  await login(p, 'student1@demo.internshipjp.local')
  await r.start(); r.mark('Student dashboard: profile, applications and verified certificates'); await r.wait(2200)
  await go('/student/internships')
  r.mark('Browse internships and search')
  const q = p.locator('input[placeholder*="Search"]').first()
  await r.type(q, 'React', 90); await r.wait(300)
  await p.locator('button', { hasText: /^\s*Search\s*$/ }).first().click()
  await r.hold(() => ready(p)); await r.wait(1600)
  const view = p.locator('a, button').filter({ hasText: /View and apply/i }).first()
  if (await view.count()) {
    await view.hover(); await r.wait(300); await view.click(); await r.hold(() => ready(p))
    r.mark('Internship details: the skills it asks for and the application form'); await r.wait(1500); await r.glide(400, 1400); await r.wait(1500); await r.glide(-400, 800)
  }
  await go('/student/certificates')
  r.mark('Certificates wait for an administrator before employers can see them')
  await r.type(p.locator('input[placeholder*="Oracle Java"]').first(), 'Responsive Web Design', 55); await r.wait(400)
  await r.type(p.locator('input[placeholder*="Coursera"]').first(), 'freeCodeCamp', 55); await r.wait(1400)
  await r.hold(async () => { await login(p, 'admin@demo.internshipjp.local'); await p.goto(base + '/admin/certificates'); await ready(p) })
  r.mark('Administrator verifies certificates'); await r.wait(1800)
  const review = p.locator('button, a').filter({ hasText: /^\s*Review\s*$/ }).first()
  if (await review.count()) {
    await review.hover(); await r.wait(300); await review.click(); await r.hold(() => p.waitForTimeout(800)); await r.wait(1600)
    const verify = p.locator('button').filter({ hasText: /^\s*(Verify|Approve)/ }).first()
    if (await verify.count()) { await verify.hover(); await r.wait(300); await verify.click(); await r.hold(() => ready(p)); await r.wait(2000) }
    else console.log('no verify button:', (await p.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean).join(' | '))).slice(0, 300))
  }
  const mm = p.locator('button', { hasText: 'မြန်မာ' }).first()
  if (await mm.count()) { r.mark('English and Myanmar'); await mm.hover(); await r.wait(300); await mm.click(); await r.wait(2600) }
})
