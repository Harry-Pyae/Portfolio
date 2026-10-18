<script setup>
import { sound, toggleSound, toggleMute, playSound } from '../audio.js'

// The same soundtrack controls in the navbar and in the project scene.
</script>

<template>
  <div v-if="sound.state !== 'idle' && sound.state !== 'unavailable'" class="sound" role="group" aria-label="Soundtrack">
    <!-- Autoplay was refused: one discreet control, never retried on our own. -->
    <button v-if="sound.state === 'blocked'" type="button" class="enable" aria-label="Enable music" @click="playSound">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <path d="M7 14.5V5l9-2v9.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round" />
        <circle cx="5" cy="14.5" r="2" fill="currentColor" />
        <circle cx="14" cy="12.5" r="2" fill="currentColor" />
      </svg>
      <span class="label">Enable Music</span>
    </button>
    <template v-else>
      <button
        type="button"
        class="toggle"
        :class="{ on: sound.state === 'playing' && !sound.muted }"
        :aria-pressed="sound.state === 'playing'"
        :aria-label="sound.state === 'playing' ? 'Pause soundtrack' : 'Play soundtrack'"
        :title="sound.state === 'playing' ? 'Pause soundtrack' : 'Play soundtrack'"
        @click="toggleSound"
      >
        <!-- Level bars move only while music is audible (and pause with the motion control). -->
        <span v-if="sound.state === 'playing'" class="bars" aria-hidden="true"><i class="anim"></i><i class="anim"></i><i class="anim"></i></span>
        <svg v-else viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor" /></svg>
        <span class="label" aria-hidden="true">{{ sound.state === 'playing' ? 'Music' : 'Music off' }}</span>
      </button>
      <button
        type="button"
        class="mute"
        :aria-pressed="sound.muted"
        :aria-label="sound.muted ? 'Unmute soundtrack' : 'Mute soundtrack'"
        :title="sound.muted ? 'Unmute soundtrack' : 'Mute soundtrack'"
        @click="toggleMute"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
          <path v-if="sound.muted" d="M13 7.5l5 5M18 7.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <path v-else d="M13.2 7a4 4 0 010 6M15.4 5a7 7 0 010 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
        </svg>
        <span class="label" aria-hidden="true">{{ sound.muted ? 'Unmute' : 'Mute' }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.sound {
  display: flex;
  gap: 6px;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 44px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-ctl);
  background: color-mix(in srgb, var(--bg) 55%, var(--surface));
  color: var(--ink-2);
  font: 500 13.5px/1 var(--font-body);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.25s var(--ease),
    border-color 0.25s var(--ease);
}
button:hover {
  color: var(--ink);
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.enable {
  /* the primary-button language: dark tinted fill, amber edge, no bright block */
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  color: var(--accent);
}
/* playing: amber level bars; muted: amber edge on the mute control */
.toggle.on {
  color: var(--accent);
}
.mute[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
  color: var(--accent);
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
.toggle:not(.on) .bars i {
  animation: none;
  transform: scaleY(0.35);
}
@keyframes level {
  from {
    transform: scaleY(0.3);
  }
  to {
    transform: scaleY(1);
  }
}
@media (max-width: 1100px) {
  .label {
    display: none;
  }
}
@media (max-width: 600px) {
  button {
    width: 44px;
    padding: 0;
  }
}
</style>
