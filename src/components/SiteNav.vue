<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { profile } from '../content/profile.js'
import { motionOn, toggleMotion, theme, toggleTheme } from '../state.js'
import SoundControls from './SoundControls.vue'
import { sound } from '../audio.js'

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

// Small screens: the appearance, motion and soundtrack controls sit behind one settings button.
const menu = ref(false)
const menuBtn = ref(null)
const tools = ref(null)
const outside = (e) => menu.value && !tools.value?.contains(e.target) && !menuBtn.value?.contains(e.target) && (menu.value = false)
const onKey = (e) => {
  if (e.key !== 'Escape' || !menu.value) return
  menu.value = false
  menuBtn.value?.focus()
}
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <header class="nav-wrap">
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
        ref="menuBtn"
        class="menu-btn"
        type="button"
        aria-label="Appearance, motion and soundtrack"
        aria-controls="nav-tools"
        :aria-expanded="menu"
        @click="menu = !menu"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M3 6h9M15 6h2M3 14h2M8 14h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="13.5" cy="6" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6" />
          <circle cx="6.5" cy="14" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6" />
        </svg>
        <!-- the soundtrack is waiting for a click: a small marker, not a pop-up -->
        <span v-if="sound.state === 'blocked'" class="dot" aria-hidden="true"></span>
      </button>
      <div id="nav-tools" ref="tools" class="tools" :class="{ open: menu }">
        <SoundControls />
        <!-- Two dark appearances; the label names the one you'll switch to. -->
        <button
          class="theme"
          type="button"
          :aria-label="theme === 'nebula' ? 'Switch to the Ember appearance' : 'Switch to the Nebula appearance'"
          :title="theme === 'nebula' ? 'Switch to the Ember appearance' : 'Switch to the Nebula appearance'"
          @click="toggleTheme"
        >
          <span class="swatch" :class="theme === 'nebula' ? 'to-ember' : 'to-nebula'" aria-hidden="true"></span>
          <span class="tool-text" aria-hidden="true">{{ theme === 'nebula' ? 'Ember' : 'Nebula' }}</span>
        </button>
        <button class="motion" type="button" :aria-label="motionOn ? 'Pause motion' : 'Resume motion'" @click="toggleMotion">
          <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
            <path v-if="motionOn" d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor" />
            <path v-else d="M6 4l10 6-10 6z" fill="currentColor" />
          </svg>
          <span class="tool-text" aria-hidden="true">{{ motionOn ? 'Pause' : 'Play' }}</span>
        </button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* Slim inset bar: sticky with breathing room above, solid navy (no backdrop blur), thin cyan edge. */
.nav-wrap {
  position: sticky;
  top: 12px;
  z-index: 50;
  margin-top: 12px;
  padding: 0 var(--gutter);
}
.nav {
  position: relative; /* anchors the small-screen settings panel */
  display: flex;
  align-items: center;
  gap: clamp(8px, 2.5vw, 28px);
  max-width: var(--maxw);
  height: 56px;
  margin: 0 auto;
  padding: 0 10px 0 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: 0 10px 30px -18px rgba(0, 0, 0, 0.9);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  padding: 6px 4px;
  color: var(--ink);
  text-decoration: none;
}
.mono {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--accent) 70%, transparent);
  border-radius: 50%;
  color: var(--accent);
  font: 700 16px/1 var(--font-head);
  box-shadow: 0 0 12px -4px color-mix(in srgb, var(--glow-trunk) 60%, transparent);
}
.brand-name {
  font: 600 16px/1 var(--font-head);
  letter-spacing: -0.01em;
}
.links {
  display: flex;
  gap: clamp(0px, 1vw, 10px);
  margin: 0;
  padding: 0;
  list-style: none;
}
.links a {
  position: relative;
  display: block;
  padding: 12px 10px;
  color: var(--ink-2);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.25s var(--ease);
}
.links a:hover {
  color: var(--ink);
}
/* Active section: the link brightens and a small luminous dot sits beneath it. */
.links a::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px 1px color-mix(in srgb, var(--glow-trunk) 70%, transparent);
  opacity: 0;
  transform: scale(0.4);
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.links a.active {
  color: var(--ink);
}
.links a.active::after {
  opacity: 1;
  transform: none;
}
.tools {
  display: flex;
  gap: 6px;
}
.tools button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 44px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink-2);
  font: 600 13.5px/1 var(--font-body);
  cursor: pointer;
  transition:
    color 0.25s var(--ease),
    border-color 0.25s var(--ease);
}
.tools button:hover {
  color: var(--ink);
  border-color: var(--accent);
}
/* Swatch previews the other theme: its background ring and accent core. */
.swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.to-ember {
  background: #ffd84d;
  box-shadow: 0 0 0 3px #17181c;
}
.to-nebula {
  background: #50d9e8;
  box-shadow: 0 0 0 3px #081725;
}
.menu-btn {
  display: none;
}
@media (max-width: 600px) {
  .nav-wrap {
    top: 8px;
    margin-top: 8px;
    padding: 0 10px;
  }
  .nav {
    gap: 2px;
    padding: 0 6px 0 8px;
  }
  .brand-name {
    display: none;
  }
  .links a {
    padding: 12px 7px;
    font-size: 14.5px;
  }
  .menu-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-left: auto;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: color-mix(in srgb, var(--bg) 55%, var(--surface));
    color: var(--ink-2);
    cursor: pointer;
  }
  .menu-btn[aria-expanded='true'] {
    border-color: var(--accent);
    color: var(--ink);
  }
  .dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }
  /* the settings panel: labelled buttons in a column under the bar */
  .tools {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    min-width: 200px;
    padding: 8px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--surface);
    box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.95);
  }
  .tools.open {
    display: flex;
  }
  .tools button,
  .tools :deep(button) {
    justify-content: flex-start;
    width: 100%;
    height: 44px;
    padding: 0 14px;
  }
  .tools :deep(.sound) {
    flex-direction: column;
  }
  .nav .tools :deep(.label) {
    display: inline;
  }
}
</style>
