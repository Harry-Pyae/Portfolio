<script setup>
import { profile } from '../content/profile.js'

// Beyond the Code: a few things I enjoy. Static text with small original line drawings; nothing here
// is clickable, so there are no hover states or button shapes.
const ICONS = {
  // knight: mane, muzzle, eye and a base
  chess: 'M8 20h9M9 20v-2.5c0-2 1.5-3 2-4.5l-3.2.8L7 12l4-5.5L10.5 4l2.5 1.2c3.5 1 5 4 4.5 8.3L17 18v2M13.5 9.2h.01',
  // controller with a small speech mark above: games with stories
  story: 'M6 12h12a3 3 0 012.9 3.7l-.6 2.3a1.6 1.6 0 01-2.7.7L15.8 17H8.2l-1.8 1.7a1.6 1.6 0 01-2.7-.7l-.6-2.3A3 3 0 016 12zM8 14v2M7 15h2M15.5 14.6h.01M17 15.6h.01M10 9.5V7a1 1 0 011-1h4a1 1 0 011 1v1.6a1 1 0 01-1 1h-2.2L11 11z',
  // cup and saucer with steam
  cup: 'M5 11h11v3a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 12h1.5a2 2 0 010 4H16M4 21h14M9 8c-.8-.9.8-1.6 0-2.6M12.5 8c-.8-.9.8-1.6 0-2.6',
}
</script>

<template>
  <section class="interests" aria-labelledby="interests-title">
    <div class="intro rv" style="--d: 8">
      <h3 id="interests-title">Beyond the Code</h3>
    </div>
    <div class="lane" data-lane="interests" aria-hidden="true"></div>
    <div class="list-wrap rv" style="--d: 9">
      <span class="tree-port" data-port="interests" aria-hidden="true"></span>
      <ul class="list">
      <li v-for="it in profile.interests" :key="it.title">
        <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS[it.icon]" /></svg>
        <span class="text">
          <span class="name">{{ it.title }}</span>
          <span class="line">{{ it.text }}</span>
        </span>
      </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.interests {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) var(--lane-w) minmax(0, 1.5fr);
  align-items: start;
  margin-top: var(--sub-gap);
}
.intro h3 {
  font-size: clamp(22px, 2.4vw, 28px);
}
.lane {
  align-self: stretch;
  min-height: 100%;
}
.list-wrap {
  position: relative;
}
.list {
  display: grid;
  gap: 18px;
  margin: 0;
  padding: 4px 0 0;
  list-style: none;
}
.list-wrap > .tree-port {
  left: -22px;
  top: 14px;
}
.list li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.ico {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: var(--glow-branch);
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.85;
}
.text {
  display: grid;
  gap: 2px;
  max-width: 56ch;
}
.name {
  color: var(--ink);
  font: 600 16px/1.35 var(--font-head);
}
.line {
  color: var(--ink-2);
  font-size: 15px;
  line-height: 1.6;
}

@media (max-width: 860px) {
  .interests {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 22px;
    padding-left: var(--spine-inset);
  }
  .lane {
    display: none;
  }
}
</style>
