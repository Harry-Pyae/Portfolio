import React from 'react'
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion'
import { ProjectReel, REEL_FRAMES, ReelProps } from './ProjectReel'
import { FPS, END, TITLE, Walkthrough, WalkthroughProps, bodyOf } from './Walkthrough'

// One composition per project. Recordings are sharp frame captures of the real apps (public/hq/<id>,
// made with the scratchpad hq.mjs recorder); stills are screenshots (public/shots).
// Render: npm run render (see the README, Project reels).
const loadFrames: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  if (!props.rec) return {}
  const { frames, duration } = await (await fetch(staticFile(`${props.rec.dir}/index.json`))).json()
  return { props: { ...props, rec: { ...props.rec, frames, duration } } }
}

// Showcase walkthroughs: load the recording (frames + caption marks) and size the video to it.
const loadWalkthrough: CalculateMetadataFunction<WalkthroughProps> = async ({ props }) => {
  let p = props
  if (props.rec) {
    const { frames, duration, marks } = await (await fetch(staticFile(`${props.rec.dir}/index.json`))).json()
    p = { ...props, rec: { ...props.rec, frames, duration, marks } }
  }
  return { props: p, durationInFrames: Math.round((TITLE + bodyOf(p).body + END) * FPS) }
}

// slug (showcase URL) → walkthrough content. Captions come from the recorder's marks (video/capture).
const LOCAL = 'Recorded locally with the app’s demo data'
export const WALKTHROUGHS: Record<string, WalkthroughProps> = {
  'blood-donation': { title: 'BloodCare', tagline: 'Blood donation cards, stock and hospital requests, traceable end to end by QR.', source: LOCAL, repo: 'https://github.com/Harry-Pyae/blood-donation-card-system', rec: { dir: 'hq/bloodcare' } },
  'internship-jp': { title: 'InternshipJP', tagline: 'Internships matched on verified skills, in English and Myanmar.', source: LOCAL, repo: 'https://github.com/Harry-Pyae/InternshipJP', rec: { dir: 'hq/internshipjp' } },
  flavourwave: {
    title: 'FlavourWave',
    tagline: 'A drinks storefront with Stripe pre-orders and a delivery-tracking back office.',
    source: 'Screenshots from the project repository',
    repo: 'https://github.com/linhtutkyawdev/Axionix_FlavourWave',
    stills: [
      { src: 'shots/fw-1.jpg', caption: 'Storefront: popular drinks, ready to pre-order' },
      { src: 'shots/fw-2.jpg', caption: 'Map-based delivery location picker' },
      { src: 'shots/fw-4.jpg', caption: 'Pre-order confirmed' },
      { src: 'shots/fw-5.jpg', caption: 'Admin: pre-order performance and sales dashboards' },
    ],
  },
  'ai-detection': {
    title: 'ClickWise AI Tools Hub',
    tagline: 'Detect AI-generated text, images and audio, with scores that explain themselves.',
    source: 'Recorded on the live site (masking and quiz)',
    repo: 'https://github.com/Harry-Pyae/ai-detection-project',
    rec: { dir: 'hq/clickwise', to: 33 }, // ends before the live leaderboard, which has no scores yet
  },
  'astrocare-ai': { title: 'AstroCare', tagline: 'Astronaut health trends measured against each crew member’s own baseline.', source: 'Recorded on the live site · synthetic crew data', repo: 'https://github.com/Harry-Pyae/AstroCareAI', rec: { dir: 'hq/astrocare' } },
  'chat-ledger': { title: 'Chat to Ledger', tagline: 'Turns messy Messenger and Viber sales chats into a clean order book.', source: 'Recorded on the live site · built-in sample chats', repo: 'https://github.com/Harry-Pyae/chat-ledger', rec: { dir: 'hq/chatledger' } },
  mymedia: { title: 'MyMedia', tagline: 'A news and media admin with categories, posts and trending stats.', source: 'Recorded locally · sample posts', repo: 'https://github.com/Harry-Pyae/MyMediaProject', rec: { dir: 'hq/mymedia' } },
  'pizza-order': { title: 'Pizza Order System', tagline: 'Browse pizzas, fill a cart and order, with an admin to run the shop.', source: 'Recorded locally · sample menu', repo: 'https://github.com/Harry-Pyae/PizzaOrderSystem', rec: { dir: 'hq/pizza' } },
  fhcp: { title: 'FHCP', tagline: 'My first HTML and CSS page: a one-page fan site for the series Supernatural.', source: 'Presentation copy · original artwork replaced', repo: 'https://github.com/Harry-Pyae/FHCP', rec: { dir: 'hq/fhcp' } },
  cinemagichub: { title: 'CineMagicHub', tagline: 'An early movie-themed landing page with dropdown menus and hover effects.', source: 'Presentation copy · original artwork replaced', repo: 'https://github.com/Harry-Pyae/CineMagicHub-2023', rec: { dir: 'hq/cinemagichub' } },
  classifile: { title: 'ClassiFile', tagline: 'Sorts documents by their content: files a copy when sure, asks when not, and learns from the answers.', source: 'Desktop app · made-up documents', repo: 'https://github.com/ClariFile/ClassiFile', rec: { dir: 'hq/classifile' } },
  summarease: { title: 'SummarEase', tagline: 'Summarizes a document at the level of detail you choose, with every line linked to its source.', source: 'Desktop app · made-up document', repo: 'https://github.com/ClariFile/SummarEase', rec: { dir: 'hq/summarease' } },
}
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="bloodcare"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'BloodCare', meta: 'Personal project · 2026', logo: 'logos/bloodcare.svg', rec: { dir: 'hq/bloodcare' } }}
    />
    <Composition
      id="internshipjp"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'InternshipJP', meta: 'Personal project · 2026', logo: 'logos/internshipjp.svg', rec: { dir: 'hq/internshipjp' } }}
    />
    <Composition
      id="clickwise"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'ClickWise AI', meta: 'Major hackathon · 2026', rec: { dir: 'hq/clickwise' } }}
    />
    <Composition
      id="flavourwave"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'FlavourWave', meta: 'Major hackathon · 2023', logo: 'logos/flavourwave.png', shots: ['shots/fw-1.jpg', 'shots/fw-2.jpg', 'shots/fw-4.jpg', 'shots/fw-5.jpg'] }}
    />
    <Composition
      id="astrocare"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'AstroCare', meta: 'Small hackathon · 2026', logo: 'logos/astrocare.png', rec: { dir: 'hq/astrocare' } }}
    />
    <Composition
      id="chatledger"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'Chat to Ledger', meta: 'Small hackathon · 2026', rec: { dir: 'hq/chatledger' } }}
    />
    <Composition
      id="mymedia"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'MyMedia', meta: 'Earlier project · 2023', logo: 'logos/mymedia.png', rec: { dir: 'hq/mymedia' } }}
    />
    <Composition
      id="pizza"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'Pizza Order', meta: 'Earlier project · 2022', rec: { dir: 'hq/pizza' } }}
    />
    <Composition
      id="classifile"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'ClassiFile', meta: 'ClariFile · Release candidate', logo: 'logos/classifile.svg', rec: { dir: 'hq/classifile' } }}
    />
    <Composition
      id="summarease"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'SummarEase', meta: 'ClariFile · In development', logo: 'logos/summarease.svg', rec: { dir: 'hq/summarease' } }}
    />
    <Composition
      id="cinemagichub"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'CineMagicHub', meta: 'Where it began · 2023', logo: 'logos/cinemagichub.png', rec: { dir: 'hq/cinemagichub' } }}
    />
    <Composition
      id="fhcp"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'FHCP', meta: 'Where it began · 2022', rec: { dir: 'hq/fhcp' } }}
    />
    {Object.entries(WALKTHROUGHS).map(([slug, props]) => (
      <Composition
        key={slug}
        id={`wt-${slug}`}
        component={Walkthrough}
        calculateMetadata={loadWalkthrough}
        width={1280}
        height={720}
        fps={FPS}
        durationInFrames={30 * FPS}
        defaultProps={props}
      />
    ))}
  </>
)
