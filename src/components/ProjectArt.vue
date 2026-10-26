<script setup>
const props = defineProps({
  project: { type: Object, required: true },
  alt: { type: String, default: '' },
  glyph: { type: Boolean, default: false }, // small round symbol for overview cards
})
// Deterministic per-project tilt so each preview looks a little different.
const tilt = ([...props.project.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 40) - 20

// One monoline set for cards and the orbit (24-unit grid, drawn with a 1.5 stroke), each symbol taken
// from the idea of the project's own logo. The full-colour logos appear in the project view's header.
const GLYPHS = {
  drop: ['M12 3.5c-3.2 4.3-6 7.4-6 10.6a6 6 0 0 0 12 0c0-3.2-2.8-6.3-6-10.6Z', 'M12 11.5v5M9.5 14h5'],
  cap: ['M12 5 2.5 9.5 12 14l9.5-4.5Z', 'M6.5 11.6v4.1c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.1', 'M21.5 9.5v5'],
  cup: ['M6 8.5h12l-1.3 10.7a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3Z', 'M13 8.5l2-5h2.5', 'M6.9 13c1.7-1 3.4 1 5.1 0s3.4 1 5.1 0'],
  scan: ['M10.5 3.5a7 7 0 1 1 0 14a7 7 0 0 1 0-14Z', 'M15.6 15.6 20.5 20.5', 'M7.6 10.6l2 2 3.6-3.8'],
  pulse: ['M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 0 1 0-17Z', 'M6 12.5h2.6l1.6-3.2 2.6 6.2 1.6-3h3.6'],
  chat: ['M4 5h16v10.5H9.5L5.5 19v-3.5H4Z', 'M7.5 8.8h9M7.5 11.8h5.5'],
  news: ['M4 5h12.5v14H5.5A1.5 1.5 0 0 1 4 17.5Z', 'M16.5 9H20v8.5a1.5 1.5 0 0 1-3 0', 'M7 8.5h6.5M7 12h6.5M7 15.5h4'],
  slice: ['M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 0 1 0-17Z', 'M12 12V3.5M12 12l7.4 4.2', 'M9.6 9.4a1 1 0 1 1-2 0a1 1 0 1 1 2 0ZM10.4 15.6a1 1 0 1 1-2 0a1 1 0 1 1 2 0ZM15.8 9.2a1 1 0 1 1-2 0a1 1 0 1 1 2 0Z'],
  sort: ['M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z', 'M8 11.5h5M8 14.5h3', 'M16.5 10.5v5M14.8 13.8l1.7 1.7 1.7-1.7'],
  summary: ['M6.5 3.5H14l4 4v13H6.5Z', 'M13.5 3.5v4.5H18', 'M9.5 11.5h5.5M9.5 14.5h5.5M9.5 17.5h3'],
  folder: ['M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z', 'M3.5 10.5h17'],
  code: ['M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5', 'M13.4 5.5l-2.8 13'],
  film: ['M4 5.5h16v13H4Z', 'M8 5.5v13M16 5.5v13M4 9.8h4M4 14.2h4M16 9.8h4M16 14.2h4'],
}
</script>

<!-- Glyph: the project's monoline symbol (or the orbit mark when it has none). Banner: its cover
     screenshot, otherwise a solid panel with a single orbit line and a small warm "planet". -->
<template>
  <div class="art" :class="{ glyph }">
    <svg v-if="glyph && GLYPHS[project.glyph]" class="mark" viewBox="0 0 24 24" aria-hidden="true">
      <path v-for="d in GLYPHS[project.glyph]" :key="d" :d="d" />
    </svg>
    <img v-else-if="!glyph && project.image" :src="project.image" :alt="alt" loading="lazy" />
    <span v-else class="ring" :style="{ transform: `rotate(${glyph ? tilt * 4 : tilt}deg)` }" aria-hidden="true">
      <span class="planet"></span>
    </span>
  </div>
</template>

<style scoped>
.art {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
}
.ring {
  position: absolute;
  left: -20%;
  top: 42%;
  width: 140%;
  aspect-ratio: 1;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
}
.planet {
  position: absolute;
  left: 50%;
  top: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--glow-spark);
  box-shadow: 0 0 10px color-mix(in srgb, var(--glow-spark) 55%, transparent);
  transform: translate(-50%, -50%);
}
.glyph {
  border: 1px solid var(--line-strong);
  border-radius: 50%;
}
.glyph .ring {
  left: 22%;
  top: 22%;
  width: 56%;
  border-color: color-mix(in srgb, var(--accent) 28%, var(--surface-2));
}
.glyph .planet {
  width: 6px;
  height: 6px;
  box-shadow: 0 0 6px color-mix(in srgb, var(--glow-spark) 70%, transparent);
}
img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.glyph {
  display: grid;
  place-items: center;
  color: var(--ink-2);
  transition: color 0.25s var(--ease);
}
.mark {
  width: 58%;
  height: 58%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
