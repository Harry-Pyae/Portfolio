<script setup>
import { ref, watch } from 'vue'
import { suites, appsOf } from '../content/projects.js'
import { showProject } from '../state.js'
import { litProject, lightOn, lightOff, focusLight, blurLight, narrow, exploreShown } from '../tree.js'
import { useSection } from '../reveal.js'
import ProjectNode from './ProjectNode.vue'

// In development: the ClariFile suite sits on the trunk; its two applications branch out of it
// (TreeTrunk draws those branches from .suite-out to each app card's .port). The dashed connector
// between the apps marks a planned integration only, so it never animates like data flowing.
const suite = suites[0]
const apps = appsOf(suite)
const root = ref(null)
const { classes, reveal, shown } = useSection(root)
watch(shown, (v) => v && (exploreShown.value = true), { immediate: true })
</script>

<template>
  <section id="explorations" ref="root" class="section explore" :class="classes()" aria-labelledby="explore-title" @focusin="reveal">
    <div class="section-head">
      <p class="eyebrow rv" style="--d: 0">Now</p>
      <h2 id="explore-title" class="rv" style="--d: 0">In development</h2>
    </div>

    <div class="suite">
      <span class="suite-anchor" aria-hidden="true"></span>
      <div
        class="parent rv"
        style="--d: 1"
        data-suite
        @pointerenter="lightOn($event, suite.id)"
        @pointerleave="lightOff(suite.id)"
        @focusin="focusLight($event, suite.id)"
        @focusout="blurLight"
      >
        <ProjectNode :project="suite" id-prefix="explore" :label="`Suite · ${suite.status}`" :lit="litProject === suite.id" @open="showProject(suite)" />
        <span class="tree-port suite-out" data-port="suite-out" aria-hidden="true"></span>
        <span class="tree-port suite-in" data-port="suite-in" aria-hidden="true"></span>
      </div>

      <ol class="apps" :aria-label="`${suite.title} applications`">
        <li
          v-for="(p, i) in apps"
          :key="p.id"
          class="app rv"
          :class="i ? 'right' : 'left'"
          :style="{ '--d': 2 + i }"
          :data-project="p.id"
          @pointerenter="lightOn($event, p.id)"
          @pointerleave="lightOff(p.id)"
          @focusin="focusLight($event, p.id)"
          @focusout="blurLight"
        >
          <ProjectNode
            :project="p"
            id-prefix="explore"
            :port="narrow || i ? 'left' : 'right'"
            :label="p.status"
            :lit="litProject === p.id || litProject === suite.id"
            @open="showProject(p)"
          />
        </li>
        <li class="planned rv" style="--d: 4" aria-hidden="true">
          <span class="dash"></span>
          <span class="planned-label">Planned integration</span>
        </li>
      </ol>
      <p class="sr-only">{{ suite.integration.label }}: {{ suite.integration.text }}</p>
    </div>
  </section>
</template>

<style scoped>
.section-head > * {
  width: fit-content;
  max-width: 100%;
}
.section-head {
  max-width: calc(50% - 60px); /* the trunk passes down the centre */
}
.suite {
  --gap: 200px;
  --app-w: 256px;
  position: relative;
}
.suite-anchor {
  position: absolute;
  top: 0;
  left: 50%;
}
/* The suite node sits on the trunk, like a group label. */
.parent {
  position: relative;
  width: min(300px, 100%);
  margin: 0 auto;
}
.suite-out {
  left: 50%;
  top: 100%;
}
/* small screens only: where the side spine's branch reaches the suite card */
.suite-in {
  display: none;
  left: 0;
  top: 26px;
}
.apps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--gap) minmax(0, 1fr);
  align-items: start;
  margin: 72px 0 0;
  padding: 0;
  list-style: none;
}
.app {
  width: min(var(--app-w), 100%);
}
.app.left {
  grid-column: 1;
  justify-self: end;
}
.app.right {
  grid-column: 3;
  justify-self: start;
}
/* Planned companion integration: a quiet dashed bracket beneath the apps, from the middle of one to
   the middle of the other, never animated. Its label sits on the left run, clear of the trunk. */
.planned {
  grid-column: 1 / -1;
  grid-row: 2;
  position: relative;
  height: 44px;
  --mid: calc(var(--gap) / 2 + min(var(--app-w), (100% - var(--gap)) / 2) / 2); /* trunk → an app's middle */
}
.dash {
  position: absolute;
  top: 0;
  left: calc(50% - var(--mid));
  right: calc(50% - var(--mid));
  height: 22px;
  border: 1.5px dashed color-mix(in srgb, var(--ink-3) 70%, transparent);
  border-top: 0;
  border-radius: 0 0 10px 10px;
}
.planned-label {
  position: absolute;
  top: 22px;
  left: calc(50% - var(--mid) + 22px);
  padding: 0 8px;
  background: var(--bg);
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transform: translateY(-50%);
}

@media (max-width: 860px) {
  .section-head {
    max-width: none;
    padding-left: var(--spine-inset);
  }
  .parent {
    width: auto; /* fills what's left beside the spine (a fixed 300px overflowed 360px screens) */
    margin: 0 0 0 48px;
    max-width: 320px;
  }
  .suite-out {
    left: 28px;
  }
  .suite-in {
    display: block;
  }
  .apps {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 28px 0 0 72px;
  }
  .app {
    width: auto;
    max-width: 300px;
  }
  .planned {
    order: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding-left: 52px;
  }
  .planned-label {
    position: relative;
    top: 0;
    left: 0;
    transform: none;
  }
  .app.right {
    order: 2;
  }
  .dash {
    left: 40px;
    right: auto;
    top: 0;
    bottom: 0;
    height: auto;
    border: 0;
    border-left: 1.5px dashed color-mix(in srgb, var(--ink-3) 70%, transparent);
    border-radius: 0;
  }
}
</style>
