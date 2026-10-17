import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' lets the build run from any static host or sub-path.
export default defineConfig({ base: './', plugins: [vue()] })
