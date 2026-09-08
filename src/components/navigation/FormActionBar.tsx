import {
  CloudCheck,
  CloudOff,
  FolderInput,
  RefreshCw,
  Save,
  Send,
  Settings,
  SlidersHorizontal,
} from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { forwardRef, useState } from 'react'

import type { FormAccessSettings } from '../../hooks/useFormAccessSettings'
import { useNow } from '../../hooks/useNow'
import { cn } from '../../lib/utils'
import { deriveResponseState, describeResponseState } from '../../lib/responseWindow'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { PublishModal } from './PublishModal'
import { ResponseStateChip } from './ResponseStateChip'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type FormActionBarProps = {
  isSettingsOpen: boolean
  onToggleSettings: () => void
  defaultPublished?: boolean
  mode?: 'create' | 'edit'
  onSaveDraft?: () => void
  onPublish?: () => void | Promise<void>
  onMove?: () => void
  saveStatus?: SaveStatus
  formAccessSettings: FormAccessSettings
  onUpdateFormAccessSettings: (partial: Partial<FormAccessSettings>) => void
  /**
   * Access settings as last saved — drives the status chip (and the PublishModal's
   * readouts / "unsaved" reminder) so nothing looks changed before the user saves.
   * Falls back to the live settings when omitted (create mode, no chip anyway).
   */
  savedAccessSettings?: FormAccessSettings
  /** Respondent-facing URL, threaded to the PublishModal's "share this link" section. */
  shareUrl?: string
  /** Opens the Settings panel to the "Response window" section. */
  onEditSchedule?: () => void
}

export const FormActionButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'> & { icon: ReactNode }
>(function FormActionButton({ children, className, icon, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex h-9.5 cursor-pointer items-center justify-center gap-2 rounded-[5px] border-0 px-3.5 text-[16px] font-bold tracking-[0.16px] text-white transition-transform active:translate-y-px max-[560px]:size-9.5 max-[560px]:px-0',
        className,
      )}
      type="button"
      {...props}
    >
      {icon}
      <span className="max-[560px]:sr-only">{children}</span>
    </button>
  )
})

export function FormActionBar({
  isSettingsOpen,
  onToggleSettings,
  defaultPublished = false,
  mode = 'create',
  onSaveDraft,
  onPublish,
  onMove,
  saveStatus = 'idle',
  formAccessSettings,
  onUpdateFormAccessSettings,
  savedAccessSettings,
  shareUrl,
  onEditSchedule,
}: FormActionBarProps) {
  const [isPublished, setIsPublished] = useState(defaultPublished)
  const now = useNow()

  const savedWindow = savedAccessSettings ?? formAccessSettings
  const responseWindow = {
    isPublished,
    acceptingResponses: savedWindow.acceptingResponses,
    startDate: savedWindow.startDate,
    endDate: savedWindow.endDate,
  }
  const responseBadge = describeResponseState(deriveResponseState(responseWindow, now), responseWindow)

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      {mode === 'edit' ? (
        <ResponseStateChip badge={responseBadge} className="max-[760px]:hidden" iconOnly />
      ) : null}

      {mode === 'edit' && saveStatus !== 'idle' ? (
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium tracking-[0.13px] max-[560px]:hidden',
            saveStatus === 'error' ? 'text-[#e0507a]' : 'text-[#726f6f]',
          )}
        >
          {saveStatus === 'saving' ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : saveStatus === 'error' ? (
            <CloudOff size={16} />
          ) : (
            <CloudCheck size={16} />
          )}
          {saveStatus === 'saving'
            ? 'Saving…'
            : saveStatus === 'error'
              ? 'Save failed'
              : 'Saved'}
        </span>
      ) : null}

      <Popover>
        <PopoverTrigger asChild>
          <FormActionButton
            className={
              isPublished
                ? 'border border-[#4b4ebb] bg-white text-[#4b4ebb] hover:bg-[#f5f5ff]'
                : 'bg-[#4b4ebb] hover:bg-[#4143a9]'
            }
            icon={
              isPublished ? (
                <SlidersHorizontal size={16} strokeWidth={2.4} />
              ) : (
                <Send size={18} strokeWidth={2.4} />
              )
            }
          >
            {isPublished ? 'Published' : 'Publish'}
          </FormActionButton>
        </PopoverTrigger>
        <PopoverContent align="end" className="z-40" sideOffset={8} side="bottom">
          <PublishModal
            isPublished={isPublished}
            savedAccessSettings={savedAccessSettings}
            onPublish={() => {
              // In edit mode `onPublish` saves immediately, so reflect that right away.
              // In create mode it just opens the destination picker — nothing is
              // published yet, so flipping this now would lie if the user cancels it.
              if (mode === 'edit') {
                setIsPublished(true)
              }
              void onPublish?.()
            }}
            onEditSchedule={onEditSchedule}
            onUpdateSettings={onUpdateFormAccessSettings}
            settings={formAccessSettings}
            shareUrl={shareUrl}
          />
        </PopoverContent>
      </Popover>

      <FormActionButton
        className="bg-[#1e55c5] hover:bg-[#1a49aa]"
        icon={<Save size={18} strokeWidth={2.4} />}
        onClick={onSaveDraft}
      >
        {mode === 'edit' ? 'Save' : 'Save draft'}
      </FormActionButton>

      {mode === 'edit' ? (
        <FormActionButton
          className="border border-[#d2d8e5] bg-white text-[#3f4045] hover:bg-[#f7f8fb]"
          icon={<FolderInput size={18} strokeWidth={2.2} />}
          onClick={onMove}
        >
          Move
        </FormActionButton>
      ) : null}

      <Button
        className={cn(
          'size-9.5 rounded-[5px] text-[#3f4045]',
          isSettingsOpen && 'bg-[#f0f4ff] text-[#1e55c5]',
        )}
        aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
        aria-pressed={isSettingsOpen}
        onClick={onToggleSettings}
        size="icon"
        variant="ghost"
      >
        <Settings className="size-6" strokeWidth={2.2} />
      </Button>
    </div>
  )
}
