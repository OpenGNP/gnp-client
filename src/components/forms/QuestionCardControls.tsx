import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { GripHorizontal, Sparkles, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { QUESTION_USE } from './question-types'

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
  number,
  placeholder = 'Question',
}: {
  number: number
  value: string
  onChange: (value: string) => void
  onDelete: () => void
  placeholder?: string
}) {
  return (
    <div className="flex w-full items-center gap-2.5">
      <span className="shrink-0 text-[14px] font-medium text-[#726f6f]">Q{number}</span>
      <input
        className="h-9 min-w-0 flex-1 rounded-[5px] border border-[#d2d8e5] bg-white px-[15px] text-[16px] text-black tracking-[0.16px] outline-none placeholder:text-[#bdbdbd] focus:border-[#1e55c5]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      <Button
        className="h-6.5 w-7 shrink-0 rounded-[4px] bg-[#fcf3f6] text-[#e0507a] hover:bg-[#f8dde6]"
        aria-label="Delete question"
        onClick={onDelete}
        variant="destructive"
      >
        <Trash2 size={16} />
      </Button>
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
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

/** Two named choices side by side, for settings where "off" isn't obvious (short vs long). */
export function SegmentedToggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div
      className="flex h-[45px] items-center gap-1 rounded-[5px] border border-[#d2d8e5] bg-[#f7f8fb] p-1"
      aria-label={label}
      role="radiogroup"
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={cn(
            'h-full cursor-pointer rounded-[4px] border-0 px-3.5 text-[15px] tracking-[0.15px] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none',
            option.value === value
              ? 'bg-white text-[#1e55c5] shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
              : 'bg-transparent text-[#3f4045] hover:text-black',
          )}
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
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

export function MoveHandle({
  className,
  attributes,
  listeners,
}: {
  className?: string
  attributes?: DraggableAttributes
  listeners?: DraggableSyntheticListeners
}) {
  return (
    <button
      className={cn(
        'flex touch-none items-center justify-center rounded-md text-[#b0b1b3] hover:text-[#7b7d86] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none',
        listeners ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        className,
      )}
      aria-label="Drag to reorder question"
      type="button"
      {...attributes}
      {...listeners}
    >
      <GripHorizontal size={20} />
    </button>
  )
}

export function QuestionUseLabel({
  className,
  type,
  analysed,
}: {
  className?: string
  type: 'text' | 'choice'
  /** In the AI-analysed (feedback) section. */
  analysed: boolean
}) {
  const ai = analysed && type === 'text'
  const copy = QUESTION_USE[analysed ? 'feedback' : 'demographic'][type]
  if (!copy) return null
  const [long, short] = copy
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.14px] whitespace-nowrap',
        ai ? 'text-[#1e55c5]' : 'text-[#726f6f]',
        className,
      )}
    >
      {ai ? <Sparkles size={16} /> : null}
      {/* Short copy on phones, where the long one would wrap. */}
      <span className="max-[560px]:hidden">{long}</span>
      <span className="hidden max-[560px]:inline">{short}</span>
    </span>
  )
}
