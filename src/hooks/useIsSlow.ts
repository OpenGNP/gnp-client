import { useEffect, useState } from 'react'

/** True once `active` has stayed on for `ms` — e.g. a save that's taking unusually long. */
export function useIsSlow(active: boolean, ms = 15_000): boolean {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setSlow(true), ms)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [active, ms])

  return active && slow
}
