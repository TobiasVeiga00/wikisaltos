import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // Node by default; the few files that need a DOM ask for one with a
    // `@vitest-environment jsdom` docblock, so the rest stay fast.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
