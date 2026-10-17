<script setup>
const props = defineProps({
  project: { type: Object, required: true },
  alt: { type: String, default: '' },
  glyph: { type: Boolean, default: false }, // small round symbol for overview cards
})
// Deterministic per-project tilt so each preview looks a little different.
const tilt = ([...props.project.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 40) - 20
</script>

<!-- Glyph: the project's logo when it has one. Banner: its cover screenshot. Otherwise a solid panel
     with a single orbit line and a small warm "planet". -->
<template>
  <div class="art" :class="{ glyph }">
    <img v-if="glyph ? project.icon : project.image" :src="glyph ? project.icon : project.image" :alt="alt" loading="lazy" />
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
.glyph img {
  padding: 5px;
  object-fit: contain;
}
</style>
