<script setup>
import { ref, watch, nextTick } from 'vue'
import { openProject, closeProject, motionOn } from '../state.js'
import { profile } from '../content/profile.js'
import ProjectArt from './ProjectArt.vue'

// Native modal <dialog>: inert background (focus trap), Escape to close, top layer.
// We restore focus to the opener ourselves for consistency across browsers.
const dlg = ref(null)
const shown = ref(null) // kept while the dialog fades out
const media = ref(null) // 'video' or a screenshot path shown in the media stage
const vid = ref(null)
let opener = null

watch(openProject, async (p) => {
  const d = dlg.value
  if (p) {
    shown.value = p
    media.value = p.video ? 'video' : (p.gallery?.[0] ?? null)
  }
  if (p && !d.open) {
    opener = document.activeElement
    await nextTick()
    d.showModal()
  } else if (!p && d.open) d.close()
})

function onClose() {
  vid.value?.pause()
  closeProject()
  opener?.focus?.({ preventScroll: true })
  opener = null
}
const onBackdrop = (e) => e.target === dlg.value && dlg.value.close()

const details = [
  ['challenge', 'Challenge & constraints'],
  ['contribution', `${profile.name}'s contribution`],
  ['solution', 'Implemented solution'],
  ['lessons', 'Lessons learned'],
]
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
      <!-- Media stage: the project reel (autoplays muted only while motion is on) and screenshots. -->
      <div v-if="media" class="stage">
        <video
          v-if="media === 'video'"
          ref="vid"
          :key="shown.id"
          :src="shown.video"
          :poster="shown.image"
          :autoplay="motionOn"
          muted
          loop
          playsinline
          controls
          preload="metadata"
          :aria-label="`${shown.title} project reel`"
        ></video>
        <img v-else :src="media" :alt="`${shown.title} screenshot ${shown.gallery.indexOf(media) + 1}`" />
      </div>
      <ProjectArt v-else :project="shown" :alt="`${shown.title} preview`" class="art" />
      <div v-if="media && (shown.gallery?.length ?? 0) + (shown.video ? 1 : 0) > 1" class="thumbs" role="group" aria-label="Project media">
        <button v-if="shown.video" type="button" :aria-pressed="media === 'video'" @click="media = 'video'">
          <img :src="shown.image" alt="" />
          <span class="play" aria-hidden="true">▶</span>
          <span class="sr-only">Project reel</span>
        </button>
        <button v-for="(g, i) in shown.gallery" :key="g" type="button" :aria-pressed="media === g" @click="media = g">
          <img :src="g" alt="" loading="lazy" />
          <span class="sr-only">Screenshot {{ i + 1 }}</span>
        </button>
      </div>
      <div class="body">
        <p class="meta">
          <span>{{ shown.category }}<template v-if="shown.year"> · {{ shown.year }}</template></span>
          <span class="badge" :data-status="shown.status">{{ shown.status }}</span>
        </p>
        <h2 id="modal-title">{{ shown.title }}</h2>
        <p class="summary">{{ shown.summary }}</p>
        <ul class="chips" aria-label="Technologies">
          <li v-for="s in shown.stack" :key="s">{{ s }}</li>
        </ul>

        <dl class="details">
          <div v-for="[key, label] in details" :key="key">
            <dt>{{ label }}</dt>
            <dd :class="{ pending: !shown[key] }">
              {{ shown[key] || (shown.status === 'Planned' ? 'To be documented once the build is under way.' : 'Not documented yet.') }}
            </dd>
          </div>
        </dl>

        <div class="links">
          <a v-if="shown.links.demo" class="btn btn--primary" :href="shown.links.demo" target="_blank" rel="noopener noreferrer">
            Live demo<span class="sr-only"> (opens in a new tab)</span>
          </a>
          <span v-else class="link-off">Live demo · not available yet</span>
          <a v-if="shown.links.github" class="btn" :href="shown.links.github" target="_blank" rel="noopener noreferrer">
            GitHub<span class="sr-only"> (opens in a new tab)</span>
          </a>
          <span v-else class="link-off">GitHub · not available yet</span>
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
  padding: 26px clamp(20px, 4vw, 40px) 36px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0 0 10px;
  color: var(--ink-3);
  font-size: 14px;
  font-weight: 500;
}
h2 {
  font-size: clamp(30px, 5vw, 40px);
}
.summary {
  margin: 12px 0 18px;
  color: var(--ink-2);
  font-size: 17px;
}
.details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 14px;
  margin: 28px 0 0;
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
dd.pending {
  color: var(--ink-3);
  font-style: italic;
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}
</style>
