<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { projects, categories } from '../content/projects.js'
import { showProject, prefersReduced } from '../state.js'
import { litProject, projectsVisible, lightOn, lightOff, focusLight, blurLight, narrow } from '../tree.js'
import ProjectNode from './ProjectNode.vue'

// Layout of the branching project section. The trunk passing through it, the branches to each card
// and the particles on them are drawn by TreeTrunk from these elements' measured positions
// (.trunk-anchor, each heading's .junction, and each card's .port).
// Within a group, cards sit on two alignment guides, one either side of the trunk (--reach).
// The groups themselves sit a little left or right of centre, so the trunk takes a few broad bends
// through the section instead of running straight: it leans left through the first group, sweeps right
// for the next two, and eases back to the centre for In development. SHIFT is each group's place in
// the shift range (−1…1), REACH its trunk-to-card distance; both repeat if groups are added.
const SHIFT = [-0.32, 0.44, 0.32, 0.02]
const REACH = [64, 72, 62, 58]

// Categories become branch groups on the trunk; cards alternate sides within each group.
// Lead groups (recent work) get slightly stronger cards; quiet groups (earlier work) calmer ones.
const groups = categories
  .filter((c) => !c.section)
  .map((c) => ({ ...c, items: projects.filter((p) => p.category === c.name) }))
  .filter((g) => g.items.length)
let n = 0
groups.forEach((g, gi) => {
  g.shift = SHIFT[gi % SHIFT.length]
  g.reach = REACH[gi % REACH.length]
  g.headSide = g.shift > 0.2 ? 'left' : 'right' // the heading takes the side with room beside the trunk
  g.items = g.items.map((p, k) => ({ p, i: n++, side: k % 2 ? 'right' : 'left' }))
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
        :class="{ quiet: g.quiet, lead: g.lead }"
        :style="{ '--shift': g.shift, '--reach': `${g.reach}px` }"
      >
        <!-- a quiet heading beside a gold junction on the trunk; not interactive, so not boxed -->
        <h3 class="group-label" :class="`side-${g.headSide}`">
          <span class="junction" :data-group="gi" aria-hidden="true"></span>{{ g.name }}
        </h3>
        <ol class="nodes">
          <li
            v-for="it in g.items"
            :key="it.p.id"
            class="node-wrap"
            :class="it.side"
            :data-project="it.p.id"
            :data-group="gi"
            :style="{ '--i': it.i }"
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
  --node-w: 272px;
  --reach: 64px; /* both guides: the gap between the trunk line and the cards' near edges */
  position: relative;
  padding-bottom: 24px;
}
.trunk-anchor {
  position: absolute;
  top: 0;
  left: 50%;
}
.group {
  /* the group (and the trunk through it) sits a little left or right of centre: padding on one side moves
     its centre line without the box ever reaching past the page */
  --shift-px: calc(var(--shift, 0) * min(12vw, 170px));
  position: relative;
  display: flex;
  flex-direction: column;
  padding-left: max(0px, calc(2 * var(--shift-px)));
  padding-right: max(0px, calc(-2 * var(--shift-px)));
}
/* The heading starts at the trunk line: its gold junction sits on the trunk, the text clear beside it. */
.group-label {
  position: relative;
  align-self: flex-start;
  margin: 96px 0 26px 50%;
  padding-left: 44px; /* past the trunk's strands */
  color: var(--ink-2);
  font: 600 15px/1.3 var(--font-head);
  letter-spacing: -0.005em;
}
.group:first-child .group-label {
  margin-top: 8px;
}
.junction {
  position: absolute;
  left: 0;
  top: 50%;
  width: 11px;
  height: 11px;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  background: var(--bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bg) 70%, transparent);
  transform: translate(-50%, -50%);
}
.group-label.side-left {
  align-self: flex-end;
  margin-left: 0;
  margin-right: 50%;
  padding-left: 0;
  padding-right: 44px;
  text-align: right;
}
.side-left .junction {
  left: 100%;
}
.lead .group-label {
  color: var(--ink);
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
  width: min(var(--node-w), calc(50% - var(--reach) - 4px));
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
  margin-top: -36px;
}
.pending .node-wrap {
  opacity: 0;
  transform: translateY(16px);
}

/* Recent work: the same card with a slightly warmer edge and a larger title. */
.lead :deep(.node) {
  border-color: color-mix(in srgb, var(--accent) 22%, var(--line-strong));
}
.lead :deep(.title) {
  font-size: 17px;
}
/* Earlier work: a smaller, calmer branch that is still easy to open. */
.quiet .group-label {
  color: var(--ink-3);
  font-size: 14px;
}
.quiet .junction {
  border-color: var(--accent-muted);
}
.quiet .node-wrap {
  --node-w: 240px;
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
    padding: 0; /* the side spine stays straight */
  }
  .group-label,
  .group-label.side-left {
    align-self: flex-start;
    margin: 48px 0 16px 18px; /* the junction sits on the side spine */
    padding: 0 0 0 30px;
    text-align: left;
  }
  .side-left .junction {
    left: 0;
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
