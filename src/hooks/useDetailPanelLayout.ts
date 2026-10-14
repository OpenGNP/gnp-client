import { useEffect, useState } from 'react'

const PAGE_HORIZONTAL_PADDING = 80 // the dashboard body's px-10, both sides
const MAIN_CONTENT_MIN_WIDTH = 600 // matches the main content's own min-w-150
// Narrower than this the panel's text wraps every few words — overlay instead.
const PANEL_MIN_WIDTH = 420
const OVERLAY_MAX_WIDTH = 560

/**
 * How the topic detail panel sits next to the dashboard:
 * - `docked`: beside the content, which makes room for it (padding-right = width).
 * - `overlay`: a drawer over the content, which keeps its full width — when docking
 *   would squeeze the panel under PANEL_MIN_WIDTH (phones, tablets with the sidebar
 *   open, any narrow window).
 */
export type DetailPanelLayout = { mode: 'docked' | 'overlay'; width: number }

function computeLayout(): DetailPanelLayout {
  const viewportWidth = window.innerWidth
  const main = document.querySelector('main')
  const mainWidth = main ? main.getBoundingClientRect().width : viewportWidth
  const docked = Math.min(
    viewportWidth * 0.5,
    mainWidth - PAGE_HORIZONTAL_PADDING - MAIN_CONTENT_MIN_WIDTH,
  )
  return docked >= PANEL_MIN_WIDTH
    ? { mode: 'docked', width: docked }
    : { mode: 'overlay', width: Math.min(viewportWidth, OVERLAY_MAX_WIDTH) }
}

// Measures actual available space instead of assuming the sidebar's expanded
// width — the sidebar can be collapsed (unmounts entirely) or cross its own
// responsive breakpoints, and `<main>` (flex-1) resizes to match either way.
// Docking pads the *inside* of <main>, so it never feeds back into this measurement.
export function useDetailPanelLayout() {
  const [layout, setLayout] = useState(computeLayout)

  useEffect(() => {
    function update() {
      setLayout((previous) => {
        const next = computeLayout()
        return next.mode === previous.mode && next.width === previous.width ? previous : next
      })
    }

    update()

    const main = document.querySelector('main')
    const resizeObserver = new ResizeObserver(update)
    if (main) {
      resizeObserver.observe(main)
    }
    window.addEventListener('resize', update)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return layout
}
