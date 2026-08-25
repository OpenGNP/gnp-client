import { useEffect, useState } from 'react'

const PANEL_BREAKPOINT = 1050
const PAGE_HORIZONTAL_PADDING = 112 // px-14 on both sides of the page body
const MAIN_CONTENT_MIN_WIDTH = 700 // matches main content's own min-w-150

function computeWidth() {
  const viewportWidth = window.innerWidth
  if (viewportWidth < PANEL_BREAKPOINT) {
    return null
  }

  const main = document.querySelector('main')
  const mainWidth = main ? main.getBoundingClientRect().width : viewportWidth
  const reserved = Math.max(0, mainWidth - PAGE_HORIZONTAL_PADDING - MAIN_CONTENT_MIN_WIDTH)
  return Math.min(viewportWidth * 0.50, reserved)
}

// Measures actual available space instead of assuming the sidebar's expanded
// width — the sidebar can be collapsed (unmounts entirely) or cross its own
// responsive breakpoints, and `<main>` (flex-1) resizes to match either way.
export function useDetailPanelWidth() {
  const [width, setWidth] = useState(computeWidth)

  useEffect(() => {
    function update() {
      setWidth(computeWidth())
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

  return width
}
