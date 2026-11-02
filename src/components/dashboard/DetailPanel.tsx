import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import type { DetailPanelLayout } from '../../hooks/useDetailPanelLayout'
import { HEADROOM_BAR_HEIGHT, useHeadroomHidden } from '../../hooks/useHeadroom'
import { cn } from '../../lib/utils'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/** The dashboard's right-side panel: slides in, docked beside the content or as a drawer over it. */
export function DetailPanel({
  layout,
  onClose,
  label,
  hidden = false,
  children,
}: {
  layout: DetailPanelLayout
  onClose: () => void
  /** Accessible name, e.g. the topic's name. */
  label: string
  /** Out of sight but still mounted, so its state and scroll position survive. */
  hidden?: boolean
  children: ReactNode
}) {
  const [isVisible, setIsVisible] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  // Starts right under the Edit form | Dashboard bar, and moves up with it when it hides.
  const topOffset = useHeadroomHidden() ? 0 : HEADROOM_BAR_HEIGHT

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

  // Focus moves in on open and back to whatever opened it (the topic row) on close.
  useEffect(() => {
    const panel = panelRef.current
    const opener = document.activeElement as HTMLElement | null
    panel?.focus({ preventScroll: true })
    return () => {
      // Not when focus already moved on (e.g. another topic row was clicked).
      const focusLeft = !document.activeElement || document.activeElement === document.body || panel?.contains(document.activeElement)
      if (focusLeft && opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  const isOverlay = layout.mode === 'overlay'

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // Escape inside a menu or popover (portalled, but still bubbles here) closes that, not the panel.
    const target = event.target as HTMLElement
    if (event.key === 'Escape' && !target.closest('[data-radix-popper-content-wrapper], [role="dialog"]:not(aside)')) {
      event.stopPropagation()
      onClose()
      return
    }
    // As a drawer it's modal: Tab cycles inside it.
    if (event.key !== 'Tab' || !isOverlay || !panelRef.current) return
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

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
        aria-label={label}
        aria-modal={isOverlay || undefined}
        className={cn(
          'fixed right-0 bottom-0 z-50 flex max-w-full flex-col gap-5 overflow-y-auto border-l border-[#e9eaed] bg-white p-10 outline-none transition-[translate,opacity,top] duration-300 ease-out max-[560px]:p-5',
          isOverlay && 'shadow-[-16px_0_40px_rgba(15,23,42,0.14)]',
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0',
          // visibility (not display) keeps the scroll position and takes it out of the tab order.
          hidden && 'invisible',
        )}
        onKeyDown={handleKeyDown}
        ref={panelRef}
        role={isOverlay ? 'dialog' : 'region'}
        style={{ top: topOffset, width: layout.width }}
        tabIndex={-1}
      >
        {children}
      </aside>
    </>
  )
}
