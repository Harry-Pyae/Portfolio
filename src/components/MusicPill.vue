<script setup>
import { computed } from 'vue'
import { sound, toggleSound } from '../audio.js'

// The music control: one round button that turns the theme on and off, floating in the bottom-right
// corner, or `inline` in a toolbar (where a floating one would cover text). Level bars while it plays,
// a note when it's off.
defineProps({ inline: { type: Boolean, default: false } })
const on = computed(() => sound.state === 'playing')
</script>

<template>
  <button
    v-if="sound.state !== 'idle' && sound.state !== 'unavailable'"
    type="button"
    class="music"
    :class="{ on, inline }"
    :aria-pressed="on"
    aria-label="Theme music"
    :title="on ? 'Turn music off' : 'Turn music on'"
    data-sound-switch
    @click="toggleSound"
  >
    <!-- the bars pause with the motion control -->
    <span v-if="on" class="bars" aria-hidden="true"><i class="anim"></i><i class="anim"></i><i class="anim"></i></span>
    <svg v-else viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <path d="M7 14.5V5l9-2v9.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round" />
      <circle cx="5" cy="14.5" r="2" fill="currentColor" />
      <circle cx="14" cy="12.5" r="2" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped>
.music {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right));
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 60;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: 0 12px 32px -14px rgba(0, 0, 0, 0.9);
  color: var(--ink-2);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.16s cubic-bezier(0.23, 1, 0.32, 1);
}
.music.inline {
  position: static;
  width: 40px;
  height: 40px;
  box-shadow: none;
}
.music.on {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line-strong));
  color: var(--accent);
}
.music:active {
  transform: scale(0.94);
}
@media (hover: hover) and (pointer: fine) {
  .music:hover {
    color: var(--ink);
  }
  .music.on:hover {
    color: var(--accent-hover);
  }
}
/* the page's button steps aside while the project scene shows its own above the dialog */
:global(html.inspecting) .in-page {
  visibility: hidden;
}
.bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  width: 14px;
  height: 14px;
}
.bars i {
  flex: 1;
  height: 100%;
  border-radius: 1px;
  background: currentColor;
  transform-origin: bottom;
  animation: level 1.1s ease-in-out infinite alternate;
}
.bars i:nth-child(2) {
  animation-delay: -0.4s;
}
.bars i:nth-child(3) {
  animation-delay: -0.8s;
}
@keyframes level {
  from {
    transform: scaleY(0.3);
  }
  to {
    transform: scaleY(1);
  }
}
</style>
