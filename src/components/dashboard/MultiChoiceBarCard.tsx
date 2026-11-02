import { useState } from 'react'

import type { MultiChoiceBreakdown, SingleChoiceBreakdown } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { getDemographicColor } from './demographicColors'

export type MultiChoiceBarCardProps = {
  /** Single-choice too, when it has more options than the pie has colours. */
  breakdown: MultiChoiceBreakdown | SingleChoiceBreakdown
}

export function MultiChoiceBarCard({ breakdown }: MultiChoiceBarCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const isMulti = breakdown.kind === 'multi-choice'
  const total = isMulti
    ? breakdown.totalRespondents
    : breakdown.options.reduce((sum, option) => sum + option.value, 0)

  return (
    <div className="flex w-full flex-col gap-5 py-10">
      <div className="flex flex-col gap-2 px-7.5">
        <h3 className="m-0 text-[16px] font-semibold tracking-[0.16px] text-[#14181f]">{breakdown.title}</h3>
        <p className="m-0 text-[12px] font-medium text-[#726f6f]">
          {total} {total === 1 ? 'response' : 'responses'}
          {isMulti ? ' (could pick more than one)' : null}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-10 max-[560px]:px-4">
        {breakdown.options.map((option, index) => {
          const percent =
            total > 0
              ? Math.round((option.value / total) * 100)
              : 0
          const isDimmed = activeIndex !== null && activeIndex !== index

          return (
            <div
              className={cn(
                '-mx-2 flex flex-col gap-1.5 rounded-[8px] px-2 py-1 transition-all duration-150',
                activeIndex === index ? 'bg-[#f7f8fb]' : 'bg-transparent',
                isDimmed && 'opacity-50',
              )}
              key={option.id}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Label above the bar so sentence-long options wrap instead of truncating. */}
              <div className="flex items-baseline justify-between gap-4">
                <span
                  className={cn(
                    'min-w-0 text-[14px] wrap-break-word text-[#404040]',
                    activeIndex === index && 'text-[#14181f]',
                  )}
                >
                  {option.label}
                </span>
                <span className="shrink-0 text-[12px] whitespace-nowrap text-[#726f6f]">
                  {option.value} ({percent}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#eef0f4]">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    backgroundColor: getDemographicColor(index),
                    width: `${percent}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
