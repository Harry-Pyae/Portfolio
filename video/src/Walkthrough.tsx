import { loadFont } from '@remotion/google-fonts/SpaceGrotesk'
import React from 'react'
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { ACCENT, RecFrame, RecordedFrames } from './ProjectReel'

const { fontFamily } = loadFont('normal', { weights: ['500', '700'] })

// Showcase walkthrough (20–45 s): title → the recorded app, steady and near full size, with lower-third
// captions at the moments the recorder marked → end card with the repository. Site navy + restrained cyan.
export type Mark = { t: number; text: string }
export type Still = { src: string; caption: string }
export type WalkthroughProps = {
  title: string
  tagline: string
  source: string // what the footage is, e.g. "Recorded on the live site" (shown on the title and as a badge)
  repo: string // shown on the end card
  rec?: { dir: string; from?: number; to?: number; frames?: RecFrame[]; duration?: number; marks?: Mark[] }
  stills?: Still[] // screenshots used when there is no recording (each with its caption)
}

export const FPS = 30
export const TITLE = 1.8 // seconds
export const END = 2.8
const STILL = 5 // seconds per screenshot
const MAX = 45

// Playback speed and body length for a recording: real time when it fits, faster only to stay within 45 s.
export const bodyOf = (p: WalkthroughProps) => {
  if (p.stills) return { speed: 1, body: p.stills.length * STILL }
  const from = p.rec?.from ?? 0
  const len = (p.rec?.to ?? p.rec?.duration ?? 20) - from
  const speed = Math.max(1, len / (MAX - TITLE - END))
  return { speed, body: len / speed }
}

const NAVY = '#040b18'
const INK = '#eef4f8'
const INK2 = '#a9bccb'

export const Walkthrough: React.FC<WalkthroughProps> = (p) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const { speed, body } = bodyOf(p)
  const bodyFrom = Math.round(TITLE * FPS)
  const bodyFrames = Math.round(body * FPS)
  const endFrom = bodyFrom + bodyFrames
  // caption cues in composition frames
  const from = p.rec?.from ?? 0
  const marks = p.stills
    ? p.stills.map((s, i) => ({ f: bodyFrom + i * STILL * FPS, text: s.caption }))
    : (p.rec?.marks ?? []).filter((m) => m.t >= from - 0.5 && m.t < from + body * speed).map((m) => ({ f: bodyFrom + Math.round(((m.t - from) / speed) * FPS), text: m.text }))
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY, fontFamily }}>
      {/* the app, inset a little like a screen, entering gently and then holding still */}
      <Sequence from={bodyFrom} durationInFrames={bodyFrames + 12} layout="none">
        <Screen p={p} speed={speed} bodyFrames={bodyFrames} marks={marks.map((m) => m.f - bodyFrom)} />
      </Sequence>
      {marks.map((m, i) => {
        const next = marks[i + 1]?.f ?? endFrom
        const len = Math.max(30, Math.min(next - m.f, 5 * FPS))
        return (
          <Sequence key={i} from={Math.max(bodyFrom, m.f)} durationInFrames={len} layout="none">
            <Caption text={m.text} len={len} />
          </Sequence>
        )
      })}
      {/* the source label stays briefly (the title card already states it), then clears the app's header */}
      <Sequence from={bodyFrom} durationInFrames={Math.min(bodyFrames, Math.round(4.5 * FPS))} layout="none">
        <Badge text={p.source} />
      </Sequence>
      <Sequence durationInFrames={bodyFrom + 14} layout="none">
        <TitleCard {...p} />
      </Sequence>
      <Sequence from={endFrom - 10} durationInFrames={durationInFrames - endFrom + 10} layout="none">
        <EndCard {...p} />
      </Sequence>
    </AbsoluteFill>
  )
}

const Screen: React.FC<{ p: WalkthroughProps; speed: number; bodyFrames: number; marks: number[] }> = ({ p, speed, bodyFrames, marks }) => {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 18], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' })
  const leave = interpolate(frame, [bodyFrames - 6, bodyFrames + 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // soft cross-fade into each captioned section: the frame from just before the mark fades out over 0.4 s
  const cut = marks.filter((m) => m > 6 && frame >= m && frame < m + 12).pop()
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 1216,
          height: 684,
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${ACCENT}40`,
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.9)',
          background: NAVY,
          opacity: Math.min(enter, leave),
          scale: interpolate(enter, [0, 1], [0.97, 1]),
        }}
      >
        <Body p={p} speed={speed} at={frame} />
        {cut !== undefined ? (
          <div style={{ position: 'absolute', inset: 0, opacity: interpolate(frame, [cut, cut + 12], [1, 0]) }}>
            <Body p={p} speed={speed} at={cut - 4} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  )
}

// What the screen shows at body frame `at`: the recording (latest captured frame) or the current screenshot.
const Body: React.FC<{ p: WalkthroughProps; speed: number; at: number }> = ({ p, speed, at }) => {
  if (p.stills) {
    const i = Math.min(p.stills.length - 1, Math.floor(at / (STILL * FPS)))
    const local = at - i * STILL * FPS
    return (
      <AbsoluteFill>
        {i > 0 && local < 14 ? <Img src={staticFile(p.stills[i - 1].src)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
        <Img
          src={staticFile(p.stills[i].src)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: i > 0 ? interpolate(local, [0, 14], [0, 1], { extrapolateRight: 'clamp' }) : 1 }}
        />
      </AbsoluteFill>
    )
  }
  if (!p.rec?.frames) return null
  return <RecordedFrames rec={p.rec} rate={speed} at={at} />
}

const Caption: React.FC<{ text: string; len: number }> = ({ text, len }) => {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        bottom: 46,
        maxWidth: 860,
        padding: '12px 18px 12px 16px',
        borderLeft: `3px solid ${ACCENT}`,
        borderRadius: 8,
        background: 'rgba(4, 11, 24, 0.9)',
        color: INK,
        fontSize: 25,
        fontWeight: 500,
        lineHeight: 1.3,
        opacity: o,
        translate: `0px ${interpolate(o, [0, 1], [8, 0])}px`,
      }}
    >
      {text}
    </div>
  )
}

const Badge: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame()
  return (
  <div
    style={{
      opacity: interpolate(frame, [0, 10, 4.5 * FPS - 12, 4.5 * FPS], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      position: 'absolute',
      right: 56,
      top: 34,
      padding: '6px 12px',
      border: `1px solid ${ACCENT}66`,
      borderRadius: 999,
      background: 'rgba(4, 11, 24, 0.86)',
      color: ACCENT,
      fontSize: 16,
      fontWeight: 500,
    }}
  >
    {text}
  </div>
  )
}

const TitleCard: React.FC<WalkthroughProps> = ({ title, tagline, source }) => {
  const frame = useCurrentFrame()
  const end = TITLE * FPS
  const o = interpolate(frame, [0, 10, end - 2, end + 12], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 14, opacity: o }}>
      <div style={{ color: ACCENT, fontSize: 20, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{source}</div>
      <div style={{ color: INK, fontSize: 76, fontWeight: 700, letterSpacing: '-0.035em', translate: `0px ${interpolate(frame, [0, 16], [14, 0], { extrapolateRight: 'clamp' })}px` }}>
        {title}
      </div>
      <div style={{ color: INK2, fontSize: 26, maxWidth: 980, textAlign: 'center' }}>{tagline}</div>
    </AbsoluteFill>
  )
}

const EndCard: React.FC<WalkthroughProps> = ({ title, repo }) => {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 16, opacity: o }}>
      <div style={{ color: INK, fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em' }}>{title}</div>
      {repo ? <div style={{ color: ACCENT, fontSize: 24, fontWeight: 500 }}>{repo.replace(/^https:\/\//, '')}</div> : null}
    </AbsoluteFill>
  )
}
