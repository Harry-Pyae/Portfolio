<script setup>
import { ref } from 'vue'
import { profile } from '../content/profile.js'
import { projects } from '../content/projects.js'
import { showProject } from '../state.js'
import { useSection } from '../reveal.js'
import SkillsConstellation from './SkillsConstellation.vue'
import InterestsSection from './InterestsSection.vue'

const byId = (id) => projects.find((p) => p.id === id)

const root = ref(null)
const { classes, reveal } = useSection(root)
</script>

<template>
  <section id="about" ref="root" class="section about" :class="classes()" aria-labelledby="about-title" @focusin="reveal">
    <div class="about-grid">
      <!-- Identity, framed by an orbit that branches toward the story. -->
      <div class="identity rv" style="--d: 0">
        <div class="frame">
          <div class="frame-art" aria-hidden="true">
            <svg class="rings" viewBox="0 0 300 300">
              <ellipse class="ring" cx="150" cy="150" rx="138" ry="138" />
              <circle class="dot spark" cx="274" cy="180" r="3" />
            </svg>
            <!-- rotating ring is its own element, so the compositor turns it without repainting -->
            <svg class="rings spin anim" viewBox="0 0 300 300">
              <ellipse class="ring dashed" cx="150" cy="150" rx="122" ry="122" />
              <circle class="dot cyan" cx="150" cy="28" r="3.5" />
              <circle class="dot green" cx="44" cy="211" r="3" />
            </svg>
          </div>
          <span class="tree-port" data-port="about-identity" aria-hidden="true"></span>
          <div class="avatar">
            <img v-if="profile.portrait" :src="profile.portrait" :alt="`Portrait of ${profile.name}`" />
            <span v-else class="monogram" role="img" :aria-label="`Monogram for ${profile.name}`">{{ profile.monogram }}</span>
          </div>
        </div>
        <p class="id-name">{{ profile.name }}</p>
        <p class="id-title">{{ profile.title }}</p>
      </div>

      <!-- The page trunk runs through this lane; branches reach the portrait and the story. -->
      <div class="lane" data-lane="about" aria-hidden="true"></div>

      <div class="story">
        <p class="eyebrow rv" style="--d: 1">About</p>
        <h2 id="about-title" class="rv" style="--d: 1">
          About {{ profile.name }}<span class="tree-port" data-port="about-story" aria-hidden="true"></span>
        </h2>
        <div class="narrative rv" style="--d: 2">
          <p v-for="(para, i) in profile.about" :key="i">{{ para }}</p>
        </div>
        <!-- Milestones: a small branch of its own off the trunk. -->
        <div class="milestones rv" style="--d: 3">
          <h3 class="ms-title">Milestones<span class="tree-port" data-port="milestones" aria-hidden="true"></span></h3>
          <ul class="ms-list">
            <li v-for="m in profile.milestones" :key="m.title">
              <span class="ms-name">{{ m.title }}</span>
              <span class="ms-text">{{ m.text }}</span>
              <span v-if="m.projects" class="ms-links">
                <button v-for="id in m.projects" :key="id" type="button" class="ms-link" @click="showProject(byId(id))">
                  {{ byId(id).title }}
                </button>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <SkillsConstellation />
    <InterestsSection />
  </section>
</template>

<style scoped>
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) var(--lane-w) minmax(0, 1.5fr);
  align-items: start;
}

/* The trunk lane spans the full row (the grid aligns items to the top). */
.lane {
  align-self: stretch;
}

/* ---------- identity ---------- */
.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.frame {
  position: relative;
  --port-x: 100%; /* the identity port faces the trunk lane */
  width: min(100%, 300px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}
.frame-art {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.rings {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ring {
  fill: none;
  stroke: color-mix(in srgb, var(--glow-trunk) 35%, transparent);
  stroke-width: 1;
}
.dashed {
  stroke: color-mix(in srgb, var(--glow-branch) 40%, transparent);
  stroke-dasharray: 2 7;
}
.spin {
  will-change: transform;
  animation: spin 90s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.dot.cyan {
  fill: var(--glow-trunk);
}
.dot.green {
  fill: var(--glow-branch);
}
.dot.spark {
  fill: var(--glow-spark);
}
.avatar {
  position: relative;
  width: 58%;
  aspect-ratio: 1;
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 0 40px -14px color-mix(in srgb, var(--glow-trunk) 60%, transparent);
}
.avatar img,
.monogram {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.monogram {
  background: var(--surface-2);
  color: var(--accent);
  font: 700 clamp(56px, 7vw, 76px) / 1 var(--font-head);
  letter-spacing: -0.04em;
}
.id-name {
  margin: 18px 0 0;
  font: 600 22px/1.2 var(--font-head);
}
.id-title {
  margin: 6px 0 0;
  color: var(--ink-2);
  font-size: 14.5px;
}

/* ---------- story ---------- */
.story h2 {
  position: relative;
  margin-bottom: 26px;
}
/* Branch ports: identity on the frame edge facing the lane, story just left of the heading. */
.frame > .tree-port {
  left: var(--port-x);
  top: 50%;
}
.story h2 > .tree-port {
  left: -22px;
  top: 50%;
}
.narrative {
  max-width: 62ch;
}
.narrative p {
  margin: 0 0 16px;
  color: var(--ink);
  font-size: clamp(17px, 1.4vw, 19px);
  line-height: 1.75;
}
.narrative p + p {
  color: var(--ink-2);
}
.milestones {
  max-width: 62ch;
  margin-top: 34px;
}
.ms-title {
  position: relative;
  width: fit-content;
  margin-bottom: 14px;
  font-size: 18px;
}
.ms-title > .tree-port {
  left: -22px;
  top: 50%;
}
.ms-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0 0 0 14px;
  border-left: 1px solid color-mix(in srgb, var(--glow-branch) 40%, transparent);
  list-style: none;
}
.ms-list li {
  position: relative;
  display: grid;
  gap: 2px;
  padding-left: 16px;
}
/* each milestone is a small node on the branch */
.ms-list li::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 0.55em;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--glow-branch);
  box-shadow: 0 0 8px color-mix(in srgb, var(--glow-branch) 60%, transparent);
}
.ms-name {
  color: var(--ink);
  font: 600 16px/1.4 var(--font-head);
}
.ms-text {
  color: var(--ink-2);
  font-size: 15px;
}
.ms-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.ms-link {
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font: 500 13.5px/1.2 var(--font-body);
  cursor: pointer;
  transition: border-color 0.25s var(--ease), color 0.25s var(--ease);
}
.ms-link:hover,
.ms-link:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 860px) {
  .about-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .frame {
    width: min(70%, 240px);
  }
  .lane {
    display: none;
  }
  .about-grid {
    row-gap: 40px;
    padding-left: var(--spine-inset);
  }
  .frame {
    --port-x: 0%;
  }
}
</style>
