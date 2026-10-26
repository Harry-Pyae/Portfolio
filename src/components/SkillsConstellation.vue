<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { profile } from '../content/profile.js'
import { projects } from '../content/projects.js'
import { showProject } from '../state.js'

const byId = (id) => projects.find((p) => p.id === id)

// Skills as small constellations: each skill is a plain label under a star; thin connectors join
// neighbouring stars on the same row only, so lines never cross text. Static, non-interactive.
const groups = [
  { key: 'core', title: 'Core specialties', note: 'Primary stack', clusters: profile.skills.core },
  { key: 'general', title: 'General knowledge & ecosystem tools', clusters: [{ group: null, items: profile.skills.general }] },
]
const jitter = (k) => [0, 6, 2, 7, 3, 5][k % 6] // px offset of each star inside its row: an irregular skyline
// A long list breaks into balanced rows (5 -> 3 + 2) instead of leaving one star alone on a second row.
const cols = (n) => (n > 4 ? Math.ceil(n / 2) : n)

const els = []
const links = ref([]) // per cluster: { w, h, segs: [[x1, y1, x2, y2]] }

function measure() {
  links.value = els.map((c) => {
    if (!c) return { w: 1, h: 1, segs: [] }
    // offsetLeft/Top relative to the cluster (its positioned ancestor chain), unaffected by transforms
    const pts = [...c.querySelectorAll('.star')].map((s) => {
      const li = s.parentElement
      return [li.offsetLeft + s.offsetLeft + s.offsetWidth / 2, li.offsetTop + s.offsetTop + s.offsetHeight / 2, li.offsetTop]
    })
    const segs = []
    for (let k = 1; k < pts.length; k++) if (pts[k][2] === pts[k - 1][2]) segs.push([...pts[k - 1].slice(0, 2), ...pts[k].slice(0, 2)])
    return { w: c.offsetWidth, h: c.offsetHeight, segs }
  })
}

let ro
onMounted(() => {
  ro = new ResizeObserver(measure)
  els.forEach((c) => c && ro.observe(c))
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => ro.disconnect())

let n = 0
const clusterIndex = groups.map((g) => g.clusters.map(() => n++))
</script>

<template>
  <div class="skills">
    <h2 id="skills-title" class="skills-title rv" style="--d: 4">Skills</h2>
    <!-- The page trunk runs through this lane; secondary branches reach each group. -->
    <div class="lane" data-lane="skills" aria-hidden="true"></div>
    <section
      v-for="(g, gi) in groups"
      :key="g.key"
      class="sky-group rv"
      :class="g.key"
      :style="{ '--d': 5 + gi }"
      :aria-labelledby="`skills-${g.key}`"
    >
      <span class="tree-port" :data-port="`skills-${g.key}`" aria-hidden="true"></span>
      <h3 :id="`skills-${g.key}`" class="group-title">
        {{ g.title }}<span v-if="g.note" class="note">{{ g.note }}</span>
      </h3>
      <div class="clusters">
        <div
          v-for="(c, ci) in g.clusters"
          :key="ci"
          :ref="(el) => (els[clusterIndex[gi][ci]] = el)"
          class="cluster"
        >
          <svg
            class="links"
            :viewBox="`0 0 ${links[clusterIndex[gi][ci]]?.w ?? 1} ${links[clusterIndex[gi][ci]]?.h ?? 1}`"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              v-for="(s, k) in links[clusterIndex[gi][ci]]?.segs ?? []"
              :key="k"
              :x1="s[0]"
              :y1="s[1]"
              :x2="s[2]"
              :y2="s[3]"
            />
          </svg>
          <h4 v-if="c.group" class="cluster-title">{{ c.group }}</h4>
          <ul class="stars-list" :style="{ '--cols': cols(c.items.length) }">
            <li v-for="(s, k) in c.items" :key="s">
              <span class="star" :style="{ marginTop: `${jitter(k)}px` }" aria-hidden="true"></span>
              <span class="label">{{ s }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Currently exploring: what I'm deepening now, and where it shows up. No ratings. One compact
         group of two columns under its heading, beside the trunk's lane. -->
    <section class="sky-group exploring rv" style="--d: 7" aria-labelledby="skills-exploring">
      <span class="tree-port" data-port="skills-exploring" aria-hidden="true"></span>
      <h3 id="skills-exploring" class="group-title">Currently exploring</h3>
      <ul class="explore-list">
        <li v-for="x in profile.skills.exploring" :key="x.name">
          <span class="x-name"><span class="star" aria-hidden="true"></span>{{ x.name }}</span>
          <span class="x-note">{{ x.note }}</span>
          <span class="x-links">
            <span class="x-in">In</span>
            <button
              v-for="id in x.projects"
              :key="id"
              type="button"
              class="x-link"
              :aria-label="`Open ${byId(id).title} project`"
              @click="showProject(byId(id))"
            >
              {{ byId(id).short ?? byId(id).title }}
            </button>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.skills {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) var(--lane-w) minmax(0, 0.8fr);
  row-gap: clamp(28px, 4vw, 48px);
  margin-top: var(--sub-gap);
}
.skills-title {
  grid-column: 1 / -1;
}
.lane {
  grid-row: 2 / span 2;
  grid-column: 2;
}
.sky-group.exploring {
  grid-row: 3;
  grid-column: 1;
}
.explore-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 36px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.explore-list li {
  display: grid;
  gap: 4px;
  align-content: start;
}
.x-name {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font: 600 16px/1.3 var(--font-head);
}
.exploring .star {
  width: 6px;
  height: 6px;
  background: var(--glow-spark);
  box-shadow: 0 0 6px color-mix(in srgb, var(--glow-spark) 55%, transparent);
}
.x-note {
  color: var(--ink-2);
  font-size: 14.5px;
}
.x-links {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 14px;
  color: var(--ink-3);
  font-size: 13.5px;
}
.x-in {
  font: 500 12px/1 var(--font-mono);
}
/* quiet text links: a short name, underlined on hover; the button keeps a comfortable tap height */
.x-link {
  min-height: 32px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink-2);
  font: 500 13.5px/32px var(--font-body);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--ink-3) 45%, transparent);
  text-underline-offset: 4px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    text-decoration-color 0.2s ease;
}
.x-link:hover,
.x-link:focus-visible {
  color: var(--accent);
  text-decoration-color: currentColor;
}
.sky-group.core {
  grid-row: 2;
  grid-column: 1;
}
.sky-group.general {
  grid-row: 2;
  grid-column: 3;
}
.sky-group {
  position: relative;
  padding-top: 22px;
  border-top: 1px solid var(--line-strong);
}
.core {
  border-top-color: color-mix(in srgb, var(--accent) 55%, transparent);
}
.group-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 26px;
  font-size: 20px;
  line-height: 1.3;
}
.note {
  color: var(--ink-3);
  font: 500 12.5px/1.2 var(--font-mono);
}
.clusters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 28px 40px;
}
.cluster {
  position: relative;
}
.links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.links line {
  stroke: color-mix(in srgb, var(--glow-trunk) 40%, transparent);
  stroke-width: 1;
}
.general .links line {
  stroke: color-mix(in srgb, var(--glow-branch) 32%, transparent);
}
.cluster-title {
  margin-bottom: 14px;
  color: var(--ink-2);
  font: 500 14px/1.3 var(--font-body);
  letter-spacing: 0;
}
.stars-list {
  display: grid; /* not positioned: list items measure their offsets against the cluster */
  grid-template-columns: repeat(var(--cols), max-content);
  gap: 18px 28px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stars-list li {
  position: relative;
  display: grid;
  grid-template-rows: 16px auto;
  justify-items: center;
}
.star {
  align-self: start;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--glow-pale);
  box-shadow: 0 0 6px color-mix(in srgb, var(--glow-trunk) 50%, transparent);
}
.general .star {
  width: 5px;
  height: 5px;
  background: var(--glow-branch);
  box-shadow: 0 0 6px color-mix(in srgb, var(--glow-branch) 50%, transparent);
}
.label {
  margin-top: 6px;
  color: var(--ink);
  font: 500 15px/1.3 var(--font-body);
  white-space: nowrap;
}
.general .label {
  color: var(--ink-2);
  font-size: 14.5px;
}
/* Ports sit on each group's top rule, on the side facing the trunk. */
.sky-group > .tree-port {
  top: 0;
  left: 0;
}
.core > .tree-port,
.exploring > .tree-port {
  left: 100%;
}
@media (max-width: 860px) {
  .skills {
    grid-template-columns: minmax(0, 1fr);
    padding-left: var(--spine-inset);
  }
  .lane {
    display: none;
  }
  .sky-group.core,
  .sky-group.general,
  .sky-group.exploring {
    grid-row: auto;
    grid-column: 1;
  }
  /* phones: a four-item row would run off the edge, so it splits 2 + 2 */
  .stars-list:has(> li:nth-child(4):last-child) {
    grid-template-columns: repeat(2, max-content);
  }
  .explore-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .core > .tree-port,
  .exploring > .tree-port {
    left: 0;
  }
}
</style>
