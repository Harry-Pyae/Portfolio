import { loadFont } from '@remotion/google-fonts/SpaceGrotesk'
import React from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  Sequence,
  Track,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const { fontFamily } = loadFont('normal', { weights: ['500', '700'] })

export type RecFrame = { f: string; t: number }

export type ReelProps = {
  title: string
  meta: string // e.g. "Hackathon · 2026"
  logo?: string // file in public/logos
  // Sharp walkthrough recording: JPEG frames + index.json in public/<dir> (see scratchpad hq.mjs).
  // from / to trim it (seconds); frames are filled in by calculateMetadata in Root.tsx.
  rec?: { dir: string; from?: number; to?: number; frames?: RecFrame[]; duration?: number }
  shots?: string[] // screenshots used when there is no recording
}

// 16 s at 30 fps: title → recorded walkthrough → end card. No narration. The site's player labels
// these as chapters (CHAPTERS in src/components/ProjectModal.vue), so keep both in sync.
export const REEL_FRAMES = 480
const SCREEN_FROM = 34
const SCREEN_FRAMES = 400 // the recording plays across this window (about 1.5x real time)
const END_FROM = 420

// The site's restrained cyan, shared by every reel (no per-project brand colours or gradients).
export const ACCENT = '#50d9e8'

export const ProjectReel: React.FC<ReelProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#040b18', fontFamily }}>
      <Starfield />
      <Track name="Scenes">
        <TitleHit name="Title" durationInFrames={SCREEN_FROM + 2} {...props} />
        <ScreenFlight name="Walkthrough" from={SCREEN_FROM} durationInFrames={SCREEN_FRAMES} {...props} />
        <EndCard name="End card" from={END_FROM} durationInFrames={REEL_FRAMES - END_FROM} {...props} />
      </Track>
    </AbsoluteFill>
  )
}

/* ---------------------------------------------------------------- background */
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: random(`x${i}`) * 1280,
  y: random(`y${i}`) * 720,
  r: 0.5 + random(`r${i}`) * 1.4,
  o: 0.25 + random(`o${i}`) * 0.6,
}))

const Starfield: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      {/* slow push through the stars gives depth without drawing attention */}
      <Interactive.Div
        name="Stars"
        style={{
          position: 'absolute',
          inset: 0,
          scale: interpolate(frame, [0, REEL_FRAMES], [1, 1.08]),
        }}
      >
        {STARS.map((s, i) => (
          <div
            key={i}
            style={{ position: 'absolute', left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: '50%', background: '#dff6ff', opacity: s.o }}
          />
        ))}
      </Interactive.Div>
      <Interactive.Div
        name="Orbit ring"
        style={{
          position: 'absolute',
          left: 190,
          top: -90,
          width: 900,
          height: 900,
          borderRadius: '50%',
          border: `1px solid ${ACCENT}30`,
          rotate: interpolate(frame, [0, REEL_FRAMES], ['0deg', '30deg']),
        }}
      >
        <div style={{ position: 'absolute', left: 445, top: -5, width: 10, height: 10, borderRadius: '50%', background: ACCENT, opacity: 0.7 }} />
      </Interactive.Div>
    </AbsoluteFill>
  )
}

/* ---------------------------------------------------------------- scene 1 */
const TitleHitInner: React.FC<ReelProps> = ({ title, meta }) => {
    const frame = useCurrentFrame()
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Interactive.Div
          name="Title"
          style={{
            color: '#eef4f8',
            fontSize: 112,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            
            scale: interpolate(frame, [2, 24], [1.12, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            opacity: interpolate(frame, [2, 12, 24, 34], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            filter: `blur(${interpolate(frame, [2, 18], [6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
            translate: interpolate(frame, [24, 34], ['0px 0px', '0px -30px'], { easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Meta"
          style={{
            position: 'absolute',
            top: 450,
            color: ACCENT,
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: interpolate(frame, [10, 16, 24, 32], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {meta}
        </Interactive.Div>
      </AbsoluteFill>
    )
  }
const TitleHit = Interactive.create({ Component: TitleHitInner, layout: 'absolute-fill', componentName: 'TitleHit' })

/* ---------------------------------------------------------------- scene 2 */
const ScreenFlightInner: React.FC<ReelProps> = ({ rec, shots }) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()
    // Gentle 3D only on entry and exit; face-on, near full size and steady while the app is on screen.
    const E = SCREEN_FRAMES
    const c = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
    const ry = interpolate(frame, [0, 40, E - 40, E], [-16, 0, 0, 12], c)
    const rx = interpolate(frame, [0, 40, E - 40, E], [9, 0, 0, 5], c)
    const sc = interpolate(frame, [0, 40, E - 40, E], [0.84, 0.97, 1, 0.84], c)
    const tx = interpolate(frame, [E - 40, E], [0, -140], { easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp' })
    const ty = interpolate(frame, [0, 40], [70, 0], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' })
    const clipFrames = E
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1600 }}>
        <Interactive.Div
          name="Screen"
          style={{
            width: 1200,
            height: 675,
            borderRadius: 18,
            overflow: 'hidden',
            border: `1px solid ${ACCENT}55`,
            boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9)',
            background: '#0b1220',
            opacity: interpolate(frame, [0, 12, E - 18, E], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            transform: `translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
          }}
        >
          {rec?.frames ? (
            <RecordedFrames rec={rec} rate={Math.min(1.6, Math.max(0.85, ((rec.to ?? rec.duration ?? 0) - (rec.from ?? 0)) / (clipFrames / fps)))} />
          ) : (
            <StillsSequence shots={shots ?? []} />
          )}
        </Interactive.Div>
      </AbsoluteFill>
    )
  }
const ScreenFlight = Interactive.create({ Component: ScreenFlightInner, layout: 'absolute-fill', componentName: 'ScreenFlight' })

// Plays a frame recording: each composition frame shows the latest captured frame at that moment,
// so static stretches cost nothing and the browser's own crisp pixels go straight into the render.
// `at` shows a specific frame of the sequence instead of the current one (used for cross-fades).
export const RecordedFrames: React.FC<{ rec: NonNullable<ReelProps['rec']>; rate: number; at?: number }> = ({ rec, rate, at }) => {
  const current = useCurrentFrame()
  const frame = at ?? current
  const { fps } = useVideoConfig()
  const frames = rec.frames ?? []
  const t = (rec.from ?? 0) + (frame / fps) * rate
  let lo = 0
  let hi = frames.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (frames[mid].t <= t) lo = mid
    else hi = mid - 1
  }
  if (!frames.length) return null
  return <Img src={staticFile(`${rec.dir}/${frames[lo].f}`)} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#040b18' }} />
}

// Screenshots crossfading slowly, each easing in slightly (used when there is no recording).
const StillsSequence: React.FC<{ shots: string[] }> = ({ shots }) => {
  const per = Math.floor(SCREEN_FRAMES / Math.max(1, shots.length))
  return (
    <AbsoluteFill>
      {shots.map((s, i) => (
        <Sequence key={s} from={i * per} durationInFrames={per + 14} layout="absolute-fill">
          <Still src={s} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
const Still: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame()
  return (
    <Img
      name="Still"
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top',
        opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' }),
        scale: interpolate(frame, [0, 90], [1.03, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }),
      }}
    />
  )
}

/* ---------------------------------------------------------------- scene 3 */
const EndCardInner: React.FC<ReelProps> = ({ title, meta, logo }) => {
    const frame = useCurrentFrame()
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 18 }}>
        <Interactive.Div
          name="Ring burst"
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: `1px solid ${ACCENT}`,
            scale: interpolate(frame, [0, 36], [0.6, 1.8], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }),
            opacity: interpolate(frame, [0, 8, 36], [0, 0.45, 0], { extrapolateRight: 'clamp' }),
          }}
        />
        {logo ? (
          <Img
            name="Logo"
            src={staticFile(logo)}
            style={{
              width: 96,
              height: 96,
              objectFit: 'contain',
              borderRadius: 22,
              scale: interpolate(frame, [0, 18], [0.85, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }),
              opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          />
        ) : null}
        <Interactive.Div
          name="End title"
          style={{
            color: '#eef4f8',
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            translate: interpolate(frame, [4, 22], ['0px 30px', '0px 0px'], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            opacity: interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="End meta"
          style={{
            color: ACCENT,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {meta}
        </Interactive.Div>
      </AbsoluteFill>
    )
  }
const EndCard = Interactive.create({ Component: EndCardInner, layout: 'absolute-fill', componentName: 'EndCard' })
