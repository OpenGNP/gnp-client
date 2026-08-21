import { Home, Menu, Save, Send, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

export type CreateFormNavbarProps = {
  isSettingsOpen: boolean
  showSidebarToggle?: boolean
  onGoHome: () => void
  onToggleSettings: () => void
  onToggleSidebar?: () => void
}

const iconButtonClass =
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none'

function FormActionButton({
  children,
  className,
  icon,
}: {
  children: string
  className: string
  icon: ReactNode
}) {
  return (
    <button
      className={cn(
        'inline-flex h-9.5 cursor-pointer items-center justify-center gap-2 rounded-[5px] border-0 px-3.5 text-[16px] font-bold tracking-[0.16px] text-white transition-transform active:translate-y-px max-[560px]:size-9.5 max-[560px]:px-0',
        className,
      )}
      type="button"
    >
      {icon}
      <span className="max-[560px]:sr-only">{children}</span>
    </button>
  )
}

export function CreateFormNavbar({
  isSettingsOpen,
  showSidebarToggle = false,
  onGoHome,
  onToggleSettings,
  onToggleSidebar,
}: CreateFormNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[63px] items-center justify-between gap-4 border-2 border-l-0 border-[#e8eaf1] bg-white px-10 text-black max-[900px]:border-l-2 max-[720px]:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {showSidebarToggle ? (
          <button
            className={iconButtonClass}
            aria-label="Expand sidebar"
            onClick={onToggleSidebar}
            type="button"
          >
            <Menu size={24} strokeWidth={2.4} />
          </button>
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

      <div className="flex shrink-0 items-center gap-2.5">
        <FormActionButton
          className="bg-[#4b4ebb] hover:bg-[#4143a9]"
          icon={<Send size={18} strokeWidth={2.4} />}
        >
          Publish
        </FormActionButton>
        <FormActionButton
          className="bg-[#1e55c5] hover:bg-[#1a49aa]"
          icon={<Save size={18} strokeWidth={2.4} />}
        >
          Save draft
        </FormActionButton>
        <button
          className={cn(
            iconButtonClass,
            'size-9.5 rounded-[5px]',
            isSettingsOpen && 'bg-[#f0f4ff] text-[#1e55c5]',
          )}
          aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
          aria-pressed={isSettingsOpen}
          onClick={onToggleSettings}
          type="button"
        >
          <Settings size={24} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  )
}
