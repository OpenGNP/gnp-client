import { AlertTriangle, ArrowRight, Check, ChevronDown, Loader2, MessageSquareText, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { ViolationReview } from '../../api/analytics'
import type { FeedbackPoint, FeedbackSentiment } from '../../data/dashboardAnalytics'
import { showAlert } from '../../lib/alertDialog'
import { ApiError } from '../../lib/api'
import { includesNeedle, toNeedle } from '../../lib/textSearch'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { FeedbackFilter, type DemographicFilterGroup } from './FeedbackFilter'
import { Highlight } from './Highlight'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { needsReview } from './violationReview'
import { ViolationTooltip } from './ViolationTooltip'

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


/** gnp-ai's violation_type → the adjective in the tag. */
const VIOLATION_KIND: Record<string, string> = { legal: 'legal', moral: 'moral', ethics: 'ethical' }

const REVIEW_BUTTON =
  'inline-flex cursor-pointer items-center gap-1 rounded-[6px] border-0 bg-transparent px-1.5 py-0.5 text-[11px] font-medium text-[#5f6368] hover:bg-[#f2f4f7] hover:text-[#14181f] disabled:cursor-default disabled:opacity-50'

/** A review action, with what it does on hover. */
function ReviewButton({
  children,
  hint,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  hint: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button className={REVIEW_BUTTON} disabled={disabled} onClick={onClick} type="button">
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{hint}</TooltipContent>
    </Tooltip>
  )
}

/** The violation tag (two levels + the AI's category) and, for the owner, the review actions. */
function ViolationReviewRow({
  point,
  onReview,
}: {
  point: FeedbackPoint
  onReview?: (status: ViolationReview) => Promise<void>
}) {
  // The action being saved (undefined = none); null is Undo.
  const [saving, setSaving] = useState<ViolationReview | undefined>(undefined)
  const busy = saving !== undefined
  const review = (status: ViolationReview) => {
    if (!onReview) return
    setSaving(status)
    onReview(status)
      .catch((error: unknown) =>
        showAlert(error instanceof ApiError ? error.message : 'Could not save your review. Please try again.'),
      )
      .finally(() => setSaving(undefined))
  }
  const savingLabel = (
    <>
      <Loader2 className="animate-spin" size={12} />
      Saving…
    </>
  )

  // Owner only: the tag is gone, but the call can still be undone.
  if (point.dismissed) {
    return onReview ? (
      <span className="flex items-center gap-1 text-[11px] text-[#726f6f]">
        Marked not a violation{point.reviewedBy ? ` by ${point.reviewedBy}` : ''}
        <ReviewButton disabled={busy} hint="Put the tag back" onClick={() => review(null)}>
          {saving === null ? savingLabel : 'Undo'}
        </ReviewButton>
      </span>
    ) : null
  }
  if (!point.violation) return null

  const possible = point.violationStatus === 'possible'
  const kind = VIOLATION_KIND[point.violationType ?? ''] ?? null
  // "Possible moral violation", "Legal violation", or plain "Violation" when the AI gave no category.
  const label = [possible ? 'Possible' : null, kind, 'violation'].filter(Boolean).join(' ')
  return (
    <>
      <ViolationTooltip scope="point">
        <span
          className={cn(
            // The app's violation pink. Filled = sure (AI or a reviewer); dashed outline = possible,
            // like What changed's hollow / dashed marks for a tentative change.
            'flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#e0507a]',
            possible ? 'border border-dashed border-[#e0507a] bg-white px-2.25 py-0.75' : 'bg-[#fcf3f6]',
          )}
        >
          <AlertTriangle size={11} />
          {label[0]!.toUpperCase() + label.slice(1)}
        </span>
      </ViolationTooltip>
      {point.violationStatus === 'confirmed' ? (
        <span className="flex items-center gap-1 text-[11px] text-[#726f6f]">
          Confirmed by {point.reviewedBy ?? 'a reviewer'}
          {onReview ? (
            <ReviewButton disabled={busy} hint="Back to the AI's tag, unreviewed" onClick={() => review(null)}>
              {saving === null ? savingLabel : 'Undo'}
            </ReviewButton>
          ) : null}
        </span>
      ) : onReview ? (
        <span className="flex items-center gap-0.5">
          <ReviewButton
            disabled={busy}
            hint="Keeps the tag and records that you checked it"
            onClick={() => review('confirmed')}
          >
            {saving === 'confirmed' ? (
              savingLabel
            ) : (
              <>
                <Check size={12} />
                Confirm violation
              </>
            )}
          </ReviewButton>
          <ReviewButton
            disabled={busy}
            hint="Removes the tag and stops counting it as a violation"
            onClick={() => review('dismissed')}
          >
            {saving === 'dismissed' ? (
              savingLabel
            ) : (
              <>
                <X size={12} />
                Not a violation
              </>
            )}
          </ReviewButton>
        </span>
      ) : null}
    </>
  )
}

export function FeedbackPointCard({
  point,
  showName,
  onOpenResponse,
  query,
  onReview,
}: {
  point: FeedbackPoint
  showName: boolean
  onReview?: (status: ViolationReview) => Promise<void>
  onOpenResponse?: (submissionId: number) => void
  /** The section's search, highlighted. */
  query: string
}) {
  // null = untouched: the original opens by itself when the search only matched there.
  const [expandedChoice, setIsExpanded] = useState<boolean | null>(null)
  const needle = toNeedle(query)
  const matchedOnlyOriginal =
    needle !== '' && !includesNeedle(point.quote, needle) && includesNeedle(point.originalFeedback, needle)
  const isExpanded = expandedChoice ?? matchedOnlyOriginal

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

        <ViolationReviewRow onReview={onReview} point={point} />
      </div>

      <p className="m-0 text-[13px] leading-[1.6] text-[#14181f]">
        “<Highlight query={query} text={point.quote} />”
      </p>

      <button
        className="flex w-fit cursor-pointer items-center gap-1 text-[12px] font-medium text-[#1e55c5]"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? 'Hide original feedback' : 'Show original feedback'}
        <ChevronDown
          className={cn('transition-transform', isExpanded && 'rotate-180')}
          size={14}
        />
      </button>

      {isExpanded ? (
        <div className="flex flex-col gap-2 rounded-[8px] bg-[#fafbfe] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#726f6f]">Original feedback</span>
            <span className="text-[11px] text-[#726f6f]">
              {showName ? (
                <>
                  <span className={point.respondentName ? 'font-medium text-[#3f4045]' : undefined}>
                    <Highlight query={query} text={point.respondentName ?? 'Anonymous'} />
                  </span>
                  {', '}
                </>
              ) : null}
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
          <p className="m-0 text-[12px] leading-[1.6] text-[#3f4045]">
            <Highlight query={query} text={point.originalFeedback} />
          </p>
          {onOpenResponse && point.submissionId !== undefined ? (
            <button
              className="flex w-fit cursor-pointer items-center gap-1 text-[12px] font-medium text-[#1e55c5] hover:underline"
              onClick={() => onOpenResponse(point.submissionId!)}
              type="button"
            >
              View full response
              <ArrowRight size={14} />
            </button>
          ) : null}
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
  /** A period picked on the topic's volume chart (its bar `index`), or a date span [from, to) from What changed. */
  period?: { label: string; index?: number; from?: string; to?: string } | null
  onClearPeriod?: () => void
  /** The dashboard's "Hide names" toggle. */
  hideNames?: boolean
  /** Opens a point's whole response in the Individual tab. */
  onOpenResponse?: (submissionId: number) => void
  /** Pre-fills the search — the Themes Overview search the topic was opened from. */
  initialQuery?: string
  /** Confirm / dismiss a flagged point (form owner only). */
  onReviewViolation?: (pointId: string, status: ViolationReview) => Promise<void>
}

export function FeedbackSegmentSection({
  feedbackSegment,
  demographicFilters: allDemographicFilters,
  mainDemoSelection,
  period = null,
  onClearPeriod,
  hideNames = false,
  onOpenResponse,
  initialQuery = '',
  onReviewViolation,
}: FeedbackSegmentSectionProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [query, setQuery] = useState(initialQuery)
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

  // Names only when this form recorded any — otherwise every card would just say "Anonymous".
  const showNames = !hideNames && feedbackSegment.some((point) => point.respondentName)

  const [violationsOnlyChoice, setViolationsOnly] = useState(false)
  const violationCount = feedbackSegment.filter((point) => point.violation).length
  // Ignored once nothing in view is flagged (the option is hidden then).
  const violationsOnly = violationsOnlyChoice && violationCount > 0
  // Only the owner reviews, so only they get the filter.
  const [needsReviewChoice, setNeedsReviewOnly] = useState(false)
  const needsReviewCount = onReviewViolation ? feedbackSegment.filter(needsReview).length : 0
  const needsReviewOnly = needsReviewChoice && needsReviewCount > 0

  const activeFilterCount =
    Number(violationsOnly) +
    Number(needsReviewOnly) +
    selectedSentiments.size +
    Object.values(selectedDemos).reduce((sum, set) => sum + set.size, 0)

  const toggleDemo = (label: string, value: string) =>
    setSelectedDemos((prev) => ({
      ...prev,
      [label]: toggleInSet(prev[label] ?? new Set<string>(), value),
    }))

  const visiblePoints = useMemo(() => {
    const needle = toNeedle(query)
    const filtered = feedbackSegment.filter((point) => {
      // Names are searchable only while they're shown.
      if (
        needle &&
        !includesNeedle(point.quote, needle) &&
        !includesNeedle(point.originalFeedback, needle) &&
        !(showNames && includesNeedle(point.respondentName, needle))
      ) {
        return false
      }
      if (period?.index !== undefined && point.volumeBucket !== period.index) return false
      if (period?.from && period.to) {
        const t = Date.parse(point.submittedAt)
        if (t < Date.parse(period.from) || t >= Date.parse(period.to)) return false
      }
      if (violationsOnly && !point.violation) return false
      if (needsReviewOnly && !needsReview(point)) return false
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
      const flagged = Number(Boolean(b.violation)) - Number(Boolean(a.violation))
      if (flagged !== 0) return flagged
      return sortOption === 'newest'
        ? b.submittedAt.localeCompare(a.submittedAt)
        : a.submittedAt.localeCompare(b.submittedAt)
    })
  }, [
    feedbackSegment,
    period,
    violationsOnly,
    needsReviewOnly,
    selectedSentiments,
    selectedDemos,
    sortOption,
    query,
    showNames,
  ])

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[#e9eaed] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className="m-0 text-[12px] font-medium text-[#726f6f]">
            Feedback ({visiblePoints.length})
          </p>
          {period ? (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-[#eef3fd] py-0.5 pr-1 pl-2.5 text-[11px] font-semibold text-[#1e55c5]">
              <span className="truncate">{period.label}</span>
              <button
                aria-label={`Show feedback from every period, not just ${period.label}`}
                className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#1e55c5] transition-colors hover:bg-[#dbe6fb]"
                onClick={onClearPeriod}
                type="button"
              >
                <X size={11} strokeWidth={2.6} />
              </button>
            </span>
          ) : null}
        </div>
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
              setViolationsOnly(false)
              setNeedsReviewOnly(false)
              setSelectedSentiments(new Set())
              setSelectedDemos({})
            }}
            onToggleDemo={toggleDemo}
            // Only offered when this topic has something flagged.
            onToggleViolationsOnly={
              violationCount > 0 ? () => setViolationsOnly((value) => !value) : undefined
            }
            violationCount={violationCount}
            violationsOnly={violationCount > 0 ? violationsOnly : undefined}
            needsReviewOnly={needsReviewCount > 0 ? needsReviewOnly : undefined}
            onToggleNeedsReviewOnly={needsReviewCount > 0 ? () => setNeedsReviewOnly((value) => !value) : undefined}
            needsReviewCount={needsReviewCount}
            onToggleSentiment={(value) => setSelectedSentiments((prev) => toggleInSet(prev, value))}
            selectedDemos={selectedDemos}
            selectedSentiments={selectedSentiments}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-[8px] border border-[#e6e7eb] px-2.5 py-2 focus-within:border-[#1e55c5]">
        <Search className="shrink-0 text-[#726f6f]" size={14} />
        <input
          aria-label="Search this topic's feedback"
          className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-[#726f6f]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search feedback…"
          type="text"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#726f6f] hover:bg-[#f7f8fb] hover:text-black"
            onClick={() => setQuery('')}
            type="button"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {visiblePoints.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visiblePoints.map((point) => (
            <FeedbackPointCard
              key={point.id}
              onReview={onReviewViolation ? (status) => onReviewViolation(point.id, status) : undefined}
              onOpenResponse={onOpenResponse}
              point={point}
              query={query}
              showName={showNames}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 flex items-center gap-1.5 text-[12px] text-[#726f6f]">
          <MessageSquareText size={14} />
          {query.trim() ? `No feedback matches “${query.trim()}” with these filters.` : 'No feedback matches this filter.'}
        </p>
      )}
    </div>
  )
}
