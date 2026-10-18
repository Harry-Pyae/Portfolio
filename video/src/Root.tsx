import React from 'react'
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion'
import { ProjectReel, REEL_FRAMES, ReelProps } from './ProjectReel'

// One composition per project. Recordings are sharp frame captures of the real apps (public/hq/<id>,
// made with the scratchpad hq.mjs recorder); stills are screenshots (public/shots).
// Render: npm run render (see the README, Project reels).
const loadFrames: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  if (!props.rec) return {}
  const { frames, duration } = await (await fetch(staticFile(`${props.rec.dir}/index.json`))).json()
  return { props: { ...props, rec: { ...props.rec, frames, duration } } }
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
      defaultProps={{ title: 'BloodCare', meta: 'Personal project · 2026', accent: '#e5394d', logo: 'logos/bloodcare.svg', rec: { dir: 'hq/bloodcare' } }}
    />
    <Composition
      id="internshipjp"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'InternshipJP', meta: 'Personal project · 2026', accent: '#3b82f6', logo: 'logos/internshipjp.svg', rec: { dir: 'hq/internshipjp' } }}
    />
    <Composition
      id="clickwise"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'ClickWise AI', meta: 'Major hackathon · 2026', accent: '#14b8a6', rec: { dir: 'hq/clickwise' } }}
    />
    <Composition
      id="flavourwave"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'FlavourWave', meta: 'Major hackathon · 2023', accent: '#f59e0b', logo: 'logos/flavourwave.png', shots: ['shots/fw-1.jpg', 'shots/fw-2.jpg', 'shots/fw-4.jpg', 'shots/fw-5.jpg'] }}
    />
    <Composition
      id="astrocare"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'AstroCare', meta: 'Small hackathon · 2026', accent: '#2dd4bf', logo: 'logos/astrocare.png', rec: { dir: 'hq/astrocare' } }}
    />
    <Composition
      id="chatledger"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'Chat to Ledger', meta: 'Small hackathon · 2026', accent: '#10b981', rec: { dir: 'hq/chatledger' } }}
    />
    <Composition
      id="mymedia"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'MyMedia', meta: 'Earlier project · 2023', accent: '#94a3b8', logo: 'logos/mymedia.png', rec: { dir: 'hq/mymedia' } }}
    />
    <Composition
      id="pizza"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'Pizza Order', meta: 'Earlier project · 2022', accent: '#ef4444', rec: { dir: 'hq/pizza' } }}
    />
    <Composition
      id="classifile"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'ClassiFile', meta: 'ClariFile · Release candidate', accent: '#0d9488', logo: 'logos/classifile.svg', rec: { dir: 'hq/classifile' } }}
    />
    <Composition
      id="summarease"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'SummarEase', meta: 'ClariFile · In development', accent: '#6c47ff', logo: 'logos/summarease.svg', rec: { dir: 'hq/summarease' } }}
    />
    <Composition
      id="cinemagichub"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'CineMagicHub', meta: 'Where it began · 2023', accent: '#e11d48', logo: 'logos/cinemagichub.png', rec: { dir: 'hq/cinemagichub' } }}
    />
    <Composition
      id="fhcp"
      component={ProjectReel}
      calculateMetadata={loadFrames}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={REEL_FRAMES}
      defaultProps={{ title: 'FHCP', meta: 'Where it began · 2022', accent: '#94a3b8', rec: { dir: 'hq/fhcp' } }}
    />
  </>
)
