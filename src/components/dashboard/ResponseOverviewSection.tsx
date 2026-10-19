import type { DemographicBreakdown } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { DemographicPieCard } from './DemographicPieCard'
import { MultiChoiceBarCard } from './MultiChoiceBarCard'
import { TextResponseListCard } from './TextResponseListCard'

export type DemographicOverviewSectionProps = {
  title: string
  breakdowns: DemographicBreakdown[]
  /** The dashboard's "Hide names" toggle (text responses). */
  hideNames?: boolean
  /** Its heading's `data-tour` target. */
  tourId?: string
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

export function ResponseOverviewSection({ title, breakdowns, hideNames, tourId }: DemographicOverviewSectionProps) {
  if (breakdowns.length === 0) {
    return null
  }

  return (
    // A container query, not a viewport one: the width left over after the sidebar
    // and a docked panel is what decides whether two cards fit side by side.
    <section className="@container flex w-full flex-col gap-3.75">
      <div className="flex items-center rounded-[15px] bg-[#1e55c5] px-7.75 py-2.5" data-tour={tourId}>
        <h2 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3.75 @4xl:grid-cols-2">
        {breakdowns.map((breakdown) => (
          <div
            className={cn(
              'min-w-0 rounded-[15px] border border-[#e9eaed] bg-white',
              // Free-text answers read better across the full width.
              breakdown.kind === 'text' && '@4xl:col-span-2',
            )}
            key={breakdown.id}
          >
            <BreakdownCard breakdown={breakdown} hideNames={hideNames} />
          </div>
        ))}
      </div>
    </section>
  )
}
