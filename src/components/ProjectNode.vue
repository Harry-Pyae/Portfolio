<script setup>
import ProjectArt from './ProjectArt.vue'

defineProps({
  project: { type: Object, required: true },
  idPrefix: { type: String, required: true }, // keeps description ids unique when a project appears twice
  port: { type: String, default: 'none' }, // side of the branch connection point: 'left' | 'right' | 'none'
  lit: { type: Boolean, default: false }, // highlighted from outside (carousel hover / keyboard focus)
})
defineEmits(['open'])
</script>

<!-- Compact project card: the whole card is one button. Details live in the project view. -->
<template>
  <button
    type="button"
    class="node"
    :class="[`port-${port}`, { lit }]"
    :aria-label="`Open ${project.title} project`"
    :aria-describedby="`${idPrefix}-${project.id}-desc`"
    @click="$emit('open')"
  >
    <ProjectArt :project="project" glyph class="sym" />
    <span class="body">
      <span class="title">{{ project.title }}</span>
      <span :id="`${idPrefix}-${project.id}-desc`" class="desc">
        {{ project.tagline || project.summary }}
        <span v-if="project.status !== 'Completed'" class="status">{{ project.status }}</span>
      </span>
    </span>
    <svg class="arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M5 11L11 5M6 5h5v5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" />
    </svg>
    <span class="port" :data-side="port" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.node {
  --port-y: 26px;
  position: relative;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  column-gap: 12px;
  align-items: start;
  width: 100%;
  padding: 14px 14px 15px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 12px 28px -16px rgba(0, 0, 0, 0.9);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.3s var(--ease),
    border-color 0.3s var(--ease);
}
/* Lift shadow and edge glow are pre-rendered; only opacity changes. */
.node::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  box-shadow:
    0 20px 40px -16px rgba(0, 0, 0, 0.95),
    0 0 22px -10px color-mix(in srgb, var(--accent) 50%, transparent);
  opacity: 0;
  transition: opacity 0.3s var(--ease);
  pointer-events: none;
}
.node.lit,
.node:focus-visible {
  transform: scale(var(--node-zoom, 1.04));
  border-color: color-mix(in srgb, var(--accent) 75%, transparent);
}
.node.lit::before,
.node:focus-visible::before {
  opacity: 1;
}
@media (hover: hover) {
  .node:hover {
    transform: scale(var(--node-zoom, 1.04));
    border-color: color-mix(in srgb, var(--accent) 75%, transparent);
  }
  .node:hover::before {
    opacity: 1;
  }
}
/* Zoom from the connection point, so a lit card never pulls away from its branch. */
.port-left {
  transform-origin: 0 var(--port-y);
}
.port-right {
  transform-origin: 100% var(--port-y);
}
.node:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.sym {
  width: 32px;
  height: 32px;
  margin-top: 1px;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.title {
  padding-right: 18px; /* room for the corner arrow */
  font: 600 17px/1.25 var(--font-head);
  letter-spacing: -0.01em;
}
.desc {
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.5;
}
.status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 500;
}
.status::before {
  content: '';
  width: 6px;
  height: 6px;
  border: 1px solid var(--ink-3);
  border-radius: 50%;
}
.arrow {
  position: absolute;
  top: 15px;
  right: 12px;
  color: var(--ink-3);
  transition:
    color 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.node.lit .arrow,
.node:focus-visible .arrow {
  color: var(--accent);
  transform: translate(2px, -2px);
}
@media (hover: hover) {
  .node:hover .arrow {
    color: var(--accent);
    transform: translate(2px, -2px);
  }
}

/* Branch connection point. Centred on the card edge via translate, so offsetLeft/Top is its centre. */
.port {
  position: absolute;
  top: var(--port-y);
  width: 9px;
  height: 9px;
  border: 1.5px solid color-mix(in srgb, var(--glow-branch) 70%, transparent);
  border-radius: 50%;
  background: var(--surface);
  transform: translate(-50%, -50%);
  transition:
    background-color 0.3s var(--ease),
    border-color 0.3s var(--ease),
    box-shadow 0.3s var(--ease);
  pointer-events: none;
}
.port[data-side='none'] {
  left: 0;
  visibility: hidden; /* keeps its layout box, so its position can still be measured */
}
.port[data-side='left'] {
  left: 0;
}
.port[data-side='right'] {
  left: 100%;
}
.node.lit .port,
.node:focus-visible .port {
  border-color: var(--glow-pale);
  background: var(--glow-spark); /* lit connection point: one of the rare warm knots */
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--glow-spark) 60%, transparent);
}
@media (hover: hover) {
  .node:hover .port {
    border-color: var(--glow-pale);
    background: var(--glow-spark);
    box-shadow: 0 0 10px 2px color-mix(in srgb, var(--glow-spark) 60%, transparent);
  }
}
</style>
