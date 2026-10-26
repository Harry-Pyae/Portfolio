<script setup>
import { ref } from 'vue'
import { profile } from '../content/profile.js'
import { useSection } from '../reveal.js'

const root = ref(null)
const { classes, reveal } = useSection(root)

// Generic channel icons (no brand marks). Unknown labels fall back to a link glyph.
const ICONS = {
  email: 'M3 6h14v9H3zM3 6l7 5 7-5',
  github: 'M7 6L3 10l4 4M13 6l4 4-4 4',
  linkedin: 'M4 8h12v8H4zM7 8V5h6v3',
}
const icon = (label) => ICONS[label.toLowerCase()] ?? 'M8 12l4-4M7 9.5L5.5 11a2.1 2.1 0 003 3L10 12.5M10 7.5L11.5 6a2.1 2.1 0 013 3L13 10.5'

// Only channels with a real link are shown.
const channels = profile.contact.filter((c) => c.href)

</script>

<template>
  <section id="contact" ref="root" class="section" :class="classes()" aria-labelledby="contact-title" @focusin="reveal">
    <div class="contact">
      <!-- "Signal through space": a beacon sending slow waves towards a distant star. -->
      <div class="signal rv" style="--d: 0" aria-hidden="true">
        <svg class="route" viewBox="0 0 240 200" preserveAspectRatio="xMidYMid meet">
          <circle class="orbit" cx="70" cy="130" r="46" />
          <path class="path" d="M70 130 C 120 128, 150 60, 214 36" />
          <circle class="far" cx="214" cy="36" r="3" />
        </svg>
        <!-- The page trunk passes through this beacon: the tree's contact node. -->
        <div class="beacon" data-node="contact">
          <span class="wave anim"></span>
          <span class="wave anim"></span>
          <span class="wave anim"></span>
          <span class="core"></span>
        </div>
      </div>

      <div class="body">
        <p class="eyebrow rv" style="--d: 1">Contact</p>
        <h2 id="contact-title" class="rv" style="--d: 1">
          Get in touch<span class="tree-port" data-port="contact" aria-hidden="true"></span>
        </h2>
        <p class="lede rv" style="--d: 2">
          {{ profile.contactLede }}
        </p>
        <ul class="channels rv" style="--d: 3">
          <li v-for="c in channels" :key="c.label">
            <a
              class="channel"
              :href="c.href"
              :target="c.href.startsWith('http') ? '_blank' : null"
              rel="noopener noreferrer"
            >
              <svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path :d="icon(c.label)" /></svg>
              <span class="name">{{ c.label }}</span>
              <span class="value">{{ c.text || c.href.replace(/^mailto:/, '') }}</span>
              <span v-if="c.href.startsWith('http')" class="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Beyond the Code is a short pause, so Contact follows it at the subsection rhythm. */
#contact {
  padding-top: var(--sub-gap);
}
.contact {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.8fr);
  gap: clamp(24px, 5vw, 72px);
  align-items: center;
  padding: clamp(32px, 6vw, 72px);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  /* no fill: the tree's trunk runs through the signal side; text sits on solid channel rows */
}
.body {
  grid-row: 1;
  grid-column: 1;
}
.signal {
  grid-row: 1;
  grid-column: 2;
}
.body h2 {
  position: relative;
}
/* Small screens: the trunk runs down the side spine, so a port beside the heading takes the branch. */
.body h2 > .tree-port {
  display: none;
  left: -22px;
  top: 50%;
}

/* ---------- signal visual ---------- */
.signal {
  position: relative;
  aspect-ratio: 6 / 5;
  pointer-events: none;
}
.route {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.orbit {
  fill: none;
  stroke: color-mix(in srgb, var(--glow-trunk) 28%, transparent);
  stroke-dasharray: 2 6;
}
.path {
  fill: none;
  stroke: color-mix(in srgb, var(--glow-branch) 60%, transparent);
  stroke-width: 1.2;
  stroke-dasharray: 1 6;
  stroke-linecap: round;
}
.far {
  fill: var(--glow-spark);
}
/* Beacon at (70,130) of the 240×200 route, i.e. 29% / 65%. Waves are composited HTML rings. */
.beacon {
  position: absolute;
  left: 29.2%;
  top: 65%;
  width: 0;
  height: 0;
}
.core,
.wave {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
}
.core {
  width: 12px;
  height: 12px;
  margin: -6px;
  background: var(--glow-pale);
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--glow-trunk) 50%, transparent);
}
.wave {
  width: 120px;
  height: 120px;
  margin: -60px;
  border: 1px solid var(--glow-trunk);
  opacity: 0;
  will-change: transform, opacity;
  animation: wave 4.8s ease-out infinite;
}
.wave:nth-child(2) {
  animation-delay: 1.6s;
}
.wave:nth-child(3) {
  animation-delay: 3.2s;
}
@keyframes wave {
  0% {
    opacity: 0.35;
    transform: scale(0.1);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
/* ---------- channels ---------- */
.body h2 {
  font-size: clamp(36px, 5vw, 54px);
}
.lede {
  max-width: 44ch;
  margin: 16px 0 0;
  color: var(--ink-2);
  font-size: 17.5px;
}
.channels {
  display: grid;
  gap: 10px;
  max-width: 480px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}
.channels li {
  display: flex;
}
.channel {
  display: grid;
  grid-template-columns: 20px auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  flex: 1;
  min-height: 52px;
  padding: 0 18px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-ctl);
  background: var(--surface-2);
  color: var(--ink);
  text-decoration: none;
  transition:
    border-color 0.3s var(--ease),
    background-color 0.3s var(--ease);
}
a.channel:hover {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.ico {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.name {
  font: 600 15px/1.2 var(--font-head);
}
.value {
  overflow: hidden;
  color: var(--ink-2);
  font-size: 14.5px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .contact {
    grid-template-columns: minmax(0, 1fr);
    margin-left: var(--spine-inset);
  }
  .signal {
    display: none;
  }
  .body h2 > .tree-port {
    display: block;
  }
}
</style>
