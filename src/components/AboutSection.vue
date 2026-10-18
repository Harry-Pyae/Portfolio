<script setup>
import { ref } from 'vue'
import { profile } from '../content/profile.js'
import { projects, story } from '../content/projects.js'
import { showProject } from '../state.js'
import { useSection } from '../reveal.js'
import SkillsConstellation from './SkillsConstellation.vue'
import InterestsSection from './InterestsSection.vue'

const byId = (id) => projects.find((p) => p.id === id)

const root = ref(null)
const storyDlg = ref(null)
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
              <span v-if="m.text" class="ms-text">{{ m.text }}</span>
              <!-- Certificates are facts, not controls: no button styling, no hover. -->
              <span v-if="m.badges" class="ms-badges">
                <span v-for="b in m.badges" :key="b.by + b.name" class="ms-badge">
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <circle cx="8" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.3" />
                    <path d="M5.6 9.3L4.8 14l3.2-1.6 3.2 1.6-.8-4.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
                  </svg>
                  <span><strong>{{ b.by }}</strong> {{ b.name }}</span>
                </span>
              </span>
              <span v-if="m.projects" class="ms-links">
                <button v-for="id in m.projects" :key="id" type="button" class="ms-link" @click="showProject(byId(id))">
                  {{ byId(id).title }}
                </button>
              </span>
            </li>
          </ul>
        </div>
        <!-- An engineering story from the early days: a fixed card with a short brief; the full account opens
             in an overlay, so the page (and the tree measured from it) never changes height. -->
        <div v-if="story.published && !story.project" class="story-card rv" style="--d: 4">
          <span class="sc-year">{{ story.year }}<template v-if="story.label"> · {{ story.label }}</template></span>
          <span class="sc-title">{{ story.title }}</span>
          <span class="sc-teaser">{{ story.teaser }}</span>
          <button type="button" class="sc-more" @click="storyDlg.showModal()">Read the story</button>
        </div>
        <dialog v-if="story.published && !story.project" ref="storyDlg" class="story-dlg" aria-labelledby="story-dlg-title" @click="(e) => e.target === storyDlg && storyDlg.close()">
          <div class="sd-inner">
            <button type="button" class="sd-close" autofocus @click="storyDlg.close()">
              <span class="sr-only">Close the story</span>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <span class="sc-year">{{ story.year }}<template v-if="story.label"> · {{ story.label }}</template></span>
            <h3 id="story-dlg-title" class="sd-title">{{ story.title }}</h3>
            <template v-for="[head, text] in story.parts" :key="head">
              <h4>{{ head }}</h4>
              <p>{{ text }}</p>
            </template>
            <figure v-if="story.code" class="sc-code">
              <figcaption>Illustrative example, not the original code</figcaption>
              <pre><code>{{ story.code }}</code></pre>
            </figure>
          </div>
        </dialog>
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
.ms-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 6px;
}
.ms-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-2);
  font-size: 14px;
}
.ms-badge svg {
  flex: none;
  color: var(--glow-spark);
}
.ms-badge strong {
  color: var(--ink);
  font-weight: 600;
}

/* ---------- engineering story ---------- */
.story-card {
  display: grid;
  gap: 4px;
  max-width: 62ch;
  margin-top: 30px;
  padding: 18px 20px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--surface);
}
.sc-year {
  color: var(--accent);
  font: 600 13px/1.2 var(--font-head);
  letter-spacing: 0.04em;
}
.sc-title {
  color: var(--ink);
  font: 600 19px/1.3 var(--font-head);
}
.sc-teaser {
  color: var(--ink-2);
  font-size: 15px;
}
.sc-more {
  justify-self: start;
  margin-top: 6px;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: 600 14px/1.4 var(--font-body);
  cursor: pointer;
}
.sc-more:hover {
  color: var(--accent-hover);
}
.story-dlg {
  width: min(720px, calc(100% - 32px));
  max-height: calc(100dvh - 48px);
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  background: var(--surface);
  color: var(--ink);
}
.story-dlg::backdrop {
  background: rgba(2, 6, 14, 0.8);
}
/* Short fade and rise both ways; overlay/display transitions let the close animate in the top layer. */
.story-dlg,
.story-dlg::backdrop {
  transition:
    opacity 0.28s var(--ease),
    transform 0.28s var(--ease),
    overlay 0.28s allow-discrete,
    display 0.28s allow-discrete;
}
.story-dlg {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
.story-dlg::backdrop {
  opacity: 0;
}
.story-dlg[open],
.story-dlg[open]::backdrop {
  opacity: 1;
}
.story-dlg[open] {
  transform: none;
}
@starting-style {
  .story-dlg[open],
  .story-dlg[open]::backdrop {
    opacity: 0;
  }
  .story-dlg[open] {
    transform: translateY(12px) scale(0.98);
  }
}
@media (prefers-reduced-motion: reduce) {
  .story-dlg,
  .story-dlg::backdrop {
    transition: none;
  }
}
.sd-inner {
  position: relative;
  padding: 28px clamp(20px, 4vw, 36px) 32px;
}
.sd-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
.sd-title {
  margin: 6px 0 4px;
  font-size: clamp(22px, 3vw, 28px);
}
.sd-inner h4 {
  margin: 18px 0 4px;
  color: var(--ink);
  font-size: 15.5px;
}
.sd-inner p {
  margin: 0;
  color: var(--ink-2);
  font-size: 15px;
}
.sc-code {
  margin: 18px 0 0;
}
.sc-code figcaption {
  margin-bottom: 6px;
  color: var(--ink-3);
  font-size: 13px;
  font-style: italic;
}
.sc-code pre {
  margin: 0;
  padding: 14px 16px;
  overflow: hidden;
  white-space: pre-wrap; /* wraps instead of scrolling sideways */
  overflow-wrap: anywhere;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--ink-2);
  font: 13px/1.6 ui-monospace, 'Cascadia Code', Consolas, monospace;
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
