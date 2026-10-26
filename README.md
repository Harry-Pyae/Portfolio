# Harry · Portfolio

Dark portfolio built as one continuous cosmic tree: the hero's spiral of light (with the project carousel orbiting it) continues down the page as a twisting trunk, branches out to the projects, the ClariFile suite, About, Skills and Contact, and opens into roots in the footer, where the earliest projects sit. The look is a calm deep-space telemetry interface: navy-slate surfaces, one warm amber accent for selected controls, active navigation and the points where branches meet content, a cool teal tree and orbit, Inter throughout with monospace only for small metadata, and a quiet starfield. There is one permanent palette (no theme switch). Vue 3 + Vite, frontend only. Builds to static files that can be hosted anywhere (GitHub Pages, Netlify, Vercel, any web server or sub-path).

```bash
npm install
npm run dev       # local dev server
npm run build     # static build in dist/
npm run preview   # serve dist/ locally
npm run check     # project view geometry: no overlaps through a full rotation at common screen sizes, paging, pause rules, branch-change interruptions
```

## Editing content

| What | Where |
| --- | --- |
| Name, title, intro, About paragraphs, milestones, skills (core, general, currently exploring), interests (Beyond the Code), contact lede and links, portrait | `src/content/profile.js` |
| Projects, suites, their groups and order, which seven entries appear in the hero spiral, and the engineering story | `src/content/projects.js` |
| Soundtrack: the two tracks, their volumes, the crossfade, and each project's excerpt (start, end, fades, volume) | `src/content/audioCues.js` (method in `notes/soundtrack.md`) |
| Carousel speed, orbit width, depth, trunk shape (radius, turns, strands), halo strength, hover zoom | `src/content/motion.js` |
| Colours and fonts (Inter for headings and body, system monospace for small metadata; control and card radii) | semantic tokens at the top of `src/style.css` (`--accent`, `--glow-trunk`, `--glow-branch`, `--glow-spark`, `--glow-pale`) |

- **Portrait:** put a photo in `public/` (e.g. `public/harry.jpg`) and set `portrait: 'harry.jpg'`.
- **Contact:** fill `href` (`mailto:` or `https://`) and `text`. Entries without an `href` are hidden. There is deliberately no contact form.
- **Projects** (`src/content/projects.js`):
  - `categories`: the groups in display order (Recent projects, Hackathon projects, More hackathon projects, Earlier work, then In development and Where it began). Groups without `section` are branches of the project tree; `section: 'explorations'` and `section: 'roots'` place a group in its own part of the page. `lead: true` gives a group's cards slightly more emphasis and `quiet: true` a smaller, calmer branch; `label` is the default kind of project shown on hero cards and in the project view (a project's own `kind` overrides it).
  - `featured`: the project or suite ids shown in the hero spiral, in order (seven by default). Every project is also on the page, in the order of the `projects` array within each group.
  - `suites`: a suite (ClariFile) groups related apps; it is not a project itself. `apps` lists its app ids, `status` its development status, `integration` how the apps relate as currently planned. Its card opens an overview that leads to each app; an app names its suite with `suite`.
  - `story`: the "Getting pagination right" engineering story (`year`, `label`, `title`, `teaser`, short `parts`, an illustrative `code` sample). With `project: null` it is a fixed card in About whose full text opens in an overlay; set `project` to an id to show it inside that project instead.
  - Each project: `tagline` (the one sentence on cards), `problem` and `solution` (one or two sentences each), `highlights` (a few verified features), `contribution` (only where documented; leave `null` to hide the section), `context` (team, scope or time constraints when known, or the project's place in your journey), `stack`, `year`, `links` (`demo`, `github`; leave `''` to hide), `image` (cover and video poster), `gallery` (screenshots), `icon` (optional logo), `video` (walkthrough reel) and `status` (optional development status, shown on cards and in details).
  - Media lives in `public/projects/<id>/` (`1.jpg`…, `icon.*`, `reel.mp4`). A fact that isn't confirmed is simply left out, never shown as a placeholder on the page.
- The page `<title>` and meta description live in `index.html`.

## Structure

```
src/
  content/              editable data (profile, projects, motion)
  state.js              shared UI state: motion on/off, reduced motion, theme, open project, hero visibility
  audio.js              the one soundtrack controller: main track, project excerpts (sample-accurate loops), crossfades
  tree.js               shared tree model: fibres, hero exit (join geometry), flow timing, lit project
  wisps.js              textured nebula behind the carousel, generated once and cached
  reveal.js             one-time section entrances + off-screen pause
  components/
    SkyBackdrop.vue      fixed sky: two star layers with scroll parallax, a few twinkles and dust
    SiteNav.vue          compact floating navbar: identity, section links with an active mark, motion toggle (one row down to phones)
    HeroIntro.vue        portrait, name, intro, actions
    SpiralShowcase.vue   carousel + upper tree (the single requestAnimationFrame loop), side arrows
    TreeTrunk.vue        the continuous trunk below the hero, all branches, footer roots
    ProjectTree.vue      branching project layout (static cards); SHIFT / REACH set each group's place left or right of centre, so the trunk takes a few broad bends
    ExplorationsSection.vue  In development: the ClariFile suite node, its two apps, a static "Planned integration" connector
    BeganSection.vue     Where it began: the earliest projects, set among the footer roots
    InterestsSection.vue Beyond the Code: interests with small line drawings (not interactive)
    ProjectNode.vue      compact project card: one button with symbol, title, sentence (+ category in the hero), connection point
    ProjectInspect.vue   in-page project inspection: a branch explorer (branch labels on a spiral, the active branch's projects on a ring around the selected one); case study (reel, captioned media with a screenshot viewer, problem/solution, contribution, highlights, links); #/project/<id> history entries
    MusicPill.vue        music button: turns the theme on and off; floats bottom-right on the page, sits in the project view's header
    ProjectArt.vue       screenshot, or a placeholder / small glyph with an orbit line
    AboutSection.vue     identity in an orbital frame, first-person narrative, milestones branch
    SkillsConstellation.vue  skills as small constellations, plus Currently exploring
    ContactSection.vue   contact with the tree's beacon node: email, GitHub, LinkedIn
```

## How the carousel works

Cards ride a looping track measured in "slots". The visible column is the first `visibleSlots` of the track, and the rest is an off-screen queue. A card's height on the track sets its angle around the light trunk; `cos(angle)` sets depth, which drives scale, dimming and z-order. Opacity is 0 outside the visible window, so a card wraps back to the top only while invisible.

- The offset only advances by elapsed **running** time (delta capped at 50 ms, first frame after any idle period counts as 0), so pausing, hidden tabs and scrolling away never cause a jump.
- Positions are written straight to `style.transform`/`opacity`, outside Vue reactivity, only when they change. Measurements come from a `ResizeObserver`, never from per-frame reads.
- The loop stops completely while paused (hover, keyboard focus, open details, motion toggle), when the tab is hidden, or when the hero is off-screen.
- Previous/next sit on either side of the stage; the orbit width is reduced so the moving and zoomed cards never reach them.

## How the continuous tree works

- The hero draws the upper tree: fibres splay into a canopy at the top, pinch into a waist, and settle to the trunk radius at the bottom of the stage. It publishes its exit (positions, twist phase and rate, radius, flow phase) in `tree.js`.
- `TreeTrunk` continues those exact fibres below the hero, around a centreline through waypoints measured from layout anchors: beside the Projects heading → the Projects trunk line → through the ClariFile suite node → the About, Skills and Beyond the Code lanes → the Contact beacon → down the centre of Where it began → the roots. Waypoints are joined by cubic curves with vertical tangents, so the curve is continuous in position and direction; the radius eases between waypoints.
- Branches start on the main strand and end on ports (`.port` on project cards, `.tree-port` elsewhere). They are tapered filled shapes, so width carries the hierarchy: About and Contact limbs and each project group's limbs are thickest where they leave the trunk (project branches grow out from beneath their group's label), skill-group branches are thinner, and a few short twigs taper to nothing. Earlier Projects get a thinner, dimmer branch.
- Roots: in Where it began the trunk loosens (its radius widens) and each strand splits off at a staggered depth, on its front side, continuing as a primary root with the strand's own position, direction, colour and width, so there is no seam. Primaries thicken briefly, then taper through parent-to-child forks into fine rootlets; two reach the earliest-project cards, the rest drop from a wide root collar and level out as they spread across the page. Light runs from the trunk outward and down each root once, one root after another, the first time the section comes into view; hovering an earliest-project card lights its root. All positions use layout offsets, which ignore hover and entrance transforms. Geometry is rebuilt only when the page resizes, the hero changes, or fonts load.
- Light dashes flow up the main strands in px units on one shared timeline, so the pattern runs unbroken across the hero/page join. Branch particles, pulses and twinkles pause with the motion toggle, reduced motion, or when their section is off-screen.
- On screens ≤ 860px the trunk becomes a spine beside the content; sections inset their content to keep that lane clear.
- Project inspection: any desktop window shows the explorer beside the case study (which takes at most 56% of the width); a column smaller than its design size (515×620) scales the whole explorer down to fit. Below 1000×520 it becomes two rows above the case study (the branches, then that branch's projects) and the whole scene scrolls as one page.

## Background

- The page background lives on `<html>` only; the fixed sky (`z-index: -1`) paints above it and below all content.
- Stars are painted once per resize into two canvases that drift at different rates while scrolling (parallax; off for reduced motion and paused motion). Nebula clouds appear only behind the hero carousel.

## Project reels (Remotion)

Each project has a 16-second reel (`public/projects/<id>/reel.mp4`) in its inspection scene: a short title card, the recorded app (FlavourWave: its own screenshots) on a gently tilted screen, and an end card. No narration.

The player in the inspection scene loads the reel only when the project is opened (`preload="none"`, screenshot poster). It uses the browser's own controls (play/pause, seeking, fullscreen) and nothing else: no Replay button, chapter list, time readout or caption, so the top of each project is just the video and its screenshots. A muted preview starts on its own only with motion on, no reduced-motion preference and a mouse-style pointer.

```bash
cd video
npm install
npm run studio                      # edit scenes visually in Remotion Studio
npm run render                      # every reel, straight into public/projects/<id>/reel.mp4
npm run render -- bloodcare pizza   # or just some
```

- `video/src/Root.tsx` registers one composition per project (title, meta line, accent colour, logo, and the recording window to use); `video/src/ProjectReel.tsx` holds the scenes, built from named `Interactive` elements with inline `interpolate()` animations so they stay editable in Studio.
- Walkthroughs are sharp frame recordings of the real apps (`video/public/hq/<id>/`: 1920×1080 JPEG frames + `index.json`), played frame-accurately by the composition; FlavourWave uses screenshots (`video/public/shots`). `video/public/` is not committed and the frame folders are deleted after rendering to save space. `video/capture/` holds the scripts that recorded them, so any reel can be re-recorded and re-rendered.
- Reels render at 1920×1080 (H.264, CRF 23), 2–6.5 MB each.

## Project inspection and soundtrack

Selecting a project opens an inspection scene over the page without leaving it: the portfolio stays mounted underneath (scroll position, carousel phase, tree), and each project gets a `#/project/<id>` history entry, so Back/Forward and direct links work. On the left is a two-level explorer. The branches (from `categories`: groups can share a branch through `branch`) stand as labels on a spiral that grows from Roots at the bottom to the newest work at the top, each with its project count. Only the active branch's projects orbit the selected one, clockwise, on a ring sized to stay clear of it; a branch larger than the ring holds pages through its projects. Each branch remembers its last project during a visit. The geometry lives in `src/orbit.js`, checked by `npm run check`. The ring holds still under the pointer or keyboard focus, and the Pause motion control (shared with the navbar) stops it outright. Previous/Next (buttons or arrow keys) step through every project in page order, switching branch as they go; Escape or Return goes back. Changing branch (a label, Previous/Next or the arrow keys) lights the new label and node at once, draws the new connection from its node in to the ring behind a short bright leading edge while the old one fades, and crossfades the centre card and the project set in place, in about half a second. The case study switches straight away, the ring keeps its rotation, and a quicker change takes over from wherever the last one was (never more than two connections or two centre cards at once). Fading cards take no clicks or focus. In short desktop windows (up to 760px tall) the preview is lower, with the whole image letterboxed, and the project's name stays in the header. The scene's music button sits in that header at every size. With reduced motion or the motion control paused, transitions become simple fades.

The soundtrack is handled by `src/audio.js`: `Architecture of Stillness` plays while browsing (its position is kept while a project is open), and each project plays its own excerpt of `Across the Glass Horizon`, looped and crossfaded. It starts on every load; if the browser blocks autoplay, it starts on the visitor's first tap or key. The round music button in the bottom-right corner turns it on or off. Audio and visual motion are separate controls. The excerpt boundaries in `audioCues.js` were chosen by signal analysis (see `notes/soundtrack.md`) and are worth a listen to fine-tune.
