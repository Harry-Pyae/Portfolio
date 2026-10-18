import { record } from './hq.mjs'
const out = process.argv[2]
// live demo: two built-in sample chats → AI extraction → review table (nothing is saved without confirming)
const extract = async (p, r, sample) => {
  const s = p.locator('button', { hasText: sample })
  await s.hover(); await r.wait(300); await s.click(); await r.wait(1400)
  await r.glide(380, 1200); await r.wait(500)
  const go = p.locator('button', { hasText: 'Extract Orders' })
  await go.hover(); await r.wait(300); await go.click(); await r.wait(700) // a moment of the real loading state
  await r.hold(() => p.waitForFunction(() => document.querySelector('table') && !/Reading messages/i.test(document.body.innerText), null, { timeout: 90000 }))
  await r.wait(800); await p.locator('table').scrollIntoViewIfNeeded(); await r.wait(2600)
}
await record(out + '/chatledger', async (p, r) => {
  await p.goto('https://chat-ledger.netlify.app/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); r.mark('Paste sales chat from Messenger or Viber, in Burmese and English'); await r.wait(1600)
  await p.mouse.move(420, 300, { steps: 12 })
  await extract(p, r, 'Messy')
  r.mark('Review table: nothing is saved until the seller confirms'); await r.wait(2600)
  await r.glide(-700, 1100); await r.wait(400)
  r.mark('Another sample: several customers in one chat')
  await extract(p, r, 'With names')
  r.mark('Orders extracted by Gemini: customer, item, quantity, price, area, paid')
  await p.mouse.move(700, 420, { steps: 20 }); await r.wait(3500)
})
