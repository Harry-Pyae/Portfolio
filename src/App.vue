<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { heroVisible } from './state.js'
import { profile } from './content/profile.js'
import SkyBackdrop from './components/SkyBackdrop.vue'
import SiteNav from './components/SiteNav.vue'
import HeroIntro from './components/HeroIntro.vue'
import SpiralShowcase from './components/SpiralShowcase.vue'
import ProjectTree from './components/ProjectTree.vue'
import AboutSection from './components/AboutSection.vue'
import ContactSection from './components/ContactSection.vue'
import ExplorationsSection from './components/ExplorationsSection.vue'
import BeganSection from './components/BeganSection.vue'
import ProjectInspect from './components/ProjectInspect.vue'
import { initSound } from './audio.js'
import TreeTrunk from './components/TreeTrunk.vue'
import MusicPill from './components/MusicPill.vue'

// One observer pauses the hero's animation work (carousel loop, trunk light, wisps) while it is off-screen.
const hero = ref(null)
let io
onMounted(() => {
  io = new IntersectionObserver(([e]) => (heroVisible.value = e.isIntersecting), { rootMargin: '80px 0px' })
  io.observe(hero.value)
  initSound() // starts the main soundtrack now, or on the first tap / key if autoplay is blocked
})
onBeforeUnmount(() => io.disconnect())
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <SkyBackdrop />
  <SiteNav />
  <!-- .page is the coordinate space of the one continuous tree (TreeTrunk, drawn behind content). -->
  <div class="page">
    <TreeTrunk />
    <main id="main" tabindex="-1">
      <div ref="hero" class="hero-wrap" :class="{ 'is-offscreen': !heroVisible }">
        <section class="hero" aria-labelledby="hero-name">
          <HeroIntro />
          <SpiralShowcase />
        </section>
      </div>
      <ProjectTree />
      <ExplorationsSection />
      <AboutSection />
      <ContactSection />
      <BeganSection />
    </main>
    <footer class="footer">
      <!-- The trunk opens into roots across this full-width zone; text stays in the container below. -->
      <div class="roots-zone" data-roots aria-hidden="true"></div>
      <div class="footer-row">
        <p>© {{ new Date().getFullYear() }} {{ profile.name }} · Built with Vue 3 and Vite</p>
        <a class="to-top" href="#main">
          Back to top
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" />
          </svg>
        </a>
      </div>
    </footer>
  </div>
  <ProjectInspect />
  <MusicPill class="in-page" />
</template>

<style scoped>
.page {
  position: relative; /* offset parent for every tree anchor */
}
.hero-wrap {
  position: relative;
}
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 42fr 58fr;
  gap: clamp(16px, 3vw, 48px);
  align-items: center;
  max-width: 1360px;
  min-height: calc(100svh - 80px);
  margin: 0 auto;
  padding: 8px var(--gutter) 0;
}
@media (max-width: 860px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
    gap: 36px;
  }
}
.footer {
  padding-bottom: 32px;
  color: var(--ink-3);
  font-size: 14px;
}
.roots-zone {
  height: clamp(240px, 26vw, 380px);
}
.footer-row {
  max-width: var(--maxw);
  margin: 0 auto;
  padding-left: var(--gutter);
  padding-right: var(--gutter);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding-top: 18px;
}
.footer-row p {
  margin: 0;
}
.to-top {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 2px;
  color: var(--ink-2);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.25s var(--ease);
}
.to-top:hover {
  color: var(--accent);
}
</style>
