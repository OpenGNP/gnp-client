import { X } from 'lucide-react'

import { cn } from '../../lib/utils'

export type ActiveFilterChip = {
  /** Stable key for React. */
  id: string
  /** Muted prefix — the demographic question, e.g. "Faculty". */
  group: string
  /** The chosen answer, e.g. "SIT". */
  value: string
  onRemove: () => void
}

/**
 * The applied demographic filters as removable chips, on their own line just under
 * the filter row — plain chips, no box. The date range isn't repeated here: its own
 * button already shows the range and has a reset ✕. Renders nothing when no chip
 * applies.
 */
export function ActiveFilterBar({
  chips,
  onClearAll,
  className,
}: {
  chips: ActiveFilterChip[]
  onClearAll: () => void
  className?: string
}) {
  if (chips.length === 0) return null

  return (
    <div
      aria-label="Active filters"
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="region"
    >
      {chips.map((chip) => (
        <span
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#c7d6f7] bg-white py-0.5 pr-1 pl-2.5 text-[12px] text-[#14181f]"
          key={chip.id}
        >
          <span className="text-[#6e7180]">{chip.group}:</span>
          <span className="truncate font-semibold">{chip.value}</span>
          <button
            aria-label={`Remove ${chip.group}: ${chip.value}`}
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#6e7180] transition-colors hover:bg-[#edf2fd] hover:text-[#1e55c5]"
            onClick={chip.onRemove}
            type="button"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        </span>
      ))}
      <button
        className="cursor-pointer px-1 text-[12px] font-semibold text-[#1e55c5] hover:underline"
        onClick={onClearAll}
        type="button"
      >
        Clear all
      </button>
    </div>
  )
}
