import { record } from './hq.mjs'
// Presentation copies (third-party images replaced with generated art, labelled on the page) served on 8090.
const out = process.argv[2] ?? 'C:/Projects/Portfolio/video/public/hq'
const F = 'http://127.0.0.1:8090/fhcp/html/index.html', C = 'http://127.0.0.1:8090/cmh/html/movie%20channel.html'
const hoverMove = async (p, r, sel, ms = 500) => {
  const b = await p.locator(sel).first().boundingBox()
  if (!b) return
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 }); await r.wait(ms)
}
// narrow the window to phone width and back, to show the real responsive layout
const narrow = async (p, r, ms = 2600) => {
  await r.hold(async () => { await p.setViewportSize({ width: 390, height: 720 }); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600) })
  await r.wait(1000); await r.glide(900, 2400); await r.wait(ms)
}
// FHCP: hero, nav hover, season strip hover, season details hover, shop, then phone width
await record(out + '/fhcp', async (p, r) => {
  await p.goto(F, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); r.mark('Hand-written HTML and CSS, no JavaScript'); await r.wait(1500)
  for (const s of ['#seasons', '#shop']) await hoverMove(p, r, `#left_menu ${s}`, 450)
  await r.glide(560, 1600); await r.wait(300)
  r.mark('Season cards scale up on hover')
  for (const id of [2, 5, 8, 11, 14]) await hoverMove(p, r, `#spn_c_${id}`, 600)
  await p.mouse.move(640, 700, { steps: 8 })
  await r.glide(520, 1500); await r.wait(300)
  r.mark('Season detail blocks')
  await hoverMove(p, r, '#spn_s_abt .s1', 1300)
  await r.glide(500, 1400); await hoverMove(p, r, '#spn_s_abt .s2', 1100)
  await r.glide(900, 2200); await r.wait(800)
  r.mark('Media queries from 320 px up to 3840 px wide')
  await narrow(p, r)
})
// CineMagicHub: hero, hero posters, Movies and Guest dropdowns, popular movies hover, then phone width
await record(out + '/cinemagichub', async (p, r) => {
  await p.goto(C, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await r.start(); r.mark('Featured film and a hero grid (Bootstrap 4)'); await r.wait(1500)
  for (const t of ['captain', 'Iron man', 'Thor', 'Hulk']) await hoverMove(p, r, `img[title="${t}"]`, 500)
  r.mark('Movies and Guest dropdown menus')
  await hoverMove(p, r, 'a.dropdown-toggle >> text=Movies', 300)
  await p.locator('a.dropdown-toggle', { hasText: 'Movies' }).click(); await r.wait(1800)
  await p.keyboard.press('Escape'); await p.mouse.click(1000, 420); await r.wait(400)
  await hoverMove(p, r, 'a.dropdown-toggle >> text=Guest', 300)
  await p.locator('a.dropdown-toggle', { hasText: 'Guest' }).click(); await r.wait(1800)
  await p.keyboard.press('Escape'); await p.mouse.click(1000, 420); await r.wait(400)
  await r.glide(400, 1400); await r.wait(300)
  r.mark('Popular Movies row lifts on hover')
  for (const s of ['opp', 'game', 'avatar', 'aq', 'starwar', 'dr']) await hoverMove(p, r, `img[src$="${s}.jpg"]`, 550)
  await r.wait(600)
  r.mark('Responsive: the hero grid steps aside on small screens')
  await narrow(p, r)
})
