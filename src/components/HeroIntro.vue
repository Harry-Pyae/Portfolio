<script setup>
import { profile } from '../content/profile.js'
</script>

<template>
  <div class="intro">
    <div class="portrait">
      <img v-if="profile.portrait" :src="profile.portrait" :alt="`Portrait of ${profile.name}`" width="148" height="148" />
      <span v-else class="placeholder" role="img" :aria-label="`Portrait placeholder for ${profile.name}`">
        {{ profile.monogram }}
      </span>
    </div>
    <h1 id="hero-name" class="name">{{ profile.name }}</h1>
    <p class="title">{{ profile.title }}</p>
    <p class="lede">{{ profile.intro }}</p>
    <ul class="stack" aria-label="Core stack">
      <li v-for="s in profile.focusStack" :key="s">{{ s }}</li>
    </ul>
    <div class="actions">
      <a class="btn btn--primary" href="#projects">
        Explore Projects
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path d="M10 4v12m0 0l-5-5m5 5l5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
        </svg>
      </a>
      <a class="btn" href="#contact">Get in Touch</a>
    </div>
  </div>
</template>

<style scoped>
.intro {
  position: relative;
  z-index: 1;
  min-width: 0;
  padding: clamp(24px, 4vh, 48px) 0;
}
.portrait {
  width: 136px;
  height: 136px;
  margin-bottom: 32px;
  padding: 4px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--surface);
  /* Restrained rim light: one thin amber edge, no washes. */
  box-shadow: -3px -3px 0 -1px color-mix(in srgb, var(--accent) 50%, transparent);
}
.portrait img,
.placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.placeholder {
  background: var(--surface-2);
  color: var(--accent);
  font: 700 52px/1 var(--font-head);
}
.name {
  color: var(--ink);
  font: 700 clamp(60px, 7.6vw, 104px) / 1 var(--font-head);
  letter-spacing: -0.045em;
}
.title {
  margin: 20px 0 0;
  color: var(--ink);
  font: 500 clamp(17px, 1.5vw, 20px) / 1.4 var(--font-head);
  letter-spacing: -0.005em;
}
.lede {
  max-width: 46ch;
  margin: 20px 0 0;
  color: var(--ink-2);
  font-size: clamp(16px, 1.3vw, 18px);
  line-height: 1.7;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
  color: var(--ink-2);
  font: 500 14px/1.2 var(--font-body);
}
.stack li::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 8px;
  border-radius: 1px;
  background: var(--accent);
  vertical-align: 2px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}
@media (max-width: 860px) {
  .portrait {
    width: 108px;
    height: 108px;
    margin-bottom: 24px;
  }
  .placeholder {
    font-size: 40px;
  }
}
</style>
