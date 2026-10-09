import { AlertTriangle, ChevronDown, MessageSquareText } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { FeedbackPoint, FeedbackSentiment } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { FeedbackFilter, type DemographicFilterGroup } from './FeedbackFilter'

type SortOption = 'newest' | 'oldest'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

const SENTIMENT_BADGE_CLASSES: Record<FeedbackSentiment, string> = {
  negative: 'bg-[#f9eaea] text-[#e12b0c]',
  neutral: 'bg-[#fdf3e0] text-[#b7791f]',
  positive: 'bg-[#eaf9ec] text-[#08882c]',
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
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
            SENTIMENT_BADGE_CLASSES[point.sentiment],
          )}
        >
          {point.sentiment}
        </span>

        {point.severe ? (
          <span
            className="flex w-fit items-center gap-1 rounded-full bg-[#fdeaea] px-2.5 py-1 text-[11px] font-semibold text-[#c1121f] ring-1 ring-[#f3c9c9] ring-inset"
            title="Flagged by AI for review"
          >
            <AlertTriangle size={11} />
            Violation
          </span>
        ) : null}
      </div>

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

export type FeedbackSegmentSectionProps = {
  feedbackSegment: FeedbackPoint[]
  /** Every demographic question + answer on the form. Falls back to what the segment's data contains. */
  demographicFilters?: DemographicFilterGroup[]
  /**
   * The page-level demographic filter. It seeds this filter's selection, and for those
   * questions only the chosen answers are offered — the data is already narrowed to them.
   */
  mainDemoSelection?: Record<string, string[]>
}

export function FeedbackSegmentSection({
  feedbackSegment,
  demographicFilters: allDemographicFilters,
  mainDemoSelection,
}: FeedbackSegmentSectionProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [selectedSentiments, setSelectedSentiments] = useState<Set<string>>(new Set())
  // Keyed by the form's demographic question label — whatever questions the form has.
  const [selectedDemos, setSelectedDemos] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(mainDemoSelection ?? {})
        .filter(([, values]) => values.length > 0)
        .map(([label, values]) => [label, new Set(values)]),
    ),
  )

  // Offer every answer the form has (not just the ones present in this segment), except
  // that a question already narrowed by the page-level filter only offers its chosen answers.
  const demographicFilters = useMemo(() => {
    let groups = allDemographicFilters
    if (!groups) {
      const byLabel = new Map<string, Set<string>>()
      for (const point of feedbackSegment) {
        for (const demo of point.demographics) {
          const values = byLabel.get(demo.label) ?? new Set<string>()
          values.add(demo.value)
          byLabel.set(demo.label, values)
        }
      }
      groups = [...byLabel.entries()].map(([label, values]) => ({
        label,
        options: [...values].sort(),
      }))
    }
    return groups.map((group) => {
      const locked = mainDemoSelection?.[group.label]
      return locked && locked.length > 0
        ? { ...group, options: group.options.filter((option) => locked.includes(option)) }
        : group
    })
  }, [allDemographicFilters, feedbackSegment, mainDemoSelection])

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
    // Flagged points float to the top whichever way the list is sorted — a
    // reported breach should not be buried by date. Within each group the
    // chosen newest/oldest order still applies.
    return [...filtered].sort((a, b) => {
      const flagged = Number(Boolean(b.severe)) - Number(Boolean(a.severe))
      if (flagged !== 0) return flagged
      return sortOption === 'newest'
        ? b.submittedAt.localeCompare(a.submittedAt)
        : a.submittedAt.localeCompare(b.submittedAt)
    })
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

          <FeedbackFilter
            activeFilterCount={activeFilterCount}
            demographicFilters={demographicFilters}
            onClear={() => {
              setSelectedSentiments(new Set())
              setSelectedDemos({})
            }}
            onToggleDemo={toggleDemo}
            onToggleSentiment={(value) => setSelectedSentiments((prev) => toggleInSet(prev, value))}
            selectedDemos={selectedDemos}
            selectedSentiments={selectedSentiments}
          />
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
