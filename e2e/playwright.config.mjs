// Browser journeys (CLI-E, CLI-N). Needs the server and client running against the test
// database — see e2e/README.md.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.mjs/,
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5174', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Cross-browser: the respondent journey only (tests tagged @xb).
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grep: /@xb/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grep: /@xb/ },
  ],
})
