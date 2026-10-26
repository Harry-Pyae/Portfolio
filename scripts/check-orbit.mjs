// Checks the project view's explorer without a browser: run `node scripts/check-orbit.mjs`.
// At the stage sizes the dialog's grid gives at common viewports, and at the smallest design size (a
// smaller column scales the whole explorer down to fit; below 1000×520 the compact selectors take over) it sweeps a full rotation of the inner ring for every number
// of ring cards up to a full page and asserts that no two cards overlap, none crowds the centre card,
// and no card or branch label collides with another or leaves the stage. Then it checks paging, slots on
// a new selection, the turning rule (an explicit pause always wins over hover and focus), and the branch
// connection across rapid changes and pauses.
import assert from 'node:assert/strict'
import { explorerLayout, ringCard, pageSize, pageOf, alignSlots, turning, MAX_PAGE, LINK, linkAt, connectTo, fadeOut } from '../src/orbit.js'
import { branches } from '../src/content/projects.js'

// card sizes, in step with .o-card / .o-card.current in ProjectInspect.vue (narrower below 1366px)
const sizes = (vw) => (vw < 1366 ? { card: [136, 50], centre: [168, 72] } : { card: [144, 50], centre: [188, 72] })
// [viewport width, viewport height, stage width, stage height], measured from the dialog in a browser
const stages = [
  [2560, 1440, 1684, 1408],
  [1920, 1080, 1044, 1048],
  [1536, 864, 664, 832],
  [1440, 900, 579, 868],
  [1366, 768, 550, 736],
  [1280, 800, 515, 768],
  [1280, 720, 515, 688],
  [0, 0, 515, 620], // the smallest design size: smaller columns scale the whole explorer down to fit
]
const GAP = 2
const CLEAR = 12
const box = (x, y, w, h, pad = 0) => ({ l: x - w / 2 - pad, r: x + w / 2 + pad, t: y - h / 2 - pad, b: y + h / 2 + pad })
const hit = (p, q) => p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b
const inside = (p, W, H) => p.l >= 0 && p.r <= W && p.t >= 0 && p.b <= H
// a branch label's box beside its node (Inter 13.5px semibold ≈ 7.6px a character, plus the count)
function labelBox(node, name) {
  const w = name.length * 7.6 + 30
  const h = 22
  if (node.side === 'top') return box(node.x, node.y - 18, w, h)
  const x = node.side === 'right' ? node.x + 12 + w / 2 : node.x - 12 - w / 2
  return box(x, node.y, w, h)
}

const names = [...branches].reverse().map((b) => b.name) // spiral order: from the roots at the bottom
for (const [vw, vh, W, H] of stages) {
  const { card, centre } = sizes(vw)
  const L = explorerLayout(W, H, card, centre, names.length)
  const size = pageSize(L.ring)
  assert.ok(size >= 4, `${vw}×${vh}: the ring holds only ${size}`)
  const C = box(L.cx, L.cy, centre[0], centre[1], CLEAR)
  const labels = L.spiral.nodes.map((n, i) => labelBox(n, names[i]))
  labels.forEach((lb, i) => {
    assert.ok(inside(lb, W, H), `${vw}×${vh}: label ${names[i]} leaves the stage`)
    labels.slice(i + 1).forEach((q, j) => assert.ok(!hit(lb, q), `${vw}×${vh}: labels ${names[i]} and ${names[i + j + 1]} overlap`))
    assert.ok(!hit(lb, C), `${vw}×${vh}: label ${names[i]} crowds the centre card`)
  })
  assert.ok(L.captionY + 20 <= H, `${vw}×${vh}: caption below the stage`)
  let closest = Infinity
  for (let n = 1; n <= size; n++) {
    for (let k = 0; k < 720; k++) {
      const phi = k / 720
      const rects = []
      for (let i = 0; i < n; i++) {
        const c = ringCard(L.ring, phi + i / n)
        const r = box(c.x, c.y, card[0] * c.s, card[1] * c.s)
        assert.ok(inside(r, W, H) && r.b < L.captionY - 14, `${vw}×${vh}: ring card leaves its area (n=${n})`)
        assert.ok(!hit(r, C), `${vw}×${vh}: ring card crowds the centre card (n=${n}, phi=${phi.toFixed(2)})`)
        labels.forEach((lb, j) => assert.ok(!hit(r, lb), `${vw}×${vh}: ring card under label ${names[j]} (n=${n}, phi=${phi.toFixed(2)})`))
        for (const q of rects) {
          assert.ok(!hit(box(c.x, c.y, card[0] * c.s + GAP * 2, card[1] * c.s + GAP * 2), q), `${vw}×${vh}: ring cards overlap (n=${n}, phi=${phi.toFixed(2)})`)
          closest = Math.min(closest, Math.max(q.l - r.r, r.l - q.r, q.t - r.b, r.t - q.b))
        }
        rects.push(r)
      }
    }
  }
  console.log(`${vw ? `${vw}×${vh}` : `minimum ${W}×${H}`}: ring ${Math.round(L.ring.rx * 2)}×${Math.round(L.ring.ry * 2)}, ${size} cards a page, closest ${closest.toFixed(1)}px`)
}

// Branches: counts come from the content, and every project is in exactly one branch.
const ids = branches.flatMap((b) => b.items.map((p) => p.id))
assert.equal(new Set(ids).size, ids.length)
console.log(branches.map((b) => `${b.name} ${b.items.length}`).join(' · '))

// Paging: a large branch shows a bounded page, and the pages together reach every project.
{
  const many = Array.from({ length: 11 }, (_, i) => `p${i}`)
  const seen = new Set()
  const first = pageOf(many, 'p3', 4, 0)
  assert.equal(first.pages, 3)
  for (let pg = 0; pg < first.pages; pg++) {
    const pageIds = pageOf(many, 'p3', 4, pg).ids
    assert.ok(pageIds.length <= 4 && !pageIds.includes('p3'))
    pageIds.forEach((id) => seen.add(id))
  }
  assert.equal(seen.size, 10, 'every other project is on some page')
  assert.equal(pageOf(many, 'p3', 4, -1).page, 2, 'paging wraps backwards')
  assert.equal(pageOf(['a'], 'a', MAX_PAGE, 0).ids.length, 0, 'a one-project branch has an empty ring')
}

// Slots: selecting a ring card moves only the two cards that trade places; the rest stay put.
{
  const s1 = alignSlots({}, ['b', 'c', 'd', 'e']) // 'a' at the centre
  const s2 = alignSlots(s1, ['c', 'd', 'e', 'a']) // 'b' selected: it leaves the ring, 'a' returns to it
  for (const id of ['c', 'd', 'e']) assert.ok(Math.abs(s2[id] - s1[id]) < 1e-9, `${id} stays`)
  assert.ok(Math.abs((((s2.a - s1.b) % 1) + 1) % 1) < 1e-9, 'the old centre takes the slot the new one left')
}

// Turning rule.
const base = { open: true, motionOn: true, reduced: false, hover: false, focus: false }
assert.equal(turning(base), true, 'idle: turns')
assert.equal(turning({ ...base, hover: true }), false, 'pointer over the ring: holds')
assert.equal(turning({ ...base, focus: true }), false, 'keyboard focus inside: holds')
assert.equal(turning({ ...base, motionOn: false }), false, 'explicit pause: holds, and leaving never resumes it')
assert.equal(turning({ ...base, reduced: true }), false, 'reduced motion: static')
assert.equal(turning({ ...base, open: false }), false, 'closed: no motion')

// Branch connection: draws in, settles; a newer change takes over mid-way (no queue, at most the latest
// two show); paused or reduced motion is final at once.
{
  const total = LINK.DRAW + LINK.SETTLE
  let L = connectTo({ in: { i: -1, t0: -Infinity }, out: null }, 0, 0, true) // the scene opens on branch 0
  assert.deepEqual([L.in.i, L.out, linkAt(L.in, 0).drawn, linkAt(L.in, 0).busy], [0, null, 1, false], 'opens connected')
  L = connectTo(L, 1, 1000, false) // 0 → 1
  assert.equal(linkAt(L.in, 1000).drawn, 0, 'the new connection starts undrawn')
  assert.ok(linkAt(L.in, 1000 + LINK.DRAW / 2).edge === 1 && linkAt(L.in, 1000 + LINK.DRAW / 2).flow === 0, 'leading edge while drawing, no travelling light yet')
  assert.ok(L.out.i === 0 && L.out.drawn === 1 && fadeOut(L.out, 1000) === 1, 'the previous one fades from fully drawn')
  assert.equal(fadeOut(L.out, 1000 + LINK.FADE), 0, 'gone after FADE')
  L = connectTo(L, 2, 1100, false) // 1 → 2 mid-draw
  assert.ok(L.in.i === 2 && L.out.i === 1, 'the latest change wins; branch 0 is dropped, not queued')
  assert.ok(L.out.drawn > 0 && L.out.drawn < 1, 'the interrupted one fades from where it had drawn')
  const end = linkAt(L.in, 1100 + total)
  assert.deepEqual([end.drawn, end.edge, end.flow, end.busy], [1, 0, 1, false], 'settles into the plain connection')
  assert.ok(total >= 400 && total <= 560, 'about half a second in all')
  L = connectTo(L, 3, 1150, true) // paused or reduced motion
  assert.ok(L.in.i === 3 && L.out === null && linkAt(L.in, 1150).drawn === 1 && linkAt(L.in, 1150).edge === 0, 'paused: final state at once')
}
console.log('explorer checks passed')
