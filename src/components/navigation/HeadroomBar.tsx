import type { ReactNode } from 'react'

import { HEADROOM_BAR_HEIGHT, useHeadroomHidden, useScrolledPastBar } from '../../hooks/useHeadroom'
import { cn } from '../../lib/utils'

/**
 * Sticks to the top, and while scrolling down slides up by the Edit form | Dashboard
 * bar's height (its first child) — anything under it, like the editor's Save / Publish
 * row, stays in view. Back on any scroll up.
 */
export function HeadroomBar({ children }: { children: ReactNode }) {
  const hidden = useHeadroomHidden()
  // Floating over the page: frosted, so what scrolls under it shows through but blurred.
  const floating = useScrolledPastBar()
  return (
    <div
      className={cn(
        'sticky z-30 transition-[top,background-color] duration-200 ease-out motion-reduce:transition-none',
        floating ? 'bg-[#f5f9ff]/70 backdrop-blur-md' : 'bg-[#f5f9ff]',
      )}
      style={{ top: hidden ? -HEADROOM_BAR_HEIGHT : 0 }}
    >
      {children}
    </div>
  )
}
