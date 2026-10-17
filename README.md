# Harry — Portfolio

Dark portfolio built as one continuous cosmic tree: the hero's spiral of light (with the project carousel orbiting it) continues down the page as a twisting trunk, branches out to the projects, About, Skills and Contact, and opens into roots in the footer. Two dark themes can be compared from the navbar: **Nebula** (blue/cyan, default) and **Charcoal** (charcoal + yellow). Vue 3 + Vite, frontend only. Builds to static files that can be hosted anywhere (GitHub Pages, Netlify, Vercel, any web server or sub-path).

```bash
npm install
npm run dev       # local dev server
npm run build     # static build in dist/
npm run preview   # serve dist/ locally
```

## Editing content

| What | Where |
| --- | --- |
| Name, title, intro, About paragraphs, focus statements, status, skills, contact links, portrait | `src/content/profile.js` |
| Projects and categories | `src/content/projects.js` |
| Carousel speed, orbit width, depth, trunk shape (radius, turns, strands), halo strength, hover zoom | `src/content/motion.js` |
| Colours and fonts (Space Grotesk headings, Inter body) | semantic tokens at the top of `src/style.css` (`--accent`, `--glow-trunk`, `--glow-branch`, `--glow-spark`, `--glow-pale`); the Charcoal theme overrides the same tokens under `:root[data-theme='charcoal']` |

- **Portrait:** put a photo in `public/` (e.g. `public/harry.jpg`) and set `portrait: 'harry.jpg'`.
- **Contact:** fill `href` (`mailto:` or `https://`) and `text`. Empty entries show as "not listed yet". There is deliberately no contact form. A copy-email button appears once a real `mailto:` address exists.
- **Projects:** `tagline` is the one sentence shown on overview cards; `summary`, `stack`, the four detail fields and links appear in the project view. Empty links show as "not available yet"; detail fields set to `null` show as "to be documented". Categories become branch groups in the tree (empty categories are hidden).
- The page `<title>` and meta description live in `index.html`.

## Structure

```
src/
  content/              editable data (profile, projects, motion)
  state.js              shared UI state: motion on/off, reduced motion, theme, open project, hero visibility
  tree.js               shared tree model: fibres, hero exit (join geometry), flow timing, lit project
  wisps.js              textured nebula behind the carousel, generated once per theme and cached
  reveal.js             section entrance + off-screen pause (About, Contact)
  components/
    SkyBackdrop.vue      fixed sky: two star layers with scroll parallax, a few twinkles and dust
    SiteNav.vue          inset sticky navbar: active-section indicator, theme toggle, motion toggle
    HeroIntro.vue        portrait, name, intro, actions
    SpiralShowcase.vue   carousel + upper tree (the single requestAnimationFrame loop), side arrows
    TreeTrunk.vue        the continuous trunk below the hero, all branches, footer roots
    ProjectTree.vue      branching project layout (static cards)
    ProjectNode.vue      compact project card: one button with symbol, title, sentence, status, connection point
    ProjectModal.vue     project details (native <dialog>)
    ProjectArt.vue       screenshot, or a placeholder / small glyph with an orbit line
    AboutSection.vue     identity in an orbital frame, narrative, focus statements, status beacon
    SkillsConstellation.vue  skills as small constellations
    ContactSection.vue   contact with the tree's beacon node; honest unavailable states
```

## How the carousel works

Cards ride a looping track measured in "slots". The visible column is the first `visibleSlots` of the track, and the rest is an off-screen queue. A card's height on the track sets its angle around the light trunk; `cos(angle)` sets depth, which drives scale, dimming and z-order. Opacity is 0 outside the visible window, so a card wraps back to the top only while invisible.

- The offset only advances by elapsed **running** time (delta capped at 50 ms, first frame after any idle period counts as 0), so pausing, hidden tabs and scrolling away never cause a jump.
- Positions are written straight to `style.transform`/`opacity`, outside Vue reactivity, only when they change. Measurements come from a `ResizeObserver`, never from per-frame reads.
- The loop stops completely while paused (hover, keyboard focus, open details, motion toggle), when the tab is hidden, or when the hero is off-screen.
- Previous/next sit on either side of the stage; the orbit width is reduced so the moving and zoomed cards never reach them.

## How the continuous tree works

- The hero draws the upper tree: fibres splay into a canopy at the top, pinch into a waist, and settle to the trunk radius at the bottom of the stage. It publishes its exit (positions, twist phase and rate, radius, flow phase) in `tree.js`.
- `TreeTrunk` continues those exact fibres below the hero, around a centreline through waypoints measured from layout anchors: beside the Projects heading → the Projects trunk line → the About lane → the Skills lane → the Contact beacon → the footer roots. Waypoints are joined by cubic curves with vertical tangents, so the curve is continuous in position and direction; the radius eases between waypoints.
- Branches start on the main strand and end on ports (`.port` on project cards, `.tree-port` elsewhere). All positions use layout offsets, which ignore hover and entrance transforms. Geometry is rebuilt only when the page resizes, the hero changes, or fonts load.
- Light dashes flow up the main strands in px units on one shared timeline, so the pattern runs unbroken across the hero/page join. Branch particles, pulses and twinkles pause with the motion toggle, reduced motion, or when their section is off-screen.
- On screens ≤ 860px the trunk becomes a spine beside the content; sections inset their content to keep that lane clear.

## Background

- The page background lives on `<html>` only; the fixed sky (`z-index: -1`) paints above it and below all content.
- Stars are painted once per resize into two canvases that drift at different rates while scrolling (parallax; off for reduced motion, paused motion and small screens). Nebula clouds appear only behind the hero carousel.
