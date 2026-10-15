import { ChevronDown, Filter, TriangleAlert } from 'lucide-react'

import type { FeedbackSentiment } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Switch } from '../ui/switch'

const SENTIMENT_OPTIONS: FeedbackSentiment[] = ['negative', 'neutral', 'positive']

const SENTIMENT_DOT_CLASSES: Record<FeedbackSentiment, string> = {
  negative: 'bg-[#e12b0c]',
  neutral: 'bg-[#b7791f]',
  positive: 'bg-[#08882c]',
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
            <Checkbox checked={selected.has(option)} onCheckedChange={() => onToggle(option)} />
            {renderOption ? renderOption(option) : option}
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export type DemographicFilterGroup = {
  label: string
  options: string[]
}

export type FeedbackFilterProps = {
  activeFilterCount: number
  demographicFilters: DemographicFilterGroup[]
  selectedDemos: Record<string, Set<string>>
  /** Omit both to hide the Sentiment section (e.g. a page that has no per-point sentiment to filter). */
  selectedSentiments?: Set<string>
  onToggleSentiment?: (value: string) => void
  onToggleDemo: (label: string, value: string) => void
  /** Omit to hide the Violation section (e.g. nothing in view is flagged). */
  violationsOnly?: boolean
  onToggleViolationsOnly?: () => void
  /** How many points in view are flagged, shown next to the option. */
  violationCount?: number
  onClear: () => void
  /** `compact` (default) is the small outline button; `labeled` matches DateRangeFilter. */
  variant?: 'compact' | 'labeled'
}

export function FeedbackFilter({
  activeFilterCount,
  demographicFilters,
  selectedSentiments,
  selectedDemos,
  onToggleSentiment,
  onToggleDemo,
  violationsOnly,
  onToggleViolationsOnly,
  violationCount,
  onClear,
  variant = 'compact',
}: FeedbackFilterProps) {
  const labeled = variant === 'labeled'
  const isActive = activeFilterCount > 0
  // A filled count badge instead of "(n)" — readable at a glance.
  const countBadge = isActive ? (
    <span
      aria-label={`${activeFilterCount} active`}
      className="inline-flex min-w-4.5 items-center justify-center rounded-full bg-[#1e55c5] px-1 text-[10px] leading-4.5 font-bold text-white"
    >
      {activeFilterCount}
    </span>
  ) : null

  const popover = (
    <Popover>
      <PopoverTrigger asChild>
        {labeled ? (
          <Button
            className={cn(
              'inline-flex h-11.25 min-w-30 items-center justify-center gap-1.75 rounded-[10px] border border-[#1e55c5] px-4 text-[12px] font-semibold whitespace-nowrap text-[#1e55c5] transition-colors',
              isActive
                ? 'bg-[#edf2fd] hover:bg-[#e2eafb] data-[state=open]:bg-[#e2eafb]'
                : 'bg-white hover:bg-[#f7f8fb] data-[state=open]:bg-[#f7f8fb]',
            )}
            type="button"
          >
            <Filter size={16} />
            Filter
            {countBadge}
            <ChevronDown size={16} />
          </Button>
        ) : (
          <Button
            className={cn(
              'h-8.75 gap-1.75 rounded-[10px] px-2.5 text-[12px]',
              isActive
                ? 'border-[#1e55c5] bg-[#edf2fd] text-[#1e55c5] hover:bg-[#e2eafb]'
                : 'border-[#e6e7eb] text-black',
            )}
            variant="outline"
          >
            <Filter size={14} />
            Filter
            {countBadge}
            <ChevronDown size={14} />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={labeled ? 'start' : 'end'}
        className={cn(
          'max-h-(--radix-popover-content-available-height) w-64 overflow-y-auto rounded-[10px] bg-white p-4',
          labeled
            ? 'border border-[#d1d1d1] shadow-[0_12px_32px_rgba(15,23,42,0.12)]'
            : 'border border-[#e8eaf1] shadow-[0_8px_24px_rgba(15,23,42,0.14)]',
        )}
        sideOffset={labeled ? 8 : undefined}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[14px] font-bold text-black">
            <Filter size={16} />
            Filter
          </span>
          {activeFilterCount > 0 ? (
            <button
              className="cursor-pointer text-[12px] font-medium text-[#1e55c5]"
              onClick={onClear}
              type="button"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {/* A single on/off, so a plain switch row rather than a one-option section.
            Not a 4th sentiment: a positive point can be a violation too. */}
        {violationsOnly !== undefined && onToggleViolationsOnly ? (
          <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#eef0f4] py-2.5 text-[13px] text-[#14181f]">
            <span className="flex items-center gap-1.5">
              <TriangleAlert className="shrink-0 text-[#e0507a]" size={14} />
              Violations only
              {violationCount !== undefined ? (
                <span className="text-[#929292]">({violationCount})</span>
              ) : null}
            </span>
            <Switch checked={violationsOnly} onCheckedChange={onToggleViolationsOnly} />
          </label>
        ) : null}

        {selectedSentiments && onToggleSentiment ? (
          <FilterSection
            defaultOpen
            label="Sentiment"
            onToggle={onToggleSentiment}
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
        ) : null}

        {demographicFilters.map((group, index) => (
          <FilterSection
            defaultOpen={index === 0 && !selectedSentiments}
            key={group.label}
            label={group.label}
            onToggle={(value) => onToggleDemo(group.label, value)}
            options={group.options}
            selected={selectedDemos[group.label] ?? new Set<string>()}
          />
        ))}
      </PopoverContent>
    </Popover>
  )

  if (!labeled) return popover

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-[9.5px] font-medium text-black">Filter by:</span>
      {popover}
    </div>
  )
}
