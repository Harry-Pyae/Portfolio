<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { projects, categories } from '../content/projects.js'
import { showProject, prefersReduced } from '../state.js'
import { litProject, projectsVisible } from '../tree.js'
import ProjectNode from './ProjectNode.vue'

// Layout of the branching project section. The trunk passing through it, the branches to each card
// and the particles on them are drawn by TreeTrunk from these elements' measured positions
// (.trunk-anchor, .group-label, and each card's .port).
const rand = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Categories become branch groups on the trunk; cards alternate sides within each group.
const groups = categories
  .map((name) => ({ name, items: projects.filter((p) => p.category === name) }))
  .filter((g) => g.items.length)
let n = 0
for (const g of groups) {
  g.items = g.items.map((p, k) => ({ p, i: n++, side: k % 2 ? 'right' : 'left', reach: Math.round(56 + rand(n + 3) * 48) }))
}

const section = ref(null)
const pending = ref(false) // staggered entrance; cards stay fully interactive throughout
const narrow = ref(false)

const portSide = (it) => (narrow.value || it.side === 'right' ? 'left' : 'right')

const enter = (e, id) => e.pointerType === 'mouse' && (litProject.value = id)
const leave = (id) => litProject.value === id && (litProject.value = null)
const focusIn = (e, id) => {
  pending.value = false // keyboard users never wait for the entrance
  if (e.target.matches(':focus-visible')) litProject.value = id
}
const focusOut = () => (litProject.value = null)

const mq = matchMedia('(max-width: 860px)')
const onMq = () => (narrow.value = mq.matches)
let io
onMounted(() => {
  onMq()
  mq.addEventListener('change', onMq)
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
  mq.removeEventListener('change', onMq)
  io.disconnect()
})
</script>

<template>
  <section id="projects" ref="section" class="section tree-section" :class="{ pending }" aria-labelledby="projects-title">
    <div class="section-head">
      <p class="eyebrow">Work</p>
      <h2 id="projects-title">Projects</h2>
      <p class="section-lede">Every project grows from the same trunk. Open a card for the stack, scope and links.</p>
    </div>

    <div class="tree">
      <span class="trunk-anchor" aria-hidden="true"></span>
      <div v-for="g in groups" :key="g.name" class="group">
        <h3 class="group-label">{{ g.name }}</h3>
        <ol class="nodes">
          <li
            v-for="it in g.items"
            :key="it.p.id"
            class="node-wrap"
            :class="it.side"
            :data-project="it.p.id"
            :style="{ '--i': it.i, '--reach': `${it.reach}px` }"
            @pointerenter="enter($event, it.p.id)"
            @pointerleave="leave(it.p.id)"
            @focusin="focusIn($event, it.p.id)"
            @focusout="focusOut"
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
.section-lede {
  max-width: 46ch;
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
  display: flex;
  flex-direction: column;
}
.group-label {
  align-self: center;
  margin: 48px 0 26px;
  padding: 8px 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  border-radius: 999px;
  background: var(--bg);
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
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
  margin-top: -28px;
}
.pending .node-wrap {
  opacity: 0;
  transform: translateY(16px);
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
  .group-label {
    align-self: flex-start;
    margin: 36px 0 18px 40px;
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
