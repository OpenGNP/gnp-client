import { Move, Sparkles, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Switch } from 'radix-ui'

import { cn } from '../../lib/utils'

export function QuestionCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[5px] bg-white px-5.5 pt-10 pb-5 shadow-[0_2px_4.1px_rgba(0,0,0,0.11)] max-[560px]:px-4 max-[560px]:pt-6">
      {children}
    </div>
  )
}

export function QuestionTitleField({
  value,
  onChange,
  onDelete,
  placeholder = 'Question',
}: {
  value: string
  onChange: (value: string) => void
  onDelete: () => void
  placeholder?: string
}) {
  return (
    <div className="flex w-full items-center gap-2.5">
      <input
        className="h-9 min-w-0 flex-1 rounded-[5px] border border-[#d2d8e5] bg-white px-[15px] text-[16px] text-black tracking-[0.16px] outline-none placeholder:text-[#bdbdbd] focus:border-[#1e55c5]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      <button
        className="inline-flex h-6.5 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-0 bg-[#fcf3f6] text-[#e0507a] hover:bg-[#f8dde6] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
        aria-label="Delete question"
        onClick={onDelete}
        type="button"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export function LabeledToggle({
  icon,
  label,
  chipClassName,
  checked,
  onCheckedChange,
  className,
}: {
  icon: ReactNode
  label: string
  chipClassName: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-[45px] items-center justify-center gap-[15px] rounded-[5px] border border-[#d2d8e5] bg-[#f7f8fb] px-4',
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-6.5 w-7 shrink-0 items-center justify-center rounded-[4px]',
            chipClassName,
          )}
        >
          {icon}
        </span>
        <span className="text-[16px] tracking-[0.16px] whitespace-nowrap text-black">
          {label}
        </span>
      </span>
      <Switch.Root
        checked={checked}
        className="relative inline-flex h-[17.5px] w-[35px] shrink-0 cursor-pointer items-center rounded-full bg-[#d2d8e5] outline-none transition-colors data-[state=checked]:bg-[#1e55c5]"
        onCheckedChange={onCheckedChange}
      >
        <Switch.Thumb className="block size-[13.5px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[19px]" />
      </Switch.Root>
    </div>
  )
}

export function QuestionCardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[69px] w-full flex-wrap items-center justify-end gap-4 rounded-[10px] bg-[#f5f9ff] px-5">
      {children}
    </div>
  )
}

export function MoveHandle({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center text-[#b0b1b3]', className)}
      aria-hidden="true"
    >
      <Move size={20} />
    </div>
  )
}

export function AiAnalyzeButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent text-[16px] tracking-[0.16px] text-[#3f4045] hover:text-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
      onClick={onClick}
      type="button"
    >
      <span className="flex h-6.5 w-7 items-center justify-center rounded-[4px] bg-[#e8eeff] text-[#1e55c5]">
        <Sparkles size={15} />
      </span>
      AI Analyze
    </button>
  )
}
