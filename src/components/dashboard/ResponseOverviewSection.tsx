import type { DemographicBreakdown } from '../../data/dashboardAnalytics'
import { DemographicPieCard } from './DemographicPieCard'
import { MultiChoiceBarCard } from './MultiChoiceBarCard'
import { TextResponseListCard } from './TextResponseListCard'

export type DemographicOverviewSectionProps = {
  title: string
  breakdowns: DemographicBreakdown[]
  /** The dashboard's "Hide names" toggle (text responses). */
  hideNames?: boolean
}

function BreakdownCard({ breakdown, hideNames }: { breakdown: DemographicBreakdown; hideNames?: boolean }) {
  switch (breakdown.kind) {
    case 'single-choice':
      return <DemographicPieCard breakdown={breakdown} />
    case 'multi-choice':
      return <MultiChoiceBarCard breakdown={breakdown} />
    case 'text':
      return <TextResponseListCard breakdown={breakdown} hideNames={hideNames} />
  }
}

export function ResponseOverviewSection({
  title,
  breakdowns,
  hideNames,
}: DemographicOverviewSectionProps) {
  if (breakdowns.length === 0) {
    return null
  }

  const [firstBreakdown, ...restBreakdowns] = breakdowns

  return (
    <section className="flex w-full flex-col gap-3.75">
      <div className="flex w-full flex-col">
        <div className="flex items-center rounded-t-[15px] bg-[#1e55c5] px-7.75 py-2.5">
          <h2 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-white">
            {title}
          </h2>
        </div>
        <div className="rounded-b-[15px] border border-[#e9eaed] bg-white">
          <BreakdownCard breakdown={firstBreakdown} hideNames={hideNames} />
        </div>
      </div>

      {restBreakdowns.map((breakdown) => (
        <div
          className="w-full rounded-[15px] border border-[#e9eaed] bg-white"
          key={breakdown.id}
        >
          <BreakdownCard breakdown={breakdown} hideNames={hideNames} />
        </div>
      ))}
    </section>
  )
}
