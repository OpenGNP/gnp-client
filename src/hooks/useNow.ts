import { useEffect, useState } from 'react'

/**
 * Current time as a timestamp, seeded once and refreshed on an interval — so a
 * derived "opens/closes at" state can flip on its own without a reload, while
 * staying stable within a single render (unlike a bare `Date.now()` call).
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
