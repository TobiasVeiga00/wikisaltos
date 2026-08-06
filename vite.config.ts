import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command }) => ({
  // En GitHub Pages el sitio cuelga de /wikisaltos/, no de la raíz. Sin esto el
  // HTML pide los assets en /assets/... y la página carga en blanco. Solo aplica
  // al build: en desarrollo sigue sirviéndose desde la raíz.
  base: command === 'build' ? '/wikisaltos/' : '/',
  plugins: [react()],
  test: {
    // Node por defecto; los pocos archivos que necesitan un DOM lo piden con un
    // docblock `@vitest-environment jsdom`, así el resto sigue siendo rápido.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}))
