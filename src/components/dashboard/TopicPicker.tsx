import { ArrowDown, ArrowUp, ChevronDown, ListFilter, Search, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { TrendAvailableTopic, TrendRank } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { TOPIC_TREND_COLORS } from './trendColors'

const RANKS: { value: TrendRank; label: string; short: string }[] = [
  { value: 'movers', label: 'Biggest movers', short: 'Movers' },
  { value: 'mentioned', label: 'Most mentioned', short: 'Mentioned' },
  { value: 'severe', label: 'Most severe', short: 'Severe' },
]

/** Rows shown before "Show more" kicks in (search bypasses this). */
const INITIAL_ROWS = 40

function DeltaTag({ value }: { value: number }) {
  if (value === 0) {
    return <span className="w-12 shrink-0 text-right text-[11px] text-[#929292]">0%</span>
  }
  const up = value > 0
  const Arrow = up ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        'flex w-12 shrink-0 items-center justify-end gap-0.5 text-[11px] font-medium tabular-nums',
        up ? 'text-[#0b842d]' : 'text-[#c0392b]',
      )}
    >
      <Arrow size={11} />
      {Math.abs(value)}%
    </span>
  )
}

export type TopicPickerProps = {
  /** Every in-window topic, already ranked by `rank` (server order). */
  topics: TrendAvailableTopic[]
  /** Ids currently on the chart, in draw order (drives the swatch colours). */
  selectedIds: string[]
  rank: TrendRank
  max: number
  pending?: boolean
  onRankChange: (rank: TrendRank) => void
  onSelectionChange: (ids: string[]) => void
  /** Back to the rank's auto pick. */
  onReset: () => void
}

export function TopicPicker({
  topics,
  selectedIds,
  rank,
  max,
  pending = false,
  onRankChange,
  onSelectionChange,
  onReset,
}: TopicPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const selectedOrder = useMemo(() => new Map(selectedIds.map((id, i) => [id, i])), [selectedIds])
  const rankShort = RANKS.find((r) => r.value === rank)?.short ?? 'Custom'
  const atMax = selectedIds.length >= max

  const query = search.trim().toLowerCase()
  const matches = query
    ? topics.filter((topic) => topic.label.toLowerCase().includes(query))
    : topics
  const truncated = !query && !showAll && matches.length > INITIAL_ROWS
  const visible = truncated ? matches.slice(0, INITIAL_ROWS) : matches

  const toggle = (id: string) => {
    if (selectedOrder.has(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
    } else if (!atMax) {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch('')
      setShowAll(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-[9.5px] font-medium text-black">Topics on chart:</span>
      <Popover onOpenChange={handleOpenChange} open={open}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex h-11.25 min-w-33.75 items-center justify-center gap-1.75 rounded-[10px] border border-[#1e55c5] bg-white px-4 text-[12px] font-semibold whitespace-nowrap text-[#1e55c5] transition-colors hover:bg-[#f7f8fb] data-[state=open]:bg-[#f7f8fb]"
            type="button"
          >
            <ListFilter size={16} />
            {rankShort} · {selectedIds.length}
            <ChevronDown size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex max-h-(--radix-popover-content-available-height) w-80 flex-col rounded-[10px] border border-[#e8eaf1] bg-white p-0 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          side="bottom"
          sideOffset={8}
        >
          <div className="flex flex-col gap-2.5 border-b border-[#eef0f4] p-3">
            <div className="flex items-center gap-2 rounded-[8px] border border-[#e6e7eb] px-2.5 py-2 focus-within:border-[#1e55c5]">
              <Search className="shrink-0 text-[#929292]" size={14} />
              <input
                className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-[#929292]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${topics.length} topics…`}
                type="text"
                value={search}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#929292]">Quick pick</span>
              <div className="inline-flex overflow-hidden rounded-[8px] border border-[#1e55c5]">
                {RANKS.map((option) => (
                  <button
                    className={cn(
                      'h-7 cursor-pointer px-2.5 text-[11px] font-semibold whitespace-nowrap transition-colors',
                      option.value === rank
                        ? 'bg-[#1e55c5] text-white'
                        : 'bg-white text-[#1e55c5] hover:bg-[#f7f8fb]',
                    )}
                    key={option.value}
                    onClick={() => onRankChange(option.value)}
                    type="button"
                  >
                    {option.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#929292]">
              <span>
                On chart: {selectedIds.length}/{max}
                {pending ? ' · updating…' : ''}
              </span>
              <button
                className="cursor-pointer font-medium text-[#1e55c5] hover:underline"
                onClick={onReset}
                type="button"
              >
                Reset to {rankShort.toLowerCase()}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="m-0 px-3 py-6 text-center text-[12px] text-[#929292]">
                No topics match “{search}”.
              </p>
            ) : (
              visible.map((topic) => {
                const order = selectedOrder.get(topic.id)
                const selected = order !== undefined
                const disabled = !selected && atMax
                return (
                  <button
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                      selected ? 'bg-[#f7f8fb]' : 'hover:bg-[#f7f8fb]',
                      disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                    )}
                    disabled={disabled}
                    key={topic.id}
                    onClick={() => toggle(topic.id)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        !selected && 'border border-[#c9cfdb]',
                      )}
                      style={
                        selected
                          ? { backgroundColor: TOPIC_TREND_COLORS[order % TOPIC_TREND_COLORS.length] }
                          : undefined
                      }
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-[#14181f]">
                      {topic.label}
                    </span>
                    {topic.severe > 0 ? (
                      <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#c0392b]">
                        <TriangleAlert size={11} />
                        {topic.severe}
                      </span>
                    ) : null}
                    <span className="w-8 shrink-0 text-right text-[11px] text-[#3f4045] tabular-nums">
                      {topic.mentions}
                    </span>
                    <DeltaTag value={topic.volumeChange} />
                  </button>
                )
              })
            )}

            {truncated ? (
              <button
                className="mt-1 w-full cursor-pointer px-3 py-2 text-center text-[12px] font-medium text-[#1e55c5] hover:underline"
                onClick={() => setShowAll(true)}
                type="button"
              >
                Show {matches.length - INITIAL_ROWS} more
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
