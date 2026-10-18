// Render the showcase walkthroughs (or the slugs given) into ../../harry-project-showcase/public/videos,
// with a poster frame each. Usage: node render-walkthroughs.mjs [slug ...]
import { execFileSync } from 'node:child_process'

const OUT = '../../harry-project-showcase/public/videos'
const all = ['blood-donation', 'internship-jp', 'flavourwave', 'ai-detection', 'astrocare-ai', 'chat-ledger', 'mymedia', 'pizza-order', 'fhcp', 'cinemagichub', 'classifile', 'summarease']
const run = (args) => execFileSync('npx', ['remotion', ...args, '--log=error'], { stdio: 'inherit', shell: process.platform === 'win32' })
for (const slug of process.argv.slice(2).length ? process.argv.slice(2) : all) {
  run(['render', 'src/index.ts', `wt-${slug}`, `${OUT}/${slug}.mp4`, '--codec=h264', '--crf=24', '--x264-preset=slow', '--jpeg-quality=95'])
  // poster: 4.6 s in (title card done, first section settled, caption showing)
  run(['still', 'src/index.ts', `wt-${slug}`, `${OUT}/${slug}.jpg`, '--frame=138', '--image-format=jpeg', '--jpeg-quality=80'])
  console.log('rendered', slug)
}
