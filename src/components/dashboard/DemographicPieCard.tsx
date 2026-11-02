import { useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

import type { SingleChoiceBreakdown } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { getDemographicColor } from './demographicColors'

const share = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0)

export type DemographicPieCardProps = {
  breakdown: SingleChoiceBreakdown
}

export function DemographicPieCard({ breakdown }: DemographicPieCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const totalResponses = breakdown.options.reduce((sum, option) => sum + option.value, 0)

  function isDimmed(index: number) {
    return activeIndex !== null && activeIndex !== index
  }

  return (
    <div className="@container flex w-full flex-col gap-3.25 py-10">
      <div className="flex flex-col gap-2 px-7.5">
        <h3 className="m-0 text-[16px] font-semibold tracking-[0.16px] text-[#14181f]">{breakdown.title}</h3>
        <p className="m-0 text-[12px] font-medium text-[#726f6f]">
          {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-5 px-7.5 @md:flex-row max-[560px]:px-4">
        <div
          aria-label={`${breakdown.title} breakdown`}
          className="shrink-0"
          role="img"
        >
          <PieChart height={200} width={200}>
            <Pie
              cx={100}
              cy={100}
              data={breakdown.options}
              dataKey="value"
              isAnimationActive={false}
              outerRadius={96}
              stroke="#fff"
              strokeWidth={2}
            >
              {breakdown.options.map((option, index) => (
                <Cell
                  className="transition-opacity duration-150 outline-none"
                  fill={getDemographicColor(index)}
                  fillOpacity={isDimmed(index) ? 0.35 : 1}
                  key={option.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </Pie>
          </PieChart>
        </div>

        <div className="flex min-w-0 flex-col gap-3.75">
          {breakdown.options.map((option, index) => (
            <span
              className={cn(
                '-mx-1.5 flex items-center gap-2 rounded-[6px] px-1.5 py-0.5 transition-all duration-150',
                activeIndex === index ? 'bg-[#f7f8fb]' : 'bg-transparent',
                isDimmed(index) && 'opacity-50',
              )}
              key={option.id}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: getDemographicColor(index) }}
              />
              <span
                className={cn(
                  'min-w-0 text-[14px] text-[#404040]',
                  activeIndex === index && 'text-[#14181f]',
                )}
              >
                {option.label}
              </span>
              <span className="shrink-0 text-[12px] whitespace-nowrap text-[#726f6f]">
                {option.value} ({share(option.value, totalResponses)}%)
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
