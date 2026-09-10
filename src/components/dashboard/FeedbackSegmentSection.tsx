import { ChevronDown, Filter, MessageSquareText } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { FeedbackPoint, FeedbackSentiment } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

type SortOption = 'newest' | 'oldest'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

const SENTIMENT_OPTIONS: FeedbackSentiment[] = ['negative', 'neutral', 'positive']

const SENTIMENT_BADGE_CLASSES: Record<FeedbackSentiment, string> = {
  negative: 'bg-[#f9eaea] text-[#e12b0c]',
  neutral: 'bg-[#fdf3e0] text-[#b7791f]',
  positive: 'bg-[#eaf9ec] text-[#08882c]',
}

const SENTIMENT_DOT_CLASSES: Record<FeedbackSentiment, string> = {
  negative: 'bg-[#e12b0c]',
  neutral: 'bg-[#b7791f]',
  positive: 'bg-[#08882c]',
}

function formatFeedbackDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function toggleInSet<T>(set: Set<T>, value: T) {
  const next = new Set(set)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

function FeedbackPointCard({ point }: { point: FeedbackPoint }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#e9eaed] p-4">
      <span
        className={cn(
          'w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
          SENTIMENT_BADGE_CLASSES[point.sentiment],
        )}
      >
        {point.sentiment}
      </span>

      <p className="m-0 text-[13px] leading-[1.6] text-[#14181f]">“{point.quote}”</p>

      <button
        className="flex w-fit cursor-pointer items-center gap-1 text-[12px] font-medium text-[#1e55c5]"
        onClick={() => setIsExpanded((value) => !value)}
        type="button"
      >
        {isExpanded ? 'Hide original Feedback' : 'Show original Feedback'}
        <ChevronDown
          className={cn('transition-transform', isExpanded && 'rotate-180')}
          size={14}
        />
      </button>

      {isExpanded ? (
        <div className="flex flex-col gap-2 rounded-[8px] bg-[#fafbfe] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#929292]">Original Feedback</span>
            <span className="text-[11px] text-[#929292]">
              {formatFeedbackDate(point.submittedAt)}
            </span>
          </div>
          {point.demographics.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {point.demographics.map((demo) => (
                <span
                  className="rounded-full border border-[#e9eaed] bg-white px-2 py-0.5 text-[11px] text-[#3f4045]"
                  key={demo.label}
                >
                  {demo.label}: {demo.value}
                </span>
              ))}
            </div>
          ) : null}
          <p className="m-0 text-[12px] leading-[1.6] text-[#3f4045]">{point.originalFeedback}</p>
        </div>
      ) : null}
    </div>
  )
}

function FilterSection({
  label,
  defaultOpen = false,
  options,
  selected,
  onToggle,
  renderOption,
}: {
  label: string
  defaultOpen?: boolean
  options: string[]
  selected: Set<string>
  onToggle: (value: string) => void
  renderOption?: (value: string) => React.ReactNode
}) {
  return (
    <Collapsible className="border-b border-[#eef0f4] last:border-b-0" defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between py-2.5 text-[13px] font-medium text-[#3f4045] outline-none">
        {label}
        <ChevronDown
          className="text-[#929292] transition-transform group-data-[state=open]:rotate-180"
          size={16}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2.5 overflow-hidden pb-3 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        {options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-2.5 pl-0.5 text-[13px] text-[#14181f]"
            key={option}
          >
            <Checkbox
              checked={selected.has(option)}
              onCheckedChange={() => onToggle(option)}
            />
            {renderOption ? renderOption(option) : option}
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export type FeedbackSegmentSectionProps = {
  feedbackSegment: FeedbackPoint[]
}

export function FeedbackSegmentSection({ feedbackSegment }: FeedbackSegmentSectionProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [selectedSentiments, setSelectedSentiments] = useState<Set<string>>(new Set())
  // Keyed by the form's demographic question label — whatever questions the form has.
  const [selectedDemos, setSelectedDemos] = useState<Record<string, Set<string>>>({})

  // The demographic filter groups come from the data: one per distinct question label,
  // with its distinct answer values.
  const demographicFilters = useMemo(() => {
    const byLabel = new Map<string, Set<string>>()
    for (const point of feedbackSegment) {
      for (const demo of point.demographics) {
        const values = byLabel.get(demo.label) ?? new Set<string>()
        values.add(demo.value)
        byLabel.set(demo.label, values)
      }
    }
    return [...byLabel.entries()].map(([label, values]) => ({
      label,
      options: [...values].sort(),
    }))
  }, [feedbackSegment])

  const activeFilterCount =
    selectedSentiments.size +
    Object.values(selectedDemos).reduce((sum, set) => sum + set.size, 0)

  const toggleDemo = (label: string, value: string) =>
    setSelectedDemos((prev) => ({
      ...prev,
      [label]: toggleInSet(prev[label] ?? new Set<string>(), value),
    }))

  const visiblePoints = useMemo(() => {
    const filtered = feedbackSegment.filter((point) => {
      if (selectedSentiments.size > 0 && !selectedSentiments.has(point.sentiment)) {
        return false
      }
      for (const [label, selected] of Object.entries(selectedDemos)) {
        if (selected.size === 0) continue
        const demo = point.demographics.find((entry) => entry.label === label)
        if (!demo || !selected.has(demo.value)) return false
      }
      return true
    })
    return [...filtered].sort((a, b) =>
      sortOption === 'newest'
        ? b.submittedAt.localeCompare(a.submittedAt)
        : a.submittedAt.localeCompare(b.submittedAt),
    )
  }, [feedbackSegment, selectedSentiments, selectedDemos, sortOption])

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[#e9eaed] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <p className="m-0 text-[12px] font-medium text-[#929292]">
          Feedback Segment ({visiblePoints.length})
        </p>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8.75 gap-1.75 rounded-[10px] border-[#e6e7eb] px-2.5 text-[12px] text-black"
                variant="outline"
              >
                {SORT_OPTIONS.find((option) => option.value === sortOption)!.label}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-32">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  className={cn(
                    'border-l-[3px]',
                    option.value === sortOption ? 'border-[#1e55c5]' : 'border-transparent',
                  )}
                  key={option.value}
                  onSelect={() => setSortOption(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="h-8.75 gap-1.75 rounded-[10px] border-[#e6e7eb] px-2.5 text-[12px] text-black"
                variant="outline"
              >
                <Filter size={14} />
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                <ChevronDown size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="max-h-(--radix-popover-content-available-height) w-64 overflow-y-auto rounded-[10px] border border-[#e8eaf1] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[14px] font-bold text-black">
                  <Filter size={16} />
                  Filter
                </span>
                {activeFilterCount > 0 ? (
                  <button
                    className="cursor-pointer text-[12px] font-medium text-[#1e55c5]"
                    onClick={() => {
                      setSelectedSentiments(new Set())
                      setSelectedDemos({})
                    }}
                    type="button"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              <FilterSection
                defaultOpen
                label="Sentiment"
                onToggle={(value) => setSelectedSentiments((prev) => toggleInSet(prev, value))}
                options={SENTIMENT_OPTIONS}
                renderOption={(value) => (
                  <span className="flex items-center gap-1.5 capitalize">
                    <span
                      className={cn(
                        'size-1.75 shrink-0 rounded-full',
                        SENTIMENT_DOT_CLASSES[value as FeedbackSentiment],
                      )}
                    />
                    {value}
                  </span>
                )}
                selected={selectedSentiments}
              />

              {demographicFilters.map((group, index) => (
                <FilterSection
                  defaultOpen={index === 0}
                  key={group.label}
                  label={group.label}
                  onToggle={(value) => toggleDemo(group.label, value)}
                  options={group.options}
                  selected={selectedDemos[group.label] ?? new Set<string>()}
                />
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {visiblePoints.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visiblePoints.map((point) => (
            <FeedbackPointCard key={point.id} point={point} />
          ))}
        </div>
      ) : (
        <p className="m-0 flex items-center gap-1.5 text-[12px] text-[#929292]">
          <MessageSquareText size={14} />
          No feedback matches this filter.
        </p>
      )}
    </div>
  )
}
