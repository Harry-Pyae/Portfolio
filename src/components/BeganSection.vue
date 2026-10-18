<script setup>
import { ref } from 'vue'
import { inGroup } from '../content/projects.js'
import { showProject } from '../state.js'
import { litProject, lightOn, lightOff, focusLight, blurLight, narrow } from '../tree.js'
import { useSection } from '../reveal.js'
import ProjectNode from './ProjectNode.vue'

// Where it began: the earliest projects, set among the footer roots. TreeTrunk grows a root to each
// card's .port; the trunk passes down the centre, so the heading and cards keep to either side.
const items = inGroup('Where it began')
const root = ref(null)
const { classes, reveal } = useSection(root)
</script>

<template>
  <section id="beginnings" ref="root" class="section began" :class="classes()" aria-labelledby="began-title" @focusin="reveal">
    <div class="began-head">
      <p class="eyebrow rv" style="--d: 0">Roots</p>
      <h2 id="began-title" class="rv" style="--d: 0">Where it began</h2>
      <p class="lede rv" style="--d: 1">
        My first pages were built with HTML and CSS. These projects are where I began learning layout, styling, and how to
        turn an idea into an interface.
      </p>
    </div>
    <ol class="cards" aria-label="Earliest projects">
      <li
        v-for="(p, i) in items"
        :key="p.id"
        class="card rv"
        :class="i % 2 ? 'right' : 'left'"
        :style="{ '--d': 2 + i }"
        :data-project="p.id"
        @pointerenter="lightOn($event, p.id)"
        @pointerleave="lightOff(p.id)"
        @focusin="focusLight($event, p.id)"
        @focusout="blurLight"
      >
        <ProjectNode :project="p" id-prefix="began" :port="narrow || i % 2 ? 'left' : 'right'" :lit="litProject === p.id" @open="showProject(p)" />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.began {
  padding-top: clamp(120px, 14vw, 190px);
}
.began-head {
  max-width: calc(50% - 70px); /* the trunk descends through the centre here */
}
.began h2 {
  font-size: clamp(26px, 3vw, 34px);
}
.lede {
  margin: 12px 0 0;
  color: var(--ink-2);
  font-size: 15.5px;
}
.cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px minmax(0, 1fr);
  margin: 72px 0 0;
  padding: 0;
  list-style: none;
}
.card {
  width: min(240px, 100%);
}
.card.left {
  grid-column: 1;
  justify-self: end;
}
.card.right {
  grid-column: 3;
  justify-self: start;
  margin-top: 36px; /* staggered, so the two roots split at different depths */
}
/* Quieter than recent work, still clearly openable. */
.card :deep(.node) {
  padding: 11px 12px 12px;
  box-shadow: none;
}
.card :deep(.title) {
  font-size: 15.5px;
}
.card :deep(.desc) {
  font-size: 13.5px;
}

@media (max-width: 860px) {
  .began-head {
    max-width: none;
    padding-left: var(--spine-inset);
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 28px 0 0 48px;
  }
  .card,
  .card.right {
    width: auto;
    max-width: 320px;
    margin-top: 0;
  }
}
</style>
