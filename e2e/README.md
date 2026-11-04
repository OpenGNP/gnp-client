# Browser journeys (CLI-E, CLI-N)

The real client and server against the disposable test database, driven by Playwright,
with an axe accessibility scan. Not part of `bun run test`: it needs both apps running.

```
# gnp-server (sibling checkout)
bun run test:db:up && bun run test:db:setup
NODE_ENV=test PORT=3100 CLIENT_URL=http://localhost:5174 bun src/index.ts

# gnp-client
VITE_API_URL=http://localhost:3100/api bunx vite --port 5174 --strictPort
bunx playwright install chromium firefox webkit   # once
bun run test:e2e
```

`GNP_SERVER_DIR` points at the gnp-server checkout (default `../gnp-server`); each run reseeds
the test database through `gnp-server/qa-testing/e2e-seed.ts`.
