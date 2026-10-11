import { useState } from 'react'

const STORAGE_KEY = 'gnp.dashboard.hideNames'

/**
 * "Hide names" on the dashboard — for presenting or screen-sharing. Remembered in this
 * browser (every form), so a reload mid-meeting doesn't bring the names back.
 */
export function useHideNames() {
  const [hideNames, setHideNames] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const toggleHideNames = () => {
    const next = !hideNames
    setHideNames(next)
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, '1')
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage blocked: the toggle still works for this visit.
    }
  }

  return { hideNames, toggleHideNames }
}
