import { record } from './hq.mjs'
const out = 'C:/Projects/Portfolio/video/public/hq'
const F = 'http://127.0.0.1:8090/fhcp/html/index.html', C = 'http://127.0.0.1:8090/cmh/html/movie%20channel.html'
const hoverMove = async (p, r, sel, ms = 500) => { const b = await p.locator(sel).first().boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 }); await r.wait(ms) }
// FHCP: hero, nav hover, season strip hover, season details hover, shop
await record(out + '/fhcp', async (p, r) => {
  await p.goto(F, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); await r.wait(1200)
  for (const s of ['#seasons', '#shop']) await hoverMove(p, r, `#left_menu ${s}`, 450)
  await r.glide(560, 1600); await r.wait(300)
  for (const id of [2, 5, 8, 11]) await hoverMove(p, r, `#spn_c_${id}`, 550)
  await p.mouse.move(640, 760, { steps: 8 })
  await r.glide(520, 1500); await r.wait(300)
  await hoverMove(p, r, '#spn_s_abt .s1', 1200)
  await r.glide(500, 1400); await hoverMove(p, r, '#spn_s_abt .s2', 1000)
})
// CineMagicHub: hero, hero posters, Movies and Guest dropdowns, popular movies hover
await record(out + '/cinemagichub', async (p, r) => {
  await p.goto(C, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); await r.wait(1300)
  for (const t of ['captain', 'Iron man', 'Thor']) await hoverMove(p, r, `img[title="${t}"]`, 450)
  await hoverMove(p, r, 'a.dropdown-toggle >> text=Movies', 300)
  await p.locator('a.dropdown-toggle', { hasText: 'Movies' }).click(); await r.wait(1500)
  await p.keyboard.press('Escape'); await p.mouse.click(1000, 420); await r.wait(400)
  await hoverMove(p, r, 'a.dropdown-toggle >> text=Guest', 300)
  await p.locator('a.dropdown-toggle', { hasText: 'Guest' }).click(); await r.wait(1500)
  await p.keyboard.press('Escape'); await p.mouse.click(1000, 420); await r.wait(400)
  await r.glide(400, 1400); await r.wait(300)
  for (const s of ['opp', 'game', 'avatar', 'aq', 'starwar', 'dr']) await hoverMove(p, r, `img[src$="${s}.jpg"]`, 450)
  await r.wait(600)
})
