<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { openProject, closeProject, showProject, motionOn, prefersReduced } from '../state.js'
import { profile } from '../content/profile.js'
import { suites, appsOf, story } from '../content/projects.js'
import ProjectArt from './ProjectArt.vue'

// Native modal <dialog>: inert background (focus trap), Escape to close, top layer.
// We restore focus to the opener ourselves for consistency across browsers.
const dlg = ref(null)
const shown = ref(null) // kept while the dialog fades out
const media = ref(null) // 'video' or a screenshot path shown in the media stage
const vid = ref(null)
const now = ref(0) // playback position, for the active chapter
const autoplay = ref(false)
let opener = null

// Reel chapters in seconds; keep in sync with the frames in video/src/ProjectReel.tsx.
const chapters = computed(() => [
  ['Title', 0],
  [shown.value?.walkthrough ?? 'Recorded app', 1.13],
  ['End card', 14],
])
const current = computed(() => chapters.value.findLastIndex(([, t]) => now.value >= t - 0.05))
const clock = (t) => `0:${String(Math.floor(t)).padStart(2, '0')}`

// The reel only downloads once this dialog shows it (preload="none"). A muted preview starts on its
// own only with motion on, no reduced-motion preference and a fine pointer; otherwise the poster waits.
const canPreview = () => motionOn.value && !prefersReduced.value && matchMedia('(hover: hover) and (pointer: fine)').matches

watch(openProject, async (p) => {
  const d = dlg.value
  if (p) {
    shown.value = p
    media.value = p.video ? 'video' : (p.gallery?.[0] ?? null)
    now.value = 0
    autoplay.value = canPreview()
  }
  if (p && !d.open) {
    opener = document.activeElement
    await nextTick()
    d.showModal()
  } else if (p) {
    // switched between a suite and one of its apps inside the open dialog: start at the top
    await nextTick()
    d.scrollTop = 0
    d.querySelector('.close')?.focus()
  } else if (d.open) d.close()
})

function seek(t) {
  const v = vid.value
  if (!v) return
  v.currentTime = t
  now.value = t
  v.play().catch(() => {})
}

function onClose() {
  vid.value?.pause()
  closeProject()
  opener?.focus?.({ preventScroll: true })
  opener = null
}
const onBackdrop = (e) => e.target === dlg.value && dlg.value.close()

// A suite opens as an overview of its apps; an app links back to its suite.
const apps = computed(() => (shown.value?.apps ? appsOf(shown.value) : null))
const parentSuite = computed(() => suites.find((x) => x.id === shown.value?.suite))
const storyHere = computed(() => story.published && story.project === shown.value?.id)
</script>

<template>
  <dialog ref="dlg" class="modal" aria-labelledby="modal-title" @close="onClose" @click="onBackdrop">
    <div v-if="shown" class="inner">
      <button class="close" type="button" autofocus @click="dlg.close()">
        <span class="sr-only">Close project details</span>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <!-- Media stage: the walkthrough reel (native controls: play/pause, seek, fullscreen) or a screenshot. -->
      <div v-if="media" class="stage">
        <video
          v-if="media === 'video'"
          ref="vid"
          :key="shown.id"
          :src="shown.video"
          :poster="shown.image"
          :autoplay="autoplay"
          muted
          playsinline
          controls
          preload="none"
          :aria-label="`${shown.title} walkthrough video`"
          @timeupdate="now = $event.target.currentTime"
        ></video>
        <img v-else :src="media" :alt="`${shown.title} screenshot ${shown.gallery.indexOf(media) + 1}`" />
      </div>
      <ProjectArt v-else :project="shown" :alt="`${shown.title} preview`" class="art" />
      <div v-if="media === 'video'" class="player">
        <div class="chapters" role="group" aria-label="Video chapters">
          <button
            v-for="([name, t], i) in chapters"
            :key="name"
            type="button"
            :aria-current="current === i ? 'true' : null"
            @click="seek(t)"
          >
            {{ name }} <span class="time">{{ clock(t) }}</span>
          </button>
          <button type="button" class="replay" @click="seek(0)">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M3.5 8a4.5 4.5 0 104.5-4.5H5M5 1.5l-2 2 2 2"
                stroke="currentColor"
                stroke-width="1.6"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Replay
          </button>
        </div>
        <p v-if="shown.videoNote" class="note">{{ shown.videoNote }}</p>
      </div>
      <div v-if="media && (shown.gallery?.length ?? 0) + (shown.video ? 1 : 0) > 1" class="thumbs" role="group" aria-label="Project media">
        <button v-if="shown.video" type="button" :aria-pressed="media === 'video'" @click="media = 'video'">
          <img :src="shown.image" alt="" />
          <span class="play" aria-hidden="true">▶</span>
          <span class="sr-only">Walkthrough video</span>
        </button>
        <button v-for="(g, i) in shown.gallery" :key="g" type="button" :aria-pressed="media === g" @click="media = g">
          <img :src="g" alt="" loading="lazy" />
          <span class="sr-only">Screenshot {{ i + 1 }}</span>
        </button>
      </div>
      <div class="body">
        <p class="meta">
          {{ apps ? 'Suite' : shown.category }}<template v-if="shown.year"> · {{ shown.year }}</template>
          <span v-if="shown.status" class="status">{{ shown.status }}</span>
        </p>
        <h2 id="modal-title">{{ shown.title }}</h2>
        <p class="lead">{{ shown.tagline }}</p>
        <p v-if="shown.context" class="context">{{ shown.context }}</p>
        <button v-if="parentSuite" type="button" class="suite-link" @click="showProject(parentSuite)">
          Part of the {{ parentSuite.title }} suite
        </button>

        <!-- Suite overview: each application opens its own details. -->
        <template v-if="apps">
          <h3 class="sub">Applications</h3>
          <ul class="apps">
            <li v-for="a in apps" :key="a.id">
              <button type="button" class="app" @click="showProject(a)">
                <span class="app-title">{{ a.title }}</span>
                <span class="app-line">{{ a.tagline }}</span>
                <span class="app-status">{{ a.status }}</span>
              </button>
            </li>
          </ul>
          <div v-if="shown.integration" class="integration">
            <h3 class="sub">{{ shown.integration.label }}</h3>
            <p>{{ shown.integration.text }}</p>
          </div>
        </template>

        <dl v-if="shown.problem || shown.solution" class="details">
          <div v-if="shown.problem">
            <dt>Problem</dt>
            <dd>{{ shown.problem }}</dd>
          </div>
          <div v-if="shown.solution">
            <dt>Solution</dt>
            <dd>{{ shown.solution }}</dd>
          </div>
        </dl>

        <template v-if="shown.highlights?.length">
          <h3 class="sub">Highlights</h3>
          <ul class="highlights">
            <li v-for="h in shown.highlights" :key="h">{{ h }}</li>
          </ul>
        </template>

        <section v-if="storyHere" class="story" aria-labelledby="story-title">
          <h3 id="story-title" class="sub">{{ story.title }}</h3>
          <template v-for="[head, text] in story.parts" :key="head">
            <h4>{{ head }}</h4>
            <p>{{ text }}</p>
          </template>
        </section>

        <template v-if="shown.contribution">
          <h3 class="sub">{{ profile.name }}’s contribution</h3>
          <p class="contribution">{{ shown.contribution }}</p>
        </template>

        <template v-if="shown.stack?.length">
          <h3 class="sub">Technologies</h3>
          <ul class="chips" aria-label="Technologies">
            <li v-for="t in shown.stack" :key="t">{{ t }}</li>
          </ul>
        </template>

        <div v-if="shown.links.demo || shown.links.github" class="links">
          <a v-if="shown.links.demo" class="btn btn--primary" :href="shown.links.demo" target="_blank" rel="noopener noreferrer">
            Live demo<span class="sr-only"> (opens in a new tab)</span>
          </a>
          <a v-if="shown.links.github" class="btn" :href="shown.links.github" target="_blank" rel="noopener noreferrer">
            Repository<span class="sr-only"> on GitHub (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(880px, calc(100% - 32px));
  max-height: calc(100dvh - 48px);
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 20px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 40px 120px -30px rgba(0, 0, 0, 0.9);
}
/* Short fade/rise both ways; display/overlay transition lets the close animate in the top layer. */
.modal {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease),
    overlay 0.25s allow-discrete,
    display 0.25s allow-discrete;
}
.modal[open] {
  opacity: 1;
  transform: none;
}
@starting-style {
  .modal[open] {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
.modal::backdrop {
  background: rgba(2, 6, 14, 0.82);
}
@media (prefers-reduced-motion: reduce) {
  .modal {
    transition: none;
  }
}
.inner {
  position: relative;
}
.close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
.art {
  height: 170px;
}
.stage {
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid var(--line);
  background: #000;
}
.stage video,
.stage img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.player {
  padding: 12px clamp(20px, 4vw, 40px) 0;
}
.chapters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chapters button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--ink-2);
  font: 500 13px/1.2 var(--font-body);
  cursor: pointer;
  transition:
    border-color 0.25s var(--ease),
    color 0.25s var(--ease);
}
.chapters button:hover,
.chapters button[aria-current='true'] {
  border-color: var(--accent);
  color: var(--ink);
}
.chapters .time {
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}
.chapters .replay {
  margin-left: auto;
}
.note {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 13px;
  line-height: 1.5;
}
.thumbs {
  display: flex;
  gap: 8px;
  padding: 12px clamp(20px, 4vw, 40px) 0;
  overflow-x: auto;
}
.thumbs button {
  position: relative;
  flex: none;
  width: 96px;
  aspect-ratio: 16 / 10;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-2);
  cursor: pointer;
  opacity: 0.7;
  transition:
    opacity 0.25s var(--ease),
    border-color 0.25s var(--ease);
}
.thumbs button:hover,
.thumbs button[aria-pressed='true'] {
  border-color: var(--accent);
  opacity: 1;
}
.thumbs img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
}
.body {
  padding: 24px clamp(20px, 4vw, 40px) 36px;
}
.meta {
  margin: 0 0 10px;
  color: var(--ink-3);
  font-size: 14px;
  font-weight: 500;
}
h2 {
  font-size: clamp(30px, 5vw, 40px);
}
.lead {
  margin: 10px 0 0;
  color: var(--ink);
  font-size: 18px;
  line-height: 1.5;
}
.context {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 14.5px;
}
.details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 14px;
  margin: 22px 0 0;
}
.details div {
  padding: 16px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--surface-2);
}
dt {
  margin-bottom: 6px;
  color: var(--accent);
  font: 600 15px/1.3 var(--font-head);
}
dd {
  margin: 0;
  color: var(--ink-2);
  font-size: 15px;
}
.sub {
  margin: 26px 0 10px;
  color: var(--accent);
  font-size: 15px;
}
.highlights {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 1.2em;
  color: var(--ink-2);
  font-size: 15px;
}
.highlights li::marker {
  color: var(--glow-branch);
}
.contribution {
  margin: 0;
  color: var(--ink-2);
  font-size: 15px;
}
.status {
  margin-left: 10px;
  padding: 0.25em 0.7em;
  border: 1px solid color-mix(in srgb, var(--glow-spark) 55%, transparent);
  border-radius: 999px;
  color: var(--ink);
  font-size: 12.5px;
  white-space: nowrap;
}
.suite-link,
.app {
  border: 1px solid var(--line-strong);
  background: var(--surface-2);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.25s var(--ease);
}
.suite-link {
  margin-top: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 14px;
}
.suite-link:hover,
.app:hover {
  border-color: var(--accent);
}
.apps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.app {
  display: grid;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 14px 16px;
  border-radius: 14px;
}
.app-title {
  font: 600 17px/1.3 var(--font-head);
}
.app-line {
  color: var(--ink-2);
  font-size: 14.5px;
}
.app-status {
  margin-top: 4px;
  color: var(--ink-3);
  font-size: 13px;
}
.integration p,
.story p {
  margin: 0 0 10px;
  color: var(--ink-2);
  font-size: 15px;
}
.integration {
  margin-top: 6px;
  padding: 2px 16px 6px;
  border-left: 2px dashed var(--line-strong);
}
.story h4 {
  margin: 14px 0 4px;
  font-size: 15px;
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}
</style>
