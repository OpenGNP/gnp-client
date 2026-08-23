import { Save, Send, Settings, SlidersHorizontal } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { forwardRef, useState } from 'react'
import { Popover } from 'radix-ui'

import { cn } from '../../lib/utils'
import { PublishModal } from './PublishModal'

export type FormActionBarProps = {
  isSettingsOpen: boolean
  onToggleSettings: () => void
  defaultPublished?: boolean
}

const iconButtonClass =
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none'

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
}: FormActionBarProps) {
  const [isPublished, setIsPublished] = useState(defaultPublished)

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Popover.Root>
        <Popover.Trigger asChild>
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
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="end" className="z-40" sideOffset={8} side="bottom">
            <PublishModal
              isPublished={isPublished}
              onPublish={() => setIsPublished(true)}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
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
  )
}
