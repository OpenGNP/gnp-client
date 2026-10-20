import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'
import { SidebarToggleButton } from './SidebarToggleButton'

export type TopBarProps = {
  /** A page title, or tabs. Only tabs get an underline and hover: anything clickable must look it. */
  children: ReactNode
  /** Right-hand side, e.g. Share. */
  actions?: ReactNode
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  /** Positioning, which differs per page (sticky title vs. tabs that scroll away). */
  className?: string
}

/** The 50px bar above every page's content: Home / My forms / Shared titles and a form's Edit | Dashboard tabs. */
export function TopBar({ children, actions, showSidebarToggle = false, onToggleSidebar, className }: TopBarProps) {
  return (
    <div
      className={cn(
        "flex h-12.5 items-center gap-3 border-2 border-l-0 border-[#e8eaf1] bg-white px-10 font-['Inter_Variable'] text-[16px] tracking-[0.16px] text-black max-[900px]:border-l-2 max-[560px]:px-4",
        className,
      )}
    >
      {showSidebarToggle ? <SidebarToggleButton onToggleSidebar={onToggleSidebar} /> : null}
      {children}
      {actions ? <div className="ml-auto flex min-w-0 items-center">{actions}</div> : null}
    </div>
  )
}
