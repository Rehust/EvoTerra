import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Simulation tests are pure TypeScript; no browser environment is needed.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
