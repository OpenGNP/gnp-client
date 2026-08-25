import { useState } from 'react'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import type { DemographicOption, SingleChoiceBreakdown } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { getDemographicColor } from './demographicColors'

export type DemographicPieCardProps = {
  breakdown: SingleChoiceBreakdown
}

function DemographicTooltip({
  active,
  payload,
  totalResponses,
}: TooltipContentProps & { totalResponses: number }) {
  const entry = payload?.[0]

  if (!active || !entry) {
    return null
  }

  const option = entry.payload as DemographicOption
  const percent = totalResponses > 0 ? Math.round((option.value / totalResponses) * 100) : 0

  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-[#e8eaf1] bg-white px-3 py-2 text-[12px] whitespace-nowrap shadow-[0_8px_24px_rgba(15,23,42,0.14)]">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: entry.color }}
      />
      <span className="font-medium text-[#14181f]">{option.label}</span>
      <span className="text-[#929292]">
        {option.value} · {percent}%
      </span>
    </div>
  )
}

export function DemographicPieCard({ breakdown }: DemographicPieCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const totalResponses = breakdown.options.reduce((sum, option) => sum + option.value, 0)

  function isDimmed(index: number) {
    return activeIndex !== null && activeIndex !== index
  }

  return (
    <div className="flex w-full flex-col gap-3.25 py-10">
      <div className="flex flex-col gap-2 px-7.5">
        <p className="m-0 text-[14px] font-medium text-black">{breakdown.title}</p>
        <p className="m-0 text-[12px] font-medium text-[#929292]">
          Response: {totalResponses}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-5 px-10 max-[560px]:px-4">
        <div
          aria-label={`${breakdown.title} breakdown`}
          className="shrink-0"
          role="img"
        >
          <PieChart height={260} width={260}>
            <Tooltip
              content={(tooltipProps) => (
                <DemographicTooltip {...tooltipProps} totalResponses={totalResponses} />
              )}
              cursor={false}
            />
            <Pie
              cx={130}
              cy={130}
              data={breakdown.options}
              dataKey="value"
              isAnimationActive={false}
              outerRadius={120}
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
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
          </PieChart>
        </div>

        <div className="flex flex-col gap-3.75">
          {breakdown.options.map((option, index) => (
            <span
              className={cn(
                '-mx-1.5 flex cursor-pointer items-center gap-2 rounded-[6px] px-1.5 py-0.5 transition-all duration-150',
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
                  'text-[14px] text-[#404040]',
                  activeIndex === index && 'font-semibold text-[#14181f]',
                )}
              >
                {option.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
