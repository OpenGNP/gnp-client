import "@testing-library/jest-dom/vitest"

// jsdom has no matchMedia; report "no match" for every query.
window.matchMedia ??= (query: string) =>
  ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
