import { Cell, Pie, PieChart } from 'recharts'

import type { DemographicBreakdown } from '../../data/dashboardAnalytics'
import { getDemographicColor } from './demographicColors'

export type DemographicPieCardProps = {
  breakdown: DemographicBreakdown
}

export function DemographicPieCard({ breakdown }: DemographicPieCardProps) {
  const totalResponses = breakdown.options.reduce((sum, option) => sum + option.value, 0)

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
            <Pie
              cx={130}
              cy={130}
              data={breakdown.options}
              dataKey="value"
              isAnimationActive={false}
              outerRadius={120}
              stroke="none"
            >
              {breakdown.options.map((option, index) => (
                <Cell fill={getDemographicColor(index)} key={option.id} />
              ))}
            </Pie>
          </PieChart>
        </div>

        <div className="flex flex-col gap-3.75">
          {breakdown.options.map((option, index) => (
            <span className="flex items-center gap-2" key={option.id}>
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: getDemographicColor(index) }}
              />
              <span className="text-[14px] text-[#404040]">{option.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
