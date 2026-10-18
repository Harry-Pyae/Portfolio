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

export const openProject = ref(null)
export const showProject = (p) => (openProject.value = p)
export const closeProject = () => (openProject.value = null)
