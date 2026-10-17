<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { profile } from '../content/profile.js'
import { motionOn, toggleMotion, theme, toggleTheme } from '../state.js'

const links = [
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

// Active section: whichever section crosses a thin band just above the middle of the viewport.
// The footer counts as Contact, so the last link stays lit at the very bottom.
const active = ref(null)
const inBand = new Set()
let io
onMounted(() => {
  const targets = [...links.map((l) => document.getElementById(l.id)), document.querySelector('.footer')]
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = e.target.id || 'contact'
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
      <div class="tools">
        <!-- Compare the two dark themes; the label names the theme you'll switch to. -->
        <button
          class="theme"
          type="button"
          :aria-label="theme === 'nebula' ? 'Switch to charcoal theme' : 'Switch to nebula theme'"
          :title="theme === 'nebula' ? 'Switch to the charcoal theme' : 'Switch to the nebula theme'"
          @click="toggleTheme"
        >
          <span class="swatch" :class="theme === 'nebula' ? 'to-charcoal' : 'to-nebula'" aria-hidden="true"></span>
          <span class="tool-text" aria-hidden="true">{{ theme === 'nebula' ? 'Charcoal' : 'Nebula' }}</span>
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
.to-charcoal {
  background: #ffd84d;
  box-shadow: 0 0 0 3px #17181c;
}
.to-nebula {
  background: #50d9e8;
  box-shadow: 0 0 0 3px #081725;
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
  .brand-name,
  .tool-text {
    display: none;
  }
  .links a {
    padding: 12px 7px;
    font-size: 14.5px;
  }
  .tools button {
    padding: 0;
    width: 44px;
  }
}
</style>
