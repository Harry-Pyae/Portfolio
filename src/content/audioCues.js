// The soundtrack, in one editable place. Times are seconds in the source file.
//
// tracks.main plays while browsing the portfolio; tracks.inspect is the source of every project excerpt.
// cues[id]: which part of tracks.inspect plays while that project (or the ClariFile suite overview) is
// inspected. fadeIn / fadeOut are seconds; volume is 0–1 relative to the soundtrack volume.
// An excerpt loops between start and end while the visitor stays on the project.
//
// Boundaries come from signal analysis (notes/soundtrack.md), not from listening: they sit on the
// track's beat grid (150 BPM, 0.4 s beats), snapped to zero crossings, where the music after the end
// matches the music after the start. Volumes even out loudness to a common target (−14.5 dB RMS);
// the quiet intro can't be raised above 1, so the earliest projects stay about 4 dB calmer.
export const tracks = {
  // main is ~2 dB louder than the inspect track's full section: 0.39 lands both at the same level.
  main: { src: 'audio/architecture-of-stillness.mp3', volume: 0.39 },
  inspect: { src: 'audio/across-the-glass-horizon.mp3', volume: 0.55 },
}

// Crossfade used when switching between the main soundtrack and an excerpt, or between excerpts
// (three beats of the inspect track; the main track is slow and ambient, so it tolerates the same).
export const crossfadeSeconds = 1.2

// Sections of across-the-glass-horizon (158.6 s): ambient intro 0–25 · lighter rhythmic build 25–61
// (a breath with few onsets at 53–61) · full section 61–128 (darker and steadier from ~100) · quiet outro.
export const cues = {
  // Full section, longest loop (51 s): the largest project gets the fullest stretch.
  bloodcare: { start: 76.01, end: 127.21, fadeIn: 0.8, fadeOut: 0.8, volume: 0.56 },
  // Full section from its first bars (38 s); cleanest seam in that range.
  internshipjp: { start: 64.81, end: 103.21, fadeIn: 0.8, fadeOut: 0.8, volume: 0.54 },
  // Rhythmic build (29 s) for the suite overview, a step down from the full section.
  clarifile: { start: 28.01, end: 56.811, fadeIn: 0.8, fadeOut: 0.8, volume: 0.83 },
  // Steadier, darker end of the full section (29 s): even energy for a document tool.
  classifile: { start: 98.41, end: 127.21, fadeIn: 0.8, fadeOut: 0.8, volume: 0.57 },
  // Same steady region as its companion app: its own window (104.8–127.2) had the worst seam, so reused.
  summarease: { start: 98.41, end: 127.21, fadeIn: 0.8, fadeOut: 0.8, volume: 0.57 },
  // Full section, later window (45 s), overlapping BloodCare's: best seam for a long loop.
  flavourwave: { start: 82.409, end: 127.21, fadeIn: 0.8, fadeOut: 0.8, volume: 0.56 },
  // Full section, middle window (32 s).
  clickwise: { start: 68.009, end: 100.01, fadeIn: 0.8, fadeOut: 0.8, volume: 0.54 },
  // Lighter rhythmic build (26 s) for the smaller hackathon builds; best seam on the whole track.
  astrocare: { start: 28.01, end: 53.61, fadeIn: 0.8, fadeOut: 0.8, volume: 0.83 },
  // Build into the breath before the full section (26 s).
  chatledger: { start: 34.409, end: 60.011, fadeIn: 0.8, fadeOut: 0.8, volume: 0.81 },
  // Build (22 s) for the earlier work.
  mymedia: { start: 32.808, end: 55.209, fadeIn: 0.8, fadeOut: 0.8, volume: 0.83 },
  // Build (22 s), a bar earlier than MyMedia's window.
  pizza: { start: 31.211, end: 53.61, fadeIn: 0.8, fadeOut: 0.8, volume: 0.82 },
  // Ambient intro (21 s), no rhythmic onsets: the calmest part for the earliest pages; longer fades.
  fhcp: { start: 2.41, end: 23.21, fadeIn: 1.5, fadeOut: 1.5, volume: 1 },
  // Ambient intro from its opening (21 s).
  cinemagichub: { start: 0.809, end: 21.61, fadeIn: 1.5, fadeOut: 1.5, volume: 1 },
}
