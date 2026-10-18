import { record } from './hq.mjs'
const out = process.argv[2]
await record(out + '/chatledger', async (p, r) => {
  await p.goto('https://chat-ledger.netlify.app/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); await r.wait(900)
  await p.mouse.move(420, 300, { steps: 12 })
  await p.locator('button', { hasText: 'Messy' }).hover(); await r.wait(400)
  await p.locator('button', { hasText: 'Messy' }).click(); await r.wait(1500)
  await r.glide(400, 1300); await r.wait(500)
  await p.locator('button', { hasText: 'Extract Orders' }).hover(); await r.wait(300)
  await p.locator('button', { hasText: 'Extract Orders' }).click(); await r.wait(700) // a moment of the real loading state
  await r.hold(() => p.waitForFunction(() => document.querySelector("table"), null, { timeout: 90000 }).catch(async (e) => { console.log((await p.evaluate(() => document.body.innerText)).slice(0, 600)); throw e }))
  await r.wait(1600)
  await p.locator('table').scrollIntoViewIfNeeded(); await r.wait(2200)
  await p.mouse.move(700, 400, { steps: 20 }); await r.wait(2500)
})
