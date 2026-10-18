// Pixelate rectangles in an image (privacy). Rects are given in fractions of the image size.
// Usage: node blur.mjs <in> <out.jpg> x,y,w,h [x,y,w,h ...]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const [input, out, ...rects] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'msedge' })
const p = await b.newPage()
const src = 'data:image/jpeg;base64,' + fs.readFileSync(input).toString('base64')
const data = await p.evaluate(async ([src, rects]) => {
  const img = Object.assign(new Image(), { src })
  await img.decode()
  const W = img.naturalWidth
  const H = img.naturalHeight
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  for (const r of rects) {
    const [x, y, w, h] = r.split(',').map(Number)
    const [px, py, pw, ph] = [x * W, y * H, w * W, h * H]
    const t = Object.assign(document.createElement('canvas'), { width: 4, height: 4 })
    t.getContext('2d').drawImage(c, px, py, pw, ph, 0, 0, 4, 4)
    g.imageSmoothingEnabled = false
    g.drawImage(t, 0, 0, 4, 4, px, py, pw, ph)
  }
  return c.toDataURL('image/jpeg', 0.85).split(',')[1]
}, [src, rects])
fs.writeFileSync(out, Buffer.from(data, 'base64'))
console.log('wrote', out, Math.round(fs.statSync(out).size / 1024) + 'KB')
await b.close()
