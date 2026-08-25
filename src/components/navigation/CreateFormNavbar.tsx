import { Home } from 'lucide-react'

import type { FormAccessSettings } from '../../hooks/useFormAccessSettings'
import { Button } from '../ui/button'
import { FormActionBar } from './FormActionBar'
import { SidebarToggleButton } from './SidebarToggleButton'

export type CreateFormNavbarProps = {
  isSettingsOpen: boolean
  showSidebarToggle?: boolean
  onGoHome: () => void
  onSaveDraft?: () => void
  onToggleSettings: () => void
  onToggleSidebar?: () => void
  formAccessSettings: FormAccessSettings
  onUpdateFormAccessSettings: (partial: Partial<FormAccessSettings>) => void
}

export function CreateFormNavbar({
  isSettingsOpen,
  showSidebarToggle = false,
  onGoHome,
  onSaveDraft,
  onToggleSettings,
  onToggleSidebar,
  formAccessSettings,
  onUpdateFormAccessSettings,
}: CreateFormNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[63px] items-center justify-between gap-4 border-2 border-l-0 border-[#e8eaf1] bg-white px-10 font-['Inter_Variable'] text-black max-[900px]:border-l-2 max-[720px]:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {showSidebarToggle ? (
          <SidebarToggleButton onToggleSidebar={onToggleSidebar} />
        ) : null}
        <Button
          className="size-9 text-[#3f4045]"
          aria-label="Go home"
          onClick={onGoHome}
          size="icon"
          variant="ghost"
        >
          <Home className="size-6" strokeWidth={2.2} />
        </Button>
        <span className="min-w-0 truncate text-[16px] font-normal tracking-[0.16px]">
          Untitled form
        </span>
      </div>

      <FormActionBar
        formAccessSettings={formAccessSettings}
        isSettingsOpen={isSettingsOpen}
        onSaveDraft={onSaveDraft}
        onToggleSettings={onToggleSettings}
        onUpdateFormAccessSettings={onUpdateFormAccessSettings}
      />
    </header>
  )
}
