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
      <!-- the film of this portfolio: a third, quieter action, styled like the site's other text links -->
      <a v-if="profile.film" class="film" :href="profile.film.href" target="_blank" rel="noopener">
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3 1.8v8.4L10.2 6z" fill="currentColor" /></svg>
        <span class="film-label">{{ profile.film.label }}</span><span class="sr-only">: a 1-minute video on YouTube (opens in a new tab)</span>
      </a>
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
  width: 160px;
  height: 160px;
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
  font: 700 60px/1 var(--font-head);
}
.name {
  color: var(--ink);
  /* sized so the full three-word name stays on one line in the hero column at every width */
  font: 700 clamp(40px, 4.9vw, 68px) / 1.05 var(--font-head);
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
/* The third action: no button chrome, the same quiet underline as the site's other text links. */
.film {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px; /* tap height; no side padding, so it fits beside the buttons at 1280 */
  color: var(--ink-2);
  font: 500 15px/1 var(--font-body);
  text-decoration: none;
  transition:
    color 0.2s ease,
    transform 0.16s cubic-bezier(0.23, 1, 0.32, 1);
}
.film svg {
  flex: none;
  color: var(--accent);
}
.film-label {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--ink-3) 45%, transparent);
  text-underline-offset: 5px;
  transition: text-decoration-color 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .film:hover {
    color: var(--ink);
  }
  .film:hover .film-label {
    text-decoration-color: var(--accent);
  }
}
.film:focus-visible {
  color: var(--ink);
}
.film:active {
  transform: scale(0.97);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 36px;
}
@media (max-width: 860px) {
  /* five stack items fit one line on a 390px phone with a slightly tighter gap */
  .stack {
    column-gap: 16px;
  }
  .portrait {
    width: 124px;
    height: 124px;
    margin-bottom: 24px;
  }
  .placeholder {
    font-size: 46px;
  }
}
</style>
