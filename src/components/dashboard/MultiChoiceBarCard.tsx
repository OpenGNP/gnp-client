import { useState } from 'react'

import type { MultiChoiceBreakdown } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { getDemographicColor } from './demographicColors'

export type MultiChoiceBarCardProps = {
  breakdown: MultiChoiceBreakdown
}

export function MultiChoiceBarCard({ breakdown }: MultiChoiceBarCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div className="flex w-full flex-col gap-5 py-10">
      <div className="flex flex-col gap-2 px-7.5">
        <p className="m-0 text-[14px] font-medium text-black">{breakdown.title}</p>
        <p className="m-0 text-[12px] font-medium text-[#929292]">
          Response: {breakdown.totalRespondents} · respondents could select more than one
          option
        </p>
      </div>

      <div className="flex flex-col gap-4 px-10 max-[560px]:px-4">
        {breakdown.options.map((option, index) => {
          const percent =
            breakdown.totalRespondents > 0
              ? Math.round((option.value / breakdown.totalRespondents) * 100)
              : 0
          const isDimmed = activeIndex !== null && activeIndex !== index

          return (
            <div
              className={cn(
                '-mx-2 flex cursor-pointer items-center gap-4 rounded-[8px] px-2 py-1 transition-all duration-150',
                activeIndex === index ? 'bg-[#f7f8fb]' : 'bg-transparent',
                isDimmed && 'opacity-50',
              )}
              key={option.id}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className={cn(
                  'w-32 shrink-0 truncate text-[14px] text-[#404040]',
                  activeIndex === index && 'font-semibold text-[#14181f]',
                )}
              >
                {option.label}
              </span>
              <div className="h-6 min-w-0 flex-1 overflow-hidden rounded-full bg-[#eef0f4]">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    backgroundColor: getDemographicColor(index),
                    width: `${percent}%`,
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-[12px] text-[#929292]">
                {option.value} · {percent}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
