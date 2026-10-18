// Render every reel (or the ids given) straight into the site: ../public/projects/<id>/reel.mp4
// Usage: npm run render [-- bloodcare pizza]
import { execFileSync } from 'node:child_process'

const ids = process.argv.slice(2)
const all = ['bloodcare', 'internshipjp', 'clickwise', 'flavourwave', 'astrocare', 'chatledger', 'mymedia', 'pizza', 'classifile', 'summarease', 'cinemagichub', 'fhcp']
for (const id of ids.length ? ids : all) {
  const out = `../public/projects/${id}/reel.mp4`
  execFileSync('npx', ['remotion', 'render', 'src/index.ts', id, out, '--codec=h264', '--scale=1.5', '--jpeg-quality=95', '--crf=23', '--x264-preset=slow', '--log=error'], { stdio: 'inherit', shell: process.platform === 'win32' })
  console.log('rendered', out)
}
