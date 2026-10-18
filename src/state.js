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

// Two dark appearances: 'nebula' (navy + cyan, default) and 'ember' (charcoal + gold). Remembered per
// visitor; storage may be unavailable, so every access is guarded.
const THEMES = ['nebula', 'ember']
const THEME_COLOR = { nebula: '#040b18', ember: '#101114' }
const stored = (() => {
  try {
    const t = localStorage.getItem('portfolio-theme')
    return t === 'charcoal' ? 'ember' : t // earlier name of the ember appearance
  } catch {
    return null
  }
})()
export const theme = ref(THEMES.includes(stored) ? stored : 'nebula')
export function toggleTheme() {
  theme.value = theme.value === 'nebula' ? 'ember' : 'nebula'
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
