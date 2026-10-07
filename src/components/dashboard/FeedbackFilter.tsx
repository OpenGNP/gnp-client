import { ChevronDown, Filter } from 'lucide-react'

import type { FeedbackSentiment } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

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
  onClear,
  variant = 'compact',
}: FeedbackFilterProps) {
  const labeled = variant === 'labeled'
  const filterLabel = `Filter${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`

  const popover = (
    <Popover>
      <PopoverTrigger asChild>
        {labeled ? (
          <Button
            className="inline-flex h-11.25 min-w-30 items-center justify-center gap-1.75 rounded-[10px] border border-[#1e55c5] bg-white px-4 text-[12px] font-semibold whitespace-nowrap text-[#1e55c5] transition-colors hover:bg-[#f7f8fb] data-[state=open]:bg-[#f7f8fb]"
            type="button"
          >
            <Filter size={16} />
            {filterLabel}
            <ChevronDown size={16} />
          </Button>
        ) : (
          <Button
            className="h-8.75 gap-1.75 rounded-[10px] border-[#e6e7eb] px-2.5 text-[12px] text-black"
            variant="outline"
          >
            <Filter size={14} />
            {filterLabel}
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
