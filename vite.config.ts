import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Node by default: shared/ and api/ have no DOM and should not pay for one.
    // Component tests opt in per file with a `@vitest-environment jsdom` pragma.
    environment: 'node',
    include: ['shared/**/*.test.ts', 'api/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
