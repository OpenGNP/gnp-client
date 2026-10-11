import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './api'

/**
 * One app-wide React Query client. Every GET goes through it, so identical
 * concurrent requests share one fetch (incl. StrictMode's dev double-mount) and
 * results are cached by query key (see src/api/queries.ts).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cached data is served instantly; after this it's refetched in the
      // background the next time a page mounts it.
      staleTime: 30_000,
      // Off: a background refetch re-seeds the sidebar tree / editor state, which
      // shouldn't happen just because the tab regained focus.
      refetchOnWindowFocus: false,
      // 4xx (not found, no access, bad input) won't fix itself — fail fast.
      // Network / 5xx get one retry.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 1,
    },
  },
})
