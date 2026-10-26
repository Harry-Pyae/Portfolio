<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { profile } from '../content/profile.js'
import { motionOn, toggleMotion } from '../state.js'

const links = [
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

// Active section: whichever section crosses a thin band just above the middle of the viewport.
// Subsections count toward their parent link (no nav item each); the footer counts as Contact.
const parentOf = { explorations: 'projects', beginnings: 'contact' }
const active = ref(null)
const inBand = new Set()
let io
onMounted(() => {
  const ids = [...links.map((l) => l.id), ...Object.keys(parentOf)]
  const targets = [...ids.map((id) => document.getElementById(id)), document.querySelector('.footer')]
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = parentOf[e.target.id] ?? (e.target.id || 'contact')
        e.isIntersecting ? inBand.add(id) : inBand.delete(id)
      }
      active.value = links.map((l) => l.id).filter((id) => inBand.has(id)).pop() ?? null
    },
    { rootMargin: '-40% 0px -55% 0px' },
  )
  targets.forEach((t) => t && io.observe(t))
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <header class="nav-wrap">
    <!-- One compact floating bar: the identity on the left; the sections and, set apart, the motion
         control on the right. Everything fits on one row down to phone width (the motion control
         becomes an icon there), so there is no menu to open. -->
    <nav class="nav" aria-label="Primary">
      <a class="brand" href="#main">
        <span class="mono" aria-hidden="true">{{ profile.monogram }}</span>
        <span class="brand-name">{{ profile.name }}</span>
        <span class="sr-only">, back to top</span>
      </a>
      <ul class="links">
        <li v-for="l in links" :key="l.id">
          <a :href="`#${l.id}`" :class="{ active: active === l.id }" :aria-current="active === l.id ? 'location' : null">
            {{ l.label }}
          </a>
        </li>
      </ul>
      <button
        class="motion"
        type="button"
        :aria-pressed="!motionOn"
        :aria-label="motionOn ? 'Pause motion' : 'Resume motion'"
        :title="motionOn ? 'Pause motion' : 'Resume motion'"
        @click="toggleMotion"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path v-if="motionOn" d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor" />
          <path v-else d="M6 4l10 6-10 6z" fill="currentColor" />
        </svg>
        <span class="motion-text" aria-hidden="true">{{ motionOn ? 'Pause' : 'Resume' }}</span>
      </button>
    </nav>
  </header>
</template>

<style scoped>
/* A slim floating bar, narrower than the page so it reads as one compact object: the card surface and
   border, slightly translucent with a light blur so the stars and tree pass softly beneath. */
.nav-wrap {
  position: sticky;
  top: 12px;
  z-index: 50;
  margin-top: 12px;
  padding: 0 var(--gutter);
}
.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 780px;
  height: 52px;
  margin: 0 auto;
  padding: 0 8px 0 9px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-card);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px -18px rgba(0, 0, 0, 0.9);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  padding: 6px 8px 6px 2px;
  border-radius: var(--r-ctl);
  color: var(--ink);
  text-decoration: none;
}
.mono {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
  border-radius: 50%;
  color: var(--accent);
  font: 700 15px/1 var(--font-head);
}
.brand-name {
  font: 600 15.5px/1 var(--font-head);
  letter-spacing: -0.015em;
}
.links {
  display: flex;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
/* plain text links with a comfortable hit area; the active section gets a short gold mark beneath */
.links a {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 40px;
  padding: 0 11px;
  border-radius: var(--r-ctl);
  color: var(--ink-2);
  font: 500 14px/1 var(--font-body);
  text-decoration: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}
.links a:hover {
  color: var(--ink);
  background: color-mix(in srgb, var(--ink) 5%, transparent);
}
.links a::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 14px;
  height: 2px;
  margin-left: -7px;
  border-radius: 1px;
  background: var(--accent);
  opacity: 0;
  transform: scaleX(0.3);
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease);
}
.links a.active {
  color: var(--ink);
}
.links a.active::after {
  opacity: 1;
  transform: none;
}
/* the motion control, set apart by a fine divider: shows the action it will take */
.motion {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  margin-left: 13px;
  padding: 0 11px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-ctl);
  background: transparent;
  color: var(--ink-2);
  font: 500 13px/1 var(--font-body);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.16s var(--ease);
}
.motion::before {
  content: '';
  position: absolute;
  left: -9px;
  top: 7px;
  bottom: 7px;
  width: 1px;
  background: var(--line-strong);
}
.motion:hover {
  color: var(--ink);
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
}
.motion:active {
  transform: scale(0.97);
}
/* motion paused: the control carries the gold edge (selected state) */
.motion[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
  color: var(--accent);
}
@media (max-width: 600px) {
  .nav-wrap {
    top: 8px;
    margin-top: 8px;
    padding: 0 10px;
  }
  .nav {
    height: 50px;
    padding: 0 6px;
    gap: 0;
  }
  .brand-name {
    display: none;
  }
  .links a {
    padding: 0 8px;
  }
  /* phones: the motion control keeps its label for screen readers, its icon on screen */
  .motion {
    width: 40px;
    height: 40px;
    margin-left: 9px;
    padding: 0;
    justify-content: center;
  }
  .motion::before {
    left: -6px;
  }
  .motion-text {
    display: none;
  }
}
</style>
