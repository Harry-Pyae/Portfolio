// Contact sheet: every image in a folder, numbered, in one screenshot.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [dir, out] = process.argv.slice(2)
const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
const cells = files.map((f) => `<div><img src="${pathToFileURL(path.join(dir, f)).href}" style="width:100%;display:block"><div>${f}</div></div>`)
fs.writeFileSync(out + '.html', `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;font:14px sans-serif;color:#fff">${cells.join('')}</body>`)
const b = await chromium.launch({ channel: 'msedge' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto(pathToFileURL(out + '.html').href)
await p.waitForTimeout(1500)
await p.screenshot({ path: out + '.jpg', fullPage: true, type: 'jpeg', quality: 70 })
console.log(files.length, 'images')
await b.close()
