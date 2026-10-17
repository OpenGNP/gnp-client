import { useEffect, useState, type ReactNode } from 'react'

import type { DetailPanelLayout } from '../../hooks/useDetailPanelLayout'
import { cn } from '../../lib/utils'

// Matches FormDetailTabs' h-12.5 (50px) — the panel starts right below it and
// closes that gap as FormDetailTabs scrolls out of view, instead of overlapping it.
const NAV_HEIGHT = 50

function getTopOffset() {
  return Math.max(0, NAV_HEIGHT - window.scrollY)
}

/** The dashboard's right-side panel: slides in, docked beside the content or as a drawer over it. */
export function DetailPanel({
  layout,
  onClose,
  hidden = false,
  children,
}: {
  layout: DetailPanelLayout
  onClose: () => void
  /** Out of sight but still mounted, so its state and scroll position survive. */
  hidden?: boolean
  children: ReactNode
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [topOffset, setTopOffset] = useState(getTopOffset)

  useEffect(() => {
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setIsVisible(true))
    })
    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [])

  useEffect(() => {
    let frame = 0
    const handleScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setTopOffset(getTopOffset()))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const isOverlay = layout.mode === 'overlay'

  return (
    <>
      {/* As a drawer the content behind stays full width — dim it, and a tap outside
          closes the panel (the usual drawer behaviour on tablets and phones). */}
      {isOverlay && !hidden ? (
        <div
          aria-hidden="true"
          className={cn(
            'fixed inset-0 z-40 bg-[#0f172a]/20 transition-opacity duration-300',
            isVisible ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onClose}
        />
      ) : null}
      <aside
        aria-hidden={hidden || undefined}
        className={cn(
          'fixed right-0 bottom-0 z-50 flex max-w-full flex-col gap-5 overflow-y-auto border-l border-[#e9eaed] bg-white p-10 transition-[translate,opacity] duration-300 ease-out max-[560px]:p-5',
          isOverlay && 'shadow-[-16px_0_40px_rgba(15,23,42,0.14)]',
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0',
          // visibility (not display) keeps the scroll position and takes it out of the tab order.
          hidden && 'invisible',
        )}
        style={{ top: topOffset, width: layout.width }}
      >
        {children}
      </aside>
    </>
  )
}
