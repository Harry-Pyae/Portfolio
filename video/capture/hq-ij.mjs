import { record } from './hq.mjs'
const out = process.argv[2], base = 'http://localhost:5174'
const ready = async (p) => {
  await p.waitForLoadState('networkidle')
  await p.waitForFunction(() => !/Loading|Checking your session/i.test(document.body.innerText), null, { timeout: 20000 }).catch(() => console.log('still loading?'))
  await p.waitForTimeout(500)
}
await record(out + '/internshipjp', async (p, r) => {
  await p.goto(base + '/auth/login', { waitUntil: 'networkidle' })
  await p.locator('input[type=email], input[name=email], input[autocomplete=email], input[autocomplete=username]').first().fill('student1@demo.internshipjp.local')
  await p.locator('input[type=password]').first().fill('Practice-77x')
  await p.locator('button[type=submit]').click()
  await p.waitForFunction(() => location.pathname.startsWith('/student'), null, { timeout: 20000 }); await ready(p)
  console.log('at', p.url())
  await r.start(); await r.wait(2200)
  const go = async (path) => {
    const link = p.locator(`a[href="${path}"]:visible`).first()
    await link.hover(); await r.wait(250); await link.click()
    await r.hold(() => ready(p)); await r.wait(1000)
  }
  await go('/student/internships')
  const q = p.locator('input[placeholder*="Search"]').first()
  await r.type(q, 'React', 90); await r.wait(300)
  await p.locator('button', { hasText: /^\s*Search\s*$/ }).first().click()
  await r.hold(() => ready(p)); await r.wait(2000)
  await go('/student/certificates')
  await r.type(p.locator('input[placeholder*="Oracle Java"]').first(), 'Responsive Web Design', 55); await r.wait(400)
  await r.type(p.locator('input[placeholder*="Coursera"]').first(), 'freeCodeCamp', 55); await r.wait(1200)
  const mm = p.locator('button', { hasText: 'မြန်မာ' }).first()
  await mm.hover(); await r.wait(300); await mm.click(); await r.wait(2600)
})
