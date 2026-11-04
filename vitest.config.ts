import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./qa-testing/setup.ts"],
    globals: true,
    // e2e/ holds the Playwright browser journeys (bun run test:e2e), not Vitest tests.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
})
