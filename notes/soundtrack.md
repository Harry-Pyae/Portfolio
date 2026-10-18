# Soundtrack notes

Facts about the two supplied tracks and how the project excerpts in `src/content/audioCues.js` were chosen.

## The files

| | `architecture-of-stillness.mp3` (main) | `across-the-glass-horizon.mp3` (project excerpts) |
| --- | --- | --- |
| Source file in the repo root | `Architecture_of_Stillness.mp3` | `Across_the_Glass_Horizon.mp3` |
| Format | MPEG-1 Layer III (MP3), ID3v2.3 tag | MPEG-1 Layer III (MP3), ID3v2.3 tag |
| Bitrate / sample rate / channels | 192 kb/s CBR, 44.1 kHz, stereo | 192 kb/s CBR, 44.1 kHz, stereo |
| Duration | 147.91 s (2:27.91) | 158.64 s (2:38.64) |
| Size | 3.56 MB | 3.81 MB |
| Text tags | none (no title, artist or licence) | none |
| Embedded provenance | C2PA manifest signed by Google: "Created by Google Generative AI", "Applied imperceptible SynthID watermark" | same |
| Loudness (mono RMS) | −11.4 dB over the body (first/last 5 s excluded) | −12.1 dB overall |
| Tempo estimate | ≈ 61.5 BPM (slow, ambient) | 150 BPM (0.4 s beats, 1.6 s bars) |

**Licensing (for the author):** the files carry no licence or usage information. The C2PA data only says they were generated with Google's generative AI. Whether they can be published in a public portfolio depends on the terms of the Google product used to make them and on your account. Please confirm before the audio is committed or deployed; until then `public/audio/` is git-ignored.

## Structure of across-the-glass-horizon

From per-second loudness, onset density, spectral centroid and a self-similarity novelty curve:

| Time (s) | Section | Character (measured) |
| --- | --- | --- |
| 0–25 | Ambient intro | ≈ −25 dB, no rhythmic onsets, low centroid |
| 25–53 | Lighter rhythmic build | ≈ −17.5 dB, moderate onset density |
| 53–61 | Breath | same loudness, few onsets |
| 61–128 | Full section | ≈ −13.8 dB, dense onsets; darker and steadier (lower centroid) from ≈ 100 s |
| 129–158 | Outro | ≈ −30 dB, sparse, fading to silence |

Novelty peaks (section changes) at 25, 53, 61 and 129 s.

## Method

1. Decoded with ffmpeg (from `imageio-ffmpeg`) to mono float PCM; analysed with numpy (2048-sample frames, 512 hop at 22.05 kHz).
2. Onset strength from positive spectral flux; tempo from its autocorrelation, refined by searching period and phase that put the most onset energy on the grid → 150.00 BPM. The downbeat is ambiguous between two beat phases half a bar apart (equal accent), so loop points are on beats that may be mid-bar.
3. Candidate excerpts: every pair of grid bars (minus 20 ms, just before the hit) within a section and a length range. Each was scored on its loop seam (jumping from end back to start):
   - spectral distance between the second after `end` and the second after `start`
   - spectral distance between the seconds before each
   - loudness difference across the jump
   - onset energy right at the cut (never cut through a hit)
4. Boundaries were then snapped to the nearest upward zero crossing (±6 ms).
5. Each seam was rendered (last 2 s + first 2 s) and measured. The spectral jump at the splice is compared with the same moment played straight through, and with the sample step and the level step. SummarEase's own window (104.8–127.2 s) had the worst seam (+3.1 dB step, spectral jump z 1.07 against −0.01 straight-through). It now reuses ClassiFile's region instead.
6. Volume per cue = 10^((−14.5 − excerpt RMS) / 20), capped at 1. The main track's volume (0.39) puts it at the same output level as the full-section excerpts at the inspect volume (0.55): both land at ≈ −19.6 dB.

## Cues

| Project | Start–end (s) | Length | Section | Excerpt RMS | Volume | Seam: spectral z (straight-through) | Level step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bloodcare | 76.010–127.210 | 51.2 s | full | −9.4 dB | 0.56 | 0.15 (−0.01) | +1.4 dB |
| internshipjp | 64.810–103.210 | 38.4 s | full | −9.2 dB | 0.54 | 0.76 (0.53) | −0.6 dB |
| flavourwave | 82.409–127.210 | 44.8 s | full | −9.4 dB | 0.56 | 0.37 (−0.01) | +1.4 dB |
| clickwise | 68.009–100.010 | 32.0 s | full | −9.2 dB | 0.54 | 0.15 (−0.08) | +0.7 dB |
| clarifile (suite) | 28.010–56.811 | 28.8 s | build | −12.9 dB | 0.83 | −0.05 (0.40) | −0.4 dB |
| classifile | 98.410–127.210 | 28.8 s | full, steady end | −9.6 dB | 0.57 | 0.40 (−0.01) | +2.1 dB |
| summarease | 98.410–127.210 | 28.8 s | same as ClassiFile | −9.6 dB | 0.57 | 0.40 (−0.01) | +2.1 dB |
| astrocare | 28.010–53.610 | 25.6 s | build | −12.8 dB | 0.83 | −0.31 (−0.14) | +1.7 dB |
| chatledger | 34.409–60.011 | 25.6 s | build → breath | −12.7 dB | 0.81 | −0.14 (−0.27) | +0.9 dB |
| mymedia | 32.808–55.209 | 22.4 s | build | −12.8 dB | 0.83 | −0.15 (0.27) | −0.9 dB |
| pizza | 31.211–53.610 | 22.4 s | build | −12.8 dB | 0.82 | 0.23 (−0.14) | +1.7 dB |
| fhcp | 2.410–23.210 | 20.8 s | ambient intro | −18.6 dB | 1.00 | 0.19 (1.32) | +1.1 dB |
| cinemagichub | 0.809–21.610 | 20.8 s | ambient intro | −18.6 dB | 1.00 | −0.70 (0.10) | −2.1 dB |

The assignments follow only what is verified about each project:
- **Full section:** the large and major projects (BloodCare, InternshipJP, FlavourWave, ClickWise).
- **Lighter build:** the smaller hackathon builds, the earlier work and the ClariFile overview.
- **Steadier end of the full section:** the two document tools.
- **Ambient intro:** the two earliest pages.

Several projects share a region where that region gave the best seam; no project is given a story.

Fades are 0.8 s (two beats) on rhythmic excerpts and 1.5 s on the ambient intro. `crossfadeSeconds` is 1.2 s (three beats).

## Limitations

- **Chosen by analysis, not by ear.** Every boundary was picked by signal analysis; I could not listen to the music. Melodic phrasing, vocals (none were detected as separate, but this wasn't analysed) and how the loops actually sound should be checked by ear, then adjusted in `audioCues.js`.
- **Downbeat uncertainty.** The downbeat is uncertain by half a bar (see Method, step 2).
- **Seeking precision.** Browser `<audio>` seeking is not sample-accurate, so the zero-crossing snap only helps if the player fades at each loop point. The configured fades assume it does.
- **Loudness measure.** Loudness is plain RMS, not perceptual (LUFS) loudness.
