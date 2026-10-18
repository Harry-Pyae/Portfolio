// Replace third-party pictures with original generated artwork of the same size and file name.
// Usage: node posters.mjs <imageDir> [keep1,keep2]  (files listed in keep are left untouched)
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const [dir, keepArg = ''] = process.argv.slice(2)
const keep = new Set(keepArg.split(',').filter(Boolean))
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f) && !keep.has(f))
const b = await chromium.launch({ channel: 'msedge' })
const p = await b.newPage()
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f))
  const png = /\.png$/i.test(f)
  const src = `data:image/${png ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`
  const data = await p.evaluate(async ([src, name, png]) => {
    const img = Object.assign(new Image(), { src })
    await img.decode()
    // keep the original pixel size, capped so huge photos stay light
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
    const W = Math.round(img.naturalWidth * k)
    const H = Math.round(img.naturalHeight * k)
    let seed = [...name].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
    const c = Object.assign(document.createElement('canvas'), { width: W, height: H })
    const g = c.getContext('2d')
    const hue = Math.floor(rnd() * 360)
    const bg = g.createLinearGradient(0, 0, W * 0.4, H)
    bg.addColorStop(0, `hsl(${hue} 45% 22%)`)
    bg.addColorStop(1, `hsl(${(hue + 50) % 360} 55% 8%)`)
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)
    const S = Math.min(W, H)
    // soft light pools
    for (let i = 0; i < 4; i++) {
      const x = rnd() * W
      const y = rnd() * H
      const r = S * (0.25 + rnd() * 0.5)
      const rg = g.createRadialGradient(x, y, 0, x, y, r)
      rg.addColorStop(0, `hsla(${(hue + i * 40) % 360} 80% 60% / 0.35)`)
      rg.addColorStop(1, 'hsla(0 0% 0% / 0)')
      g.fillStyle = rg
      g.fillRect(0, 0, W, H)
    }
    // concentric arcs and a few bold geometric shapes
    g.lineWidth = Math.max(1, S * 0.006)
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = `hsla(${(hue + 180) % 360} 70% 75% / ${0.15 + rnd() * 0.3})`
      g.beginPath()
      g.arc(W * (0.3 + rnd() * 0.4), H * (0.3 + rnd() * 0.4), S * (0.1 + i * 0.09), rnd() * 6, rnd() * 6 + 3)
      g.stroke()
    }
    for (let i = 0; i < 3; i++) {
      g.fillStyle = `hsla(${(hue + 120 + i * 30) % 360} 70% 55% / 0.55)`
      const x = rnd() * W
      const y = rnd() * H
      const s = S * (0.08 + rnd() * 0.14)
      g.beginPath()
      if (i % 2) g.arc(x, y, s, 0, Math.PI * 2)
      else {
        g.moveTo(x, y - s)
        g.lineTo(x + s, y + s)
        g.lineTo(x - s, y + s)
        g.closePath()
      }
      g.fill()
    }
    // portrait images are posters: give them a title band; wide ones stay pure atmosphere
    if (H > W * 1.05 && !/(bg|main|background)/i.test(name)) {
      g.fillStyle = 'hsla(0 0% 0% / 0.45)'
      g.fillRect(0, H * 0.74, W, H * 0.26)
      g.fillStyle = 'hsl(0 0% 92%)'
      g.font = `600 ${Math.round(W * 0.075)}px Arial, sans-serif`
      g.textAlign = 'center'
      g.fillText('SAMPLE POSTER', W / 2, H * 0.885)
    }
    return c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.86).split(',')[1]
  }, [src, f, png])
  fs.writeFileSync(path.join(dir, f), Buffer.from(data, 'base64'))
  console.log('replaced', f)
}
await b.close()
