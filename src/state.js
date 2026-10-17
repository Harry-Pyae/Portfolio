import { ref, watchEffect } from 'vue'

// Shared UI state. Frame-by-frame animation values deliberately live outside Vue (see SpiralShowcase).
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
let userChose = false

export const prefersReduced = ref(reduce.matches)
export const motionOn = ref(!reduce.matches)
reduce.addEventListener('change', (e) => {
  prefersReduced.value = e.matches
  if (!userChose) motionOn.value = !e.matches // an explicit pause/resume always wins
})
export function toggleMotion() {
  userChose = true
  motionOn.value = !motionOn.value
}
watchEffect(() => document.documentElement.classList.toggle('motion-off', !motionOn.value))

export const heroVisible = ref(true)

// Two dark themes to compare: 'nebula' (blue/cyan, default) and 'charcoal' (the earlier charcoal +
// yellow design). Remembered per visitor; storage may be unavailable, so every access is guarded.
const THEMES = ['nebula', 'charcoal']
const THEME_COLOR = { nebula: '#040b18', charcoal: '#101114' }
const stored = (() => {
  try {
    return localStorage.getItem('portfolio-theme')
  } catch {
    return null
  }
})()
export const theme = ref(THEMES.includes(stored) ? stored : 'nebula')
export function toggleTheme() {
  theme.value = theme.value === 'nebula' ? 'charcoal' : 'nebula'
  try {
    localStorage.setItem('portfolio-theme', theme.value)
  } catch {
    /* not persisted: the toggle still works for this visit */
  }
}
watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme.value])
})

export const openProject = ref(null)
export const showProject = (p) => (openProject.value = p)
export const closeProject = () => (openProject.value = null)
