// Procedural pizza images (local sample data for the Pizza Order screenshots).
// Usage: node pizzas.mjs <outDir>
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const out = process.argv[2]
const VARIANTS = [
  ['margherita', { cheese: '#f6d27a', top: [['#2e7d32', 6, 9]] }],
  ['pepperoni', { cheese: '#f3c969', top: [['#b3261e', 14, 16]] }],
  ['veggie', { cheese: '#f6d98c', top: [['#2e7d32', 10, 7], ['#f9a825', 8, 7], ['#6a1b9a', 7, 8]] }],
  ['bbq-chicken', { cheese: '#e9b860', top: [['#6d3b1e', 12, 11], ['#5d4037', 8, 6]] }],
  ['hawaiian', { cheese: '#f6d27a', top: [['#fdd835', 12, 10], ['#e57373', 10, 11]] }],
  ['mushroom', { cheese: '#f1d48e', top: [['#8d6e63', 14, 10]] }],
]
const b = await chromium.launch({ channel: 'msedge' })
const p = await b.newPage()
for (const [name, v] of VARIANTS) {
  const data = await p.evaluate(([v, seed]) => {
    let s = seed
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const c = Object.assign(document.createElement('canvas'), { width: 600, height: 600 })
    const g = c.getContext('2d')
    g.fillStyle = '#3e2723'
    g.fillRect(0, 0, 600, 600) // wooden board
    const disc = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    disc(300, 300, 250, '#d89a4e') // crust
    disc(300, 300, 222, '#c0392b') // sauce
    disc(300, 300, 212, v.cheese) // cheese
    for (let i = 0; i < 40; i++) disc(300 + (rnd() - 0.5) * 380, 300 + (rnd() - 0.5) * 380, 6 + rnd() * 10, 'rgba(255,240,200,0.35)')
    for (const [col, n, r] of v.top) {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 180
        disc(300 + Math.cos(a) * d, 300 + Math.sin(a) * d, r + rnd() * 4, col)
      }
    }
    g.strokeStyle = 'rgba(80,40,10,0.45)'
    g.lineWidth = 3
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(300, 300); const a = (i * Math.PI) / 4; g.lineTo(300 + Math.cos(a) * 250, 300 + Math.sin(a) * 250); g.moveTo(300, 300); g.lineTo(300 - Math.cos(a) * 250, 300 - Math.sin(a) * 250); g.stroke() }
    return c.toDataURL('image/jpeg', 0.82).split(',')[1]
  }, [v, name.length * 7919 + 13])
  fs.writeFileSync(path.join(out, `${name}.jpg`), Buffer.from(data, 'base64'))
  console.log('pizza', name)
}
await b.close()
