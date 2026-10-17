import { loadFont } from '@remotion/google-fonts/SpaceGrotesk'
import React from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  OffthreadVideo,
  Sequence,
  Track,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const { fontFamily } = loadFont('normal', { weights: ['500', '700'] })

export type ReelProps = {
  title: string
  meta: string // e.g. "Hackathon · 2026"
  accent: string
  logo?: string // file in public/logos
  clip?: { src: string; from: number; to: number } // seconds in the recording
  shots?: string[] // stills used instead of a clip
}

// 12 s at 30 fps: title hit → screen flight → end card. No narration, pure motion.
export const REEL_FRAMES = 360

export const ProjectReel: React.FC<ReelProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#040b18', fontFamily }}>
      <Starfield accent={props.accent} />
      <Track name="Scenes">
        <TitleHit name="Title hit" durationInFrames={52} {...props} />
        <ScreenFlight name="Screen flight" from={36} durationInFrames={270} {...props} />
        <EndCard name="End card" from={292} durationInFrames={68} {...props} />
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

const Starfield: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      {/* slow push through the stars gives depth without drawing attention */}
      <Interactive.Div
        name="Stars"
        style={{
          position: 'absolute',
          inset: 0,
          scale: interpolate(frame, [0, 360], [1, 1.12]),
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
        name="Accent glow"
        style={{
          position: 'absolute',
          left: 340,
          top: 60,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${accent}55, transparent)`,
          opacity: interpolate(frame, [0, 40, 360], [0, 0.9, 0.6]),
        }}
      />
      <Interactive.Div
        name="Orbit ring"
        style={{
          position: 'absolute',
          left: 190,
          top: -90,
          width: 900,
          height: 900,
          borderRadius: '50%',
          border: `1px solid ${accent}40`,
          rotate: interpolate(frame, [0, 360], ['0deg', '40deg']),
        }}
      >
        <div style={{ position: 'absolute', left: 445, top: -5, width: 10, height: 10, borderRadius: '50%', background: accent, boxShadow: `0 0 18px ${accent}` }} />
      </Interactive.Div>
    </AbsoluteFill>
  )
}

/* ---------------------------------------------------------------- scene 1 */
const TitleHitInner: React.FC<ReelProps> = ({ title, meta, accent }) => {
    const frame = useCurrentFrame()
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Interactive.Div
          name="Light streak"
          style={{
            position: 'absolute',
            top: 358,
            left: 0,
            width: 1280,
            height: 4,
            background: `linear-gradient(90deg, transparent, ${accent}, #ffffff, ${accent}, transparent)`,
            translate: interpolate(frame, [0, 18], ['-1300px 0px', '1300px 0px'], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }),
          }}
        />
        <Interactive.Div
          name="Title"
          style={{
            color: '#eef4f8',
            fontSize: 112,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            textShadow: `0 0 40px ${accent}88`,
            scale: interpolate(frame, [4, 22], [1.7, 1], { easing: Easing.out(Easing.exp), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            opacity: interpolate(frame, [4, 12, 38, 50], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            filter: `blur(${interpolate(frame, [4, 20], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
            translate: interpolate(frame, [38, 50], ['0px 0px', '0px -60px'], { easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Meta"
          style={{
            position: 'absolute',
            top: 450,
            color: accent,
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: interpolate(frame, [16, 24, 38, 46], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {meta}
        </Interactive.Div>
      </AbsoluteFill>
    )
  }
const TitleHit = Interactive.create({ Component: TitleHitInner, layout: 'absolute-fill', componentName: 'TitleHit' })

/* ---------------------------------------------------------------- scene 2 */
const ScreenFlightInner: React.FC<ReelProps> = ({ accent, clip, shots }) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()
    // 3D camera path: fly in tilted → settle face-on → punch in on the action → bank away
    const ry = interpolate(frame, [0, 34, 120, 150, 200, 236, 270], [-38, -9, 5, 0, -6, -6, 28], { easing: Easing.inOut(Easing.cubic) })
    const rx = interpolate(frame, [0, 34, 150, 236, 270], [20, 7, 3, 4, 10], { easing: Easing.inOut(Easing.cubic) })
    const sc = interpolate(frame, [0, 34, 120, 140, 172, 200, 236, 270], [0.5, 0.8, 0.85, 1.18, 1.18, 0.86, 0.86, 0.55], { easing: Easing.inOut(Easing.cubic) })
    const tx = interpolate(frame, [236, 270], [0, -420], { easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp' })
    const ty = interpolate(frame, [0, 34], [160, 0], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' })
    const clipFrames = 270
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1600 }}>
        <Interactive.Div
          name="Screen"
          style={{
            width: 1120,
            height: 630,
            borderRadius: 18,
            overflow: 'hidden',
            border: `1px solid ${accent}99`,
            boxShadow: `0 40px 120px -30px rgba(0,0,0,0.9), 0 0 60px -10px ${accent}88`,
            background: '#0b1220',
            opacity: interpolate(frame, [0, 10, 252, 270], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            transform: `translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
          }}
        >
          {clip ? (
            <OffthreadVideo
              src={staticFile(clip.src)}
              trimBefore={Math.round(clip.from * fps)}
              playbackRate={(clip.to - clip.from) / (clipFrames / fps)}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <StillsSequence shots={shots ?? []} />
          )}
          {/* light sweep across the glass */}
          <Interactive.Div
            name="Sheen"
            style={{
              position: 'absolute',
              top: -200,
              left: 0,
              width: 260,
              height: 1100,
              rotate: '20deg',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
              translate: interpolate(frame, [30, 70, 196, 228], ['-500px 0px', '1500px 0px', '-500px 0px', '1500px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}
          />
        </Interactive.Div>
      </AbsoluteFill>
    )
  }
const ScreenFlight = Interactive.create({ Component: ScreenFlightInner, layout: 'absolute-fill', componentName: 'ScreenFlight' })

// Stills cut on the beat, each pushing in slightly (used when there is no recording).
const StillsSequence: React.FC<{ shots: string[] }> = ({ shots }) => {
  const per = Math.floor(270 / Math.max(1, shots.length))
  return (
    <AbsoluteFill>
      {shots.map((s, i) => (
        <Sequence key={s} from={i * per} durationInFrames={per + 8} layout="absolute-fill">
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
        opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
        scale: interpolate(frame, [0, 60], [1.08, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }),
      }}
    />
  )
}

/* ---------------------------------------------------------------- scene 3 */
const EndCardInner: React.FC<ReelProps> = ({ title, meta, accent, logo }) => {
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
            border: `2px solid ${accent}`,
            scale: interpolate(frame, [0, 30], [0.2, 2.6], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }),
            opacity: interpolate(frame, [0, 6, 30], [0, 0.8, 0], { extrapolateRight: 'clamp' }),
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
              scale: interpolate(frame, [0, 16], [0.4, 1], { easing: Easing.out(Easing.back(1.6)), extrapolateRight: 'clamp' }),
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
            color: accent,
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
