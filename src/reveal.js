import { ref, onMounted, onBeforeUnmount } from 'vue'
import { prefersReduced } from './state.js'

// One observer per section: plays a one-off entrance the first time it scrolls into view, and
// reports visibility so continuous effects can pause off-screen. Content is only hidden once this
// has run and the section is still below the fold, so it stays visible if scripts fail.
export function useSection(el) {
  const ready = ref(false) // entrance armed (elements start hidden)
  const shown = ref(false) // entrance played
  const visible = ref(true)
  let io
  onMounted(() => {
    ready.value = !prefersReduced.value && el.value.getBoundingClientRect().top > innerHeight * 0.9
    io = new IntersectionObserver(
      ([e]) => {
        visible.value = e.isIntersecting
        if (e.isIntersecting) shown.value = true
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el.value)
  })
  onBeforeUnmount(() => io?.disconnect())
  const classes = () => ({ 'reveal-ready': ready.value, 'is-revealed': shown.value, 'is-offscreen': !visible.value })
  return { classes, shown, reveal: () => (shown.value = true) } // reveal: e.g. on keyboard focus
}
