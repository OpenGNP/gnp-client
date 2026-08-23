import { Home } from 'lucide-react'

import { FormActionBar } from './FormActionBar'
import { SidebarToggleButton } from './SidebarToggleButton'

export type CreateFormNavbarProps = {
  isSettingsOpen: boolean
  showSidebarToggle?: boolean
  onGoHome: () => void
  onToggleSettings: () => void
  onToggleSidebar?: () => void
}

const iconButtonClass =
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none'

export function CreateFormNavbar({
  isSettingsOpen,
  showSidebarToggle = false,
  onGoHome,
  onToggleSettings,
  onToggleSidebar,
}: CreateFormNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[63px] items-center justify-between gap-4 border-2 border-l-0 border-[#e8eaf1] bg-white px-10 font-['Inter_Variable'] text-black max-[900px]:border-l-2 max-[720px]:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {showSidebarToggle ? (
          <SidebarToggleButton onToggleSidebar={onToggleSidebar} />
        ) : null}
        <button
          className={iconButtonClass}
          aria-label="Go home"
          onClick={onGoHome}
          type="button"
        >
          <Home size={24} strokeWidth={2.2} />
        </button>
        <span className="min-w-0 truncate text-[16px] font-normal tracking-[0.16px]">
          Untitled form
        </span>
      </div>

      <FormActionBar isSettingsOpen={isSettingsOpen} onToggleSettings={onToggleSettings} />
    </header>
  )
}
