<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { projects, categories } from '../content/projects.js'
import { showProject, prefersReduced } from '../state.js'
import { litProject, projectsVisible, lightOn, lightOff, focusLight, blurLight, narrow } from '../tree.js'
import ProjectNode from './ProjectNode.vue'

// Layout of the branching project section. The trunk passing through it, the branches to each card
// and the particles on them are drawn by TreeTrunk from these elements' measured positions
// (.trunk-anchor, .group-label, and each card's .port).
// Hand-tuned unevenness, so the tree grows rather than stacks. Per group: SHIFT moves the group (and the
// trunk through its label) left or right, -1..1 of the shift range; LABEL_GAP is the space above its label.
// Per card in tree order: REACH is its distance from the trunk (px), GAP its vertical offset from the
// card above (px; negative tucks it alongside).
const SHIFT = [-0.5, 0.65, -0.8, 0.45]
const LABEL_GAP = [8, 116, 100, 124]
const REACH = [64, 104, 52, 118, 88, 58, 72, 96]
const GAP = [0, -6, 0, -40, 0, 14, 0, -22]

// Categories become branch groups on the trunk; cards alternate sides within each group.
// Quiet groups (Earlier Work) get a smaller, calmer branch and compact cards.
const groups = categories
  .filter((c) => !c.section)
  .map((c) => ({ ...c, items: projects.filter((p) => p.category === c.name) }))
  .filter((g) => g.items.length)
let n = 0
groups.forEach((g, gi) => {
  g.shift = SHIFT[gi % SHIFT.length]
  g.labelGap = LABEL_GAP[gi % LABEL_GAP.length]
  g.items = g.items.map((p, k) => {
    const it = { p, i: n, side: k % 2 ? 'right' : 'left', reach: REACH[n % REACH.length], gap: k ? GAP[n % GAP.length] : 0 }
    n++
    return it
  })
})

const section = ref(null)
const pending = ref(false) // staggered entrance; cards stay fully interactive throughout

const portSide = (it) => (narrow.value || it.side === 'right' ? 'left' : 'right')

const focusIn = (e, id) => {
  pending.value = false // keyboard users never wait for the entrance
  focusLight(e, id)
}

let io
onMounted(() => {
  if (!prefersReduced.value && section.value.getBoundingClientRect().top > innerHeight) pending.value = true
  io = new IntersectionObserver(
    ([e]) => {
      projectsVisible.value = e.isIntersecting
      if (e.isIntersecting) pending.value = false
    },
    { rootMargin: '0px 0px -15% 0px' },
  )
  io.observe(section.value)
})
onBeforeUnmount(() => {
  io.disconnect()
})
</script>

<template>
  <section id="projects" ref="section" class="section tree-section" :class="{ pending }" aria-labelledby="projects-title">
    <div class="section-head">
      <p class="eyebrow">Work</p>
      <h2 id="projects-title">Projects</h2>
    </div>

    <div class="tree">
      <span class="trunk-anchor" aria-hidden="true"></span>
      <div
        v-for="(g, gi) in groups"
        :key="g.name"
        class="group"
        :class="{ quiet: g.quiet }"
        :style="{ '--shift': g.shift, '--label-gap': `${g.labelGap}px` }"
      >
        <h3 class="group-label" :data-group="gi">{{ g.name }}</h3>
        <ol class="nodes">
          <li
            v-for="it in g.items"
            :key="it.p.id"
            class="node-wrap"
            :class="it.side"
            :data-project="it.p.id"
            :data-group="gi"
            :style="{ '--i': it.i, '--reach': `${it.reach}px`, '--gap': `${it.gap}px` }"
            @pointerenter="lightOn($event, it.p.id)"
            @pointerleave="lightOff(it.p.id)"
            @focusin="focusIn($event, it.p.id)"
            @focusout="blurLight"
          >
            <ProjectNode
              :project="it.p"
              id-prefix="tree"
              :port="portSide(it)"
              :lit="litProject === it.p.id"
              @open="showProject(it.p)"
            />
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tree-section {
  position: relative;
}
/* Content-sized heading boxes, so the trunk can route around the actual text. */
.section-head > * {
  width: fit-content;
  max-width: 100%;
}

/* ---------- layout: alternating sides of a central trunk; a side spine on small screens ---------- */
.tree {
  --node-w: 256px;
  position: relative;
  padding-bottom: 24px;
}
.trunk-anchor {
  position: absolute;
  top: 0;
  left: 50%;
}
.group {
  /* the group (and the trunk through its label) sits a little left or right of centre */
  --shift-px: calc(var(--shift, 0) * min(4vw, 56px));
  position: relative;
  left: var(--shift-px);
  display: flex;
  flex-direction: column;
}
.group-label {
  align-self: center;
  margin: var(--label-gap, 48px) 0 34px;
  padding: 10px 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 0 0 6px var(--bg); /* a clear ring of space where the trunk passes behind the label */
  color: var(--ink);
  font: 600 16.5px/1.2 var(--font-head);
  letter-spacing: 0;
}
.group:first-child .group-label {
  margin-top: 8px;
}
.nodes {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.node-wrap {
  position: relative;
  /* narrower only when the shifted group would push the card past the page edge */
  width: min(var(--node-w), calc(50% - var(--reach) - 4px - max(var(--shift-px), -1 * var(--shift-px))));
  transition:
    opacity 0.6s var(--ease),
    transform 0.6s var(--ease);
  transition-delay: calc(var(--i) * 90ms + 150ms);
}
.node-wrap.left {
  align-self: flex-end;
  margin-right: calc(50% + var(--reach));
}
.node-wrap.right {
  align-self: flex-start;
  margin-left: calc(50% + var(--reach));
}
/* Alternate cards tuck alongside each other; same-side cards never overlap. */
.node-wrap + .node-wrap {
  margin-top: calc(-28px + var(--gap, 0px));
}
.pending .node-wrap {
  opacity: 0;
  transform: translateY(16px);
}

/* Earlier Work: a smaller, calmer branch that is still easy to open. */
.quiet .group-label {
  border-color: var(--line-strong);
  color: var(--ink-2);
  font-size: 14px;
}
.quiet .node-wrap {
  --node-w: 228px;
}
.quiet :deep(.node) {
  padding: 11px 12px 12px;
  box-shadow: none;
}
.quiet :deep(.title) {
  font-size: 15.5px;
}
.quiet :deep(.desc) {
  font-size: 13.5px;
}

@media (max-width: 860px) {
  .tree-section {
    padding-top: 150px; /* room for the trunk to swing from the hero to the side spine */
  }
  .section-head {
    padding-left: var(--spine-inset);
  }
  .trunk-anchor {
    left: 18px;
  }
  .group {
    left: 0; /* the side spine stays straight */
  }
  .group-label {
    align-self: flex-start;
    margin: 60px 0 18px 40px;
  }
  .group:first-child .group-label {
    margin-top: 4px;
  }
  .node-wrap,
  .node-wrap.left,
  .node-wrap.right {
    align-self: stretch;
    width: auto;
    max-width: 360px;
    margin: 0 0 14px 48px;
  }
  .node-wrap + .node-wrap {
    margin-top: 0;
  }
}
</style>
