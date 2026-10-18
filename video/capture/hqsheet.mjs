// Contact sheet of ~12 evenly spaced frames from an hq recording, labelled with their times.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
const [dir, out] = process.argv.slice(2)
const { frames, duration } = JSON.parse(fs.readFileSync(dir + '/index.json', 'utf8'))
const tmp = out + '-frames'
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp)
for (let k = 0; k < 12; k++) {
  const t = (duration * k) / 12
  const fr = frames.filter((x) => x.t <= t).pop() ?? frames[0]
  fs.copyFileSync(`${dir}/${fr.f}`, `${tmp}/t${t.toFixed(1)}.jpg`)
}
execFileSync('node', ['sheet.mjs', tmp, out], { stdio: 'inherit' })
