import React from 'react'
import { Composition } from 'remotion'
import { ProjectReel, REEL_FRAMES } from './ProjectReel'

// One composition per project. Clips are Playwright recordings of the real apps (public/mp4),
// stills are screenshots (public/shots). Render: npm run render
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="bloodcare"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'BloodCare', meta: 'Full-stack · 2026', accent: '#e5394d', logo: 'logos/bloodcare.svg', clip: { src: 'mp4/bloodcare.mp4', from: 2.5, to: 23 } }}
    />
    <Composition
      id="internshipjp"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'InternshipJP', meta: 'Full-stack · 2026', accent: '#3b82f6', logo: 'logos/internshipjp.svg', clip: { src: 'mp4/internshipjp.mp4', from: 2.5, to: 19.5 } }}
    />
    <Composition
      id="clickwise"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'ClickWise AI', meta: 'Hackathon · 2026', accent: '#14b8a6', clip: { src: 'mp4/clickwise.mp4', from: 0.5, to: 22 } }}
    />
    <Composition
      id="flavourwave"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'FlavourWave', meta: 'Hackathon · 2023', accent: '#f59e0b', logo: 'logos/flavourwave.png', shots: ['shots/fw-1.jpg', 'shots/fw-2.jpg', 'shots/fw-4.jpg', 'shots/fw-5.jpg'] }}
    />
    <Composition
      id="astrocare"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'AstroCare', meta: 'Hackathon · 2026', accent: '#2dd4bf', logo: 'logos/astrocare.png', clip: { src: 'mp4/astro.mp4', from: 2.5, to: 15 } }}
    />
    <Composition
      id="chatledger"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'Chat to Ledger', meta: 'Hackathon · 2026', accent: '#10b981', clip: { src: 'mp4/ledger.mp4', from: 28.5, to: 46 } }}
    />
    <Composition
      id="mymedia"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'MyMedia', meta: 'Full-stack · 2023', accent: '#94a3b8', logo: 'logos/mymedia.png', clip: { src: 'mp4/mymedia.mp4', from: 2.5, to: 18.8 } }}
    />
    <Composition
      id="pizza"
      component={ProjectReel}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'Pizza Order', meta: 'Full-stack · 2022', accent: '#ef4444', clip: { src: 'mp4/pizza.mp4', from: 5, to: 21.4 } }}
    />
  </>
)
